"""
reference_evaluation.py
========================
Complete backend service for the Reference PDF Evaluation System.

SETUP STEPS (run these before starting Django):
------------------------------------------------
1. Install system dependency (Poppler for pdf2image):
   Ubuntu/Debian : sudo apt-get install poppler-utils
   macOS         : brew install poppler
   Windows       : Download from https://github.com/oschwartz10612/poppler-windows/releases
                   and add the bin/ folder to your PATH.

2. Install Python dependencies:
   pip install paddleocr paddlepaddle pdf2image Pillow numpy requests django djangorestframework

3. Install and start Ollama:
   - Download from https://ollama.com
   - Then pull a model: ollama pull llama3
   - Start server:     ollama serve          (runs on http://localhost:11434)

4. Wire this file into your Django project:
   - Place this file anywhere in your Django app (e.g. myapp/reference_evaluation.py)
   - In your urls.py add:
       from myapp.reference_evaluation import reference_evaluation
       urlpatterns = [
           ...
           path('api/reference-evaluation/', reference_evaluation),
       ]

HOW IT WORKS (matches your React frontend exactly):
----------------------------------------------------
Frontend sends POST /api/reference-evaluation/ with:
  - file            : student's PDF (handwritten or typed)
  - reference_pdf   : teacher's reference/answer-key PDF

Backend returns:
  {
    "total_questions" : 5,
    "total_score"     : 38,
    "max_score"       : 50,
    "percentage"      : 76.0,
    "results": [
      { "question_number": 1, "marks_obtained": 8, "marks_out_of": 10 },
      ...
    ]
  }
"""

import json
import logging
import os
import numpy as np
import requests

from pdf2image import convert_from_bytes
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework.response import Response

logger = logging.getLogger(__name__)

if not hasattr(np, "sctypes"):
    # imgaug, used by PaddleOCR, still expects np.sctypes. NumPy removed it in
    # 2.0, so provide the small subset imgaug needs before importing PaddleOCR.
    np.sctypes = {
        "int": [np.int8, np.int16, np.int32, np.int64],
        "uint": [np.uint8, np.uint16, np.uint32, np.uint64],
        "float": [np.float16, np.float32, np.float64],
        "complex": [np.complex64, np.complex128],
        "others": [np.bool_, np.object_, np.bytes_, np.str_],
    }

ocr_model = None


def get_ocr_model():
    global ocr_model
    if ocr_model is None:
        from paddleocr import PaddleOCR

        ocr_model = PaddleOCR(use_angle_cls=True, lang="en")
    return ocr_model

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", "120"))


# ===========================================================================
# STEP 1 — OCR: PDF → raw text
# ===========================================================================

def pdf_bytes_to_text(pdf_bytes: bytes) -> str:
    """
    Convert every page of a PDF to an image, run PaddleOCR on each page,
    and return the concatenated plain text.

    Why images instead of pdfplumber?
      pdfplumber reads the embedded text layer. Handwritten or scanned PDFs
      have NO text layer — they are just images of ink on paper. We must
      render each page as a raster image first, then apply OCR.
    """
    try:
        # pdf2image converts each page to a PIL Image object
        pages = convert_from_bytes(pdf_bytes, dpi=200)
    except Exception as e:
        logger.error(f"pdf2image failed: {e}")
        raise RuntimeError(
            "Could not render PDF pages. "
            "Make sure Poppler is installed (see setup steps at top of file)."
        ) from e

    full_text = ""
    model = get_ocr_model()

    for page_num, pil_image in enumerate(pages, start=1):
        # PaddleOCR expects a NumPy array (H, W, 3) in RGB
        img_array = np.array(pil_image)

        # ocr() returns a list of pages; each page is a list of lines.
        # Each line: [ [[x1,y1],[x2,y2],[x3,y3],[x4,y4]], (text, confidence) ]
        ocr_result = model.ocr(img_array)

        page_text = ""
        if ocr_result and ocr_result[0]:          # guard against empty pages
            for line in ocr_result[0]:
                try:
                    # Works for both old and new PaddleOCR versions
                    text = line[1][0]
                except (IndexError, TypeError):
                    text = str(line)
                page_text += text + " "

        full_text += f"\n--- Page {page_num} ---\n" + page_text

    logger.info(f"OCR extracted {len(full_text)} characters from {len(pages)} pages.")
    return full_text.strip()


