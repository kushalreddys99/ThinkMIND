import re
import logging
import pdfplumber
import string

from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework.response import Response

from nltk.tokenize import wordpunct_tokenize
from nltk.translate.bleu_score import sentence_bleu, SmoothingFunction

logger = logging.getLogger(__name__)


def clean_text(text):
    text = text.strip()
    text = re.sub(r'\n+',   ' ', text)   
    text = re.sub(r'\s{2,}', ' ', text)  
    text = text.strip(string.punctuation + " ")
    return text


def extract_qa_from_pdf(file):
    """
    Reads all pages from a PDF and returns Q&A pairs.
    Returns: [{"question": "...", "answer": "..."}, ...]
    """
    full_text = ""
    with pdfplumber.open(file) as pdf:
        for page in pdf.pages:
            raw = page.extract_text() or ""
            raw = raw.replace("\x0c", "\n")
            raw = raw.replace("\r\n", "\n").replace("\r", "\n")
            full_text += "\n" + raw

    pattern = r"(Q\d+\.\s*.*?)\n+\s*Answer\s*[:\-]?\s*(.*?)(?=\s*Q\d+\.|$)"
    matches = re.findall(pattern, full_text, re.DOTALL | re.IGNORECASE)

    pairs = []
    for q, a in matches:
        question = clean_text(q)
        answer   = clean_text(a)
        if question and answer:
            pairs.append({"question": question, "answer": answer})

    return pairs


def get_q_number(question_text):
    m = re.match(r"Q(\d+)\.", question_text.strip(), re.IGNORECASE)
    return int(m.group(1)) if m else None


def match_pairs(student_pairs, reference_pairs):
    """
    Aligns student answers with reference answers by Q number.
    - Student answers written out of order → handled correctly
    - Questions the student skipped → empty student_answer (score = 0)
    Returns list of matched dicts.
    """
    ref_map     = {}
    student_map = {}

    for item in reference_pairs:
        num = get_q_number(item["question"])
        if num:
            ref_map[num] = item

    for item in student_pairs:
        num = get_q_number(item["question"])
        if num:
            student_map[num] = item["answer"]

    matched = []
    for num in sorted(ref_map.keys()):
        matched.append({
            "question_number":  num,
            "question":         ref_map[num]["question"],
            "student_answer":   student_map.get(num, ""),
            "reference_answer": ref_map[num]["answer"],
        })

    return matched


def compute_bleu(reference_text, student_text):
    if not student_text.strip():
        return 0.0

    ref_tokens = wordpunct_tokenize(reference_text.lower())
    stu_tokens = wordpunct_tokenize(student_text.lower())

    if not ref_tokens or not stu_tokens:
        return 0.0

    smoother = SmoothingFunction().method4

    bleu = sentence_bleu(
        references=[ref_tokens],
        hypothesis=stu_tokens,
        weights=(0.5, 0.5),
        smoothing_function=smoother,
    )
    return float(bleu)



def compute_bert_score(reference_text, student_text):
    if not student_text.strip():
        return 0.0

    try:
        from bert_score import score as bert_score

        P, R, F1 = bert_score(
            cands=[student_text],
            refs=[reference_text],
            lang="en",
            model_type="roberta-base",  
            verbose=False,
        )
        return float(F1[0])
    except Exception as e:
        logger.error(f"BERTScore error: {e}")
        return 0.0


BERT_WEIGHT = 0.70
BLEU_WEIGHT = 0.30

def score_one_pair(reference_text, student_text):
    if not student_text.strip():
        return 0

    bleu = compute_bleu(reference_text, student_text)
    bert = compute_bert_score(reference_text, student_text)

    combined = (BERT_WEIGHT * bert) + (BLEU_WEIGHT * bleu)
    return max(0, min(10, round(combined * 10)))


def score_all_pairs(matched_pairs):
    scores = []
    for item in matched_pairs:
        s = score_one_pair(
            reference_text=item["reference_answer"],
            student_text=item["student_answer"],
        )
        logger.info(f"Q{item['question_number']} scored {s}/10")
        scores.append(s)
    return scores

from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.authentication import BasicAuthentication
from django.views.decorators.csrf import csrf_exempt



@csrf_exempt
@api_view(['POST'])
@authentication_classes([])
def reference_evaluation(request):
    try:
        student_file   = request.FILES.get('file')
        reference_file = request.FILES.get('reference_pdf')

        if not student_file:
            return Response({"error": "Student PDF not uploaded"}, status=400)
        if not reference_file:
            return Response({"error": "Reference PDF not uploaded"}, status=400)

        student_pairs   = extract_qa_from_pdf(student_file)
        reference_pairs = extract_qa_from_pdf(reference_file)

        if not reference_pairs:
            return Response(
                {"error": "No Q&A found in reference PDF. Check format."},
                status=400
            )
        if not student_pairs:
            return Response(
                {"error": "No Q&A found in student PDF. Check format."},
                status=400
            )

        matched_pairs = match_pairs(student_pairs, reference_pairs)

        if not matched_pairs:
            return Response(
                {"error": "Could not match questions between the two PDFs."},
                status=400
            )

        scores = score_all_pairs(matched_pairs)

        max_score   = len(matched_pairs) * 10
        total_score = sum(scores)
        percentage  = (
            round((total_score / max_score) * 100, 2)
            if max_score > 0 else 0.0
        )

        results = [
            {
                "question_number": matched_pairs[i]["question_number"],
                "marks_obtained":  scores[i],
                "marks_out_of":    10,
            }
            for i in range(len(matched_pairs))
        ]

        return Response({
            "total_questions": len(matched_pairs),
            "total_score":     total_score,
            "max_score":       max_score,
            "percentage":      percentage,
            "results":         results,
        })

    except Exception as e:
        logger.error(f"reference_evaluation error: {e}")
        return Response({"error": str(e)}, status=500)