# ===========================================================================
# STEP 2 — LLM Parsing: raw text → structured Q&A list
# ===========================================================================

def _extract_ollama_error(resp: requests.Response) -> str:
    """Return the most useful error text Ollama sent back."""
    try:
        payload = resp.json()
    except ValueError:
        return resp.text.strip()

    if isinstance(payload, dict):
        for key in ("error", "message", "detail"):
            if payload.get(key):
                return str(payload[key])
    return json.dumps(payload)


def _call_ollama(prompt: str) -> str:
    """
    Send a prompt to the locally running Ollama server and return the
    raw response string.  Raises RuntimeError if Ollama is unreachable.
    """
    try:
        resp = requests.post(
            OLLAMA_URL,
            json={
                "model" : OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
            },
            timeout=OLLAMA_TIMEOUT,   # large documents can take a while
        )
        if not resp.ok:
            ollama_error = _extract_ollama_error(resp)
            details = (
                f"Ollama returned HTTP {resp.status_code} for model "
                f"'{OLLAMA_MODEL}' at {OLLAMA_URL}."
            )
            if ollama_error:
                details += f" Details: {ollama_error}"
            if resp.status_code == 404:
                details += f" Pull the model with: ollama pull {OLLAMA_MODEL}"
            elif resp.status_code >= 500:
                details += (
                    " Check that Ollama is running, the model is pulled, and the "
                    "machine has enough memory to load it."
                )
            raise RuntimeError(details)

        try:
            data = resp.json()
        except ValueError as e:
            raise RuntimeError("Ollama returned a non-JSON response.") from e

        if "error" in data:
            raise RuntimeError(f"Ollama error: {data['error']}")

        return data.get("response", "")
    except requests.exceptions.ConnectionError:
        raise RuntimeError(
            f"Cannot reach Ollama at {OLLAMA_URL}. "
            "Start it with: ollama serve"
        )
    except requests.exceptions.Timeout:
        raise RuntimeError(
            f"Ollama timed out after {OLLAMA_TIMEOUT} seconds while using "
            f"model '{OLLAMA_MODEL}'. Try a smaller model or increase OLLAMA_TIMEOUT."
        )
    except Exception as e:
        if isinstance(e, RuntimeError):
            raise
        raise RuntimeError(f"Ollama request failed: {e}") from e


def _safe_parse_json(raw: str) -> list:
    """
    Strip markdown code fences if present, then parse JSON.
    Returns an empty list on failure so the caller can handle gracefully.
    """
    cleaned = raw.strip()

    # Remove ```json ... ``` or ``` ... ``` wrappers
    if cleaned.startswith("```"):
        lines   = cleaned.splitlines()
        lines   = [l for l in lines if not l.strip().startswith("```")]
        cleaned = "\n".join(lines).strip()

    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, list):
            return parsed
        # Some models wrap the array: {"questions": [...]}
        if isinstance(parsed, dict):
            for v in parsed.values():
                if isinstance(v, list):
                    return v
    except json.JSONDecodeError as e:
        logger.warning(f"JSON parse error: {e}\nRaw text was:\n{cleaned[:500]}")

    return []


def parse_qa_from_text(raw_text: str) -> list:
    """
    Ask the local LLM to extract questions and answers from messy OCR text.

    Returns a list of dicts:
      [{"question_number": 1, "question": "...", "answer": "..."}, ...]

    The LLM handles all formatting variations students might use:
      Q1, Question 1, 1., Ans:, A:, answer:, etc.
    """
    # Truncate to ~3000 chars to stay within most local-model context windows.
    # For larger documents, split into chunks and merge results.
    text_chunk = raw_text[:3000]

    prompt = f"""You are an intelligent exam paper parser.

Your task: extract every question-answer pair from the student exam text below.
The text may be messy, misspelled, or have inconsistent formatting — handle all cases.

Rules:
- Return ONLY a valid JSON array. No markdown, no explanation, nothing else.
- Each element must have exactly these keys:
    "question_number" (integer),
    "question"        (string, the question text or a short label if unclear),
    "answer"          (string, the student's full answer)
- If you cannot find a clear question, use "question_number" as the label.

Exam text:
{text_chunk}

JSON array:"""

    raw_response = _call_ollama(prompt)
    qa_list      = _safe_parse_json(raw_response)

    logger.info(f"Parsed {len(qa_list)} Q&A pairs from student text.")
    return qa_list


def parse_reference_from_text(raw_text: str) -> list:
    """
    Same as parse_qa_from_text but for the teacher's reference/answer-key PDF.
    The reference PDF typically has model answers and marks per question.

    Returns:
      [{"question_number": 1, "model_answer": "...", "max_marks": 10}, ...]
    """
    text_chunk = raw_text[:3000]

    prompt = f"""You are an intelligent exam answer-key parser.

Your task: extract every question and its model answer from the teacher's answer key below.
Also extract the maximum marks for each question if stated (default to 10 if not found).

Rules:
- Return ONLY a valid JSON array. No markdown, no explanation, nothing else.
- Each element must have exactly these keys:
    "question_number" (integer),
    "model_answer"    (string, the ideal/reference answer),
    "max_marks"       (integer, marks allocated; use 10 if not stated)

Answer key text:
{text_chunk}

JSON array:"""

    raw_response  = _call_ollama(prompt)
    ref_list      = _safe_parse_json(raw_response)

    logger.info(f"Parsed {len(ref_list)} reference answers.")
    return ref_list


# ===========================================================================
# STEP 3 — Scoring: compare each student answer to its reference answer
# ===========================================================================

def score_answer(
    question_number : int,
    student_answer  : str,
    model_answer    : str,
    max_marks       : int = 10,
) -> int:
    """
    Ask the local LLM to grade one student answer against the model answer.

    The LLM acts as an examiner: it considers conceptual correctness,
    not just keyword matching, so partial credit is possible.

    Returns an integer score between 0 and max_marks.
    """
    prompt = f"""You are a strict but fair exam evaluator.

Question number : {question_number}
Maximum marks   : {max_marks}

Model answer (what a perfect answer looks like):
{model_answer}

Student's answer:
{student_answer}

Evaluate the student's answer based on:
1. Conceptual correctness
2. Coverage of key points
3. Clarity (minor grammar issues are acceptable)

Reply with ONLY a single integer between 0 and {max_marks}.
No explanation. No text. Just the number."""

    try:
        raw = _call_ollama(prompt).strip()
        # Extract first integer found in the response
        import re
        match = re.search(r"\d+", raw)
        if match:
            score = int(match.group())
            return max(0, min(max_marks, score))   # clamp to [0, max_marks]
    except Exception as e:
        logger.warning(f"Scoring failed for Q{question_number}: {e}")

    return 0   # default to 0 on any failure


def score_all(student_qa: list, reference_qa: list) -> list:
    """
    Match each student answer to the corresponding reference answer by
    question_number, then score it.

    Returns a list of result dicts ready for the API response.
    """
    # Build a lookup: question_number -> reference entry
    ref_map = {
        int(r.get("question_number", 0)): r
        for r in reference_qa
    }

    results = []

    for item in student_qa:
        q_num          = int(item.get("question_number", 0))
        student_answer = item.get("answer", "").strip()
        ref_entry      = ref_map.get(q_num, {})
        model_answer   = ref_entry.get("model_answer", "")
        max_marks      = int(ref_entry.get("max_marks", 10))

        if not student_answer:
            marks = 0
        elif not model_answer:
            # No reference answer found for this question — skip scoring
            logger.warning(f"No reference answer for Q{q_num}, awarding 0.")
            marks = 0
        else:
            marks = score_answer(q_num, student_answer, model_answer, max_marks)

        results.append({
            "question_number": q_num,
            "marks_obtained" : marks,
            "marks_out_of"   : max_marks,
        })

    return results


# ===========================================================================
# STEP 4 — Django API View (the endpoint your React frontend calls)
# ===========================================================================

@csrf_exempt
@api_view(["POST"])
def reference_evaluation1(request):
    """
    POST /api/reference-evaluation/

    Expects multipart/form-data:
      file          : student PDF
      reference_pdf : teacher reference / answer-key PDF

    Returns JSON matching what your React frontend expects:
      {
        "total_questions": int,
        "total_score"    : int,
        "max_score"      : int,
        "percentage"     : float,
        "results"        : [
          { "question_number": int, "marks_obtained": int, "marks_out_of": int },
          ...
        ]
      }
    """
    # ── 1. Validate uploaded files ──────────────────────────────────────────
    student_file   = request.FILES.get("file")
    reference_file = request.FILES.get("reference_pdf")

    if not student_file:
        return Response({"error": "No student PDF uploaded (field: 'file')"}, status=400)

    if not reference_file:
        return Response({"error": "No reference PDF uploaded (field: 'reference_pdf')"}, status=400)

    for f in [student_file, reference_file]:
        if not f.name.lower().endswith(".pdf"):
            return Response({"error": f"'{f.name}' is not a PDF."}, status=400)

    # ── 2. Read file bytes ───────────────────────────────────────────────────
    student_bytes   = student_file.read()
    reference_bytes = reference_file.read()

    try:
        # ── 3. OCR both PDFs ─────────────────────────────────────────────────
        logger.info("Running OCR on student PDF...")
        student_text   = pdf_bytes_to_text(student_bytes)

        logger.info("Running OCR on reference PDF...")
        reference_text = pdf_bytes_to_text(reference_bytes)

        if not student_text.strip():
            return Response({"error": "Could not extract any text from student PDF."}, status=400)

        if not reference_text.strip():
            return Response({"error": "Could not extract any text from reference PDF."}, status=400)

        # ── 4. Parse Q&A pairs using local LLM ──────────────────────────────
        logger.info("Parsing student answers...")
        student_qa  = parse_qa_from_text(student_text)

        logger.info("Parsing reference answers...")
        reference_qa = parse_reference_from_text(reference_text)

        if not student_qa:
            return Response({
                "error"           : "Could not extract any questions/answers from student PDF.",
                "total_questions" : 0,
                "total_score"     : 0,
                "max_score"       : 0,
                "percentage"      : 0.0,
                "results"         : [],
            }, status=400)

        if not reference_qa:
            return Response({
                "error": "Could not extract any answers from reference PDF."
            }, status=400)

        # ── 5. Score each answer ─────────────────────────────────────────────
        logger.info("Scoring answers...")
        results = score_all(student_qa, reference_qa)

        # ── 6. Aggregate totals ──────────────────────────────────────────────
        total_score = sum(r["marks_obtained"] for r in results)
        max_score   = sum(r["marks_out_of"]   for r in results)
        percentage  = round((total_score / max_score) * 100, 2) if max_score > 0 else 0.0

        return Response({
            "total_questions": len(results),
            "total_score"    : total_score,
            "max_score"      : max_score,
            "percentage"     : percentage,
            "results"        : results,
        })

    except RuntimeError as e:
        # Known setup errors (Poppler missing, Ollama down, etc.)
        logger.error(f"Setup error: {e}")
        return Response({"error": str(e)}, status=503)

    except Exception as e:
        logger.exception("Unexpected error in reference_evaluation")
        return Response({"error": f"Internal server error: {str(e)}"}, status=500)
    
@csrf_exempt
@api_view(["POST"])
def reference_evaluation(request):
    print("FILES received:", request.FILES.keys())
    print("Student file:", request.FILES.get("file"))
    print("Reference file:", request.FILES.get("reference_pdf"))
    
    student_file = request.FILES.get("file")
    reference_file = request.FILES.get("reference_pdf")
    
    print("Student size:", student_file.size if student_file else "MISSING")
    print("Reference size:", reference_file.size if reference_file else "MISSING")
