from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from .models import User, University, Profile, ReportFile, Report
from .serializers import StudentSerializer, ReportFileSerializer
from datetime import datetime, timedelta
import logging
from rest_framework import status
import pdfplumber
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from groq import Groq
import json
import re
import time

@ensure_csrf_cookie
def get_csrf(request):
    return JsonResponse({"message": "CSRF cookie set"})

logger = logging.getLogger(__name__)

client = Groq(api_key="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")


def parse_date(value):
    if isinstance(value, (int, float)):
        return datetime(1899, 12, 30) + timedelta(days=value)
    if not value:
        return None
    value = str(value).strip()
    try:
        return datetime.fromisoformat(value.replace("Z", ""))
    except:
        pass
    for fmt in ["%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%Y-%m-%d %H:%M:%S"]:
        try:
            return datetime.strptime(value, fmt)
        except:
            continue
    raise ValueError(f"Invalid date format: {value}")


@api_view(['POST'])
def signup(request):
    data = request.data
    if User.objects.filter(email=data['email']).exists():
        return Response({"error": "Email already exists"}, status=400)
    User.objects.create(name=data['name'], email=data.get('email'), password=data.get('password'))
    return Response({"message": "User created successfully"})


@api_view(['POST'])
def login(request):
    try:
        data = request.data
        email, password = data.get('email'), data.get('password')
        if not email or not password:
            return Response({"error": "Email and password required"}, status=400)
        user = User.objects.filter(email=email, password=password).first()
        if user:
            return Response({"message": "Login successful", "user": user.email})
        return Response({"error": "Invalid credentials"}, status=400)
    except Exception:
        return Response({"error": "Server error"}, status=500)


@api_view(['GET'])
def get_universities(request):
    universities = University.objects.all().values('id', 'universityname')
    return Response([{'id': u['id'], 'name': u['universityname']} for u in universities])


@api_view(['POST'])
def create_university(request):
    data = request.data
    University.objects.create(
        universityname=data.get('universityname'), universitytype=data.get('universitytype'),
        universityestablishment=data.get('universityestablishment'), fulladdress=data.get('fulladdress'),
        website=data.get('website'), uhoi=data.get('uhoi'), principle=data.get('principle'),
        collegecode=data.get('collegecode'), affiliationdetails=data.get('affiliationdetails'),
        accredationstatus=data.get('accredationstatus'), requireddocs=data.get('requireddocs'),
        state=data.get('state'), country=data.get('country'), email=data.get('email'),
        contact=data.get('contact'), about=data.get('about', ''),
    )
    return Response({"message": "University registered successfully"})


@api_view(['POST'])
def create_profile(request):
    data = request.data
    try:
        university = University.objects.get(id=data.get('university'))
        Profile.objects.create(
            firstName=data.get('firstName'), lastName=data.get('lastName'),
            dob=data.get('dob'), gender=data.get('gender'), USN=data.get('USN'),
            designation=data.get('designation'), university=university,
            universitycode=data.get('universitycode'), location=data.get('location'),
            email=data.get('email'), password=data.get('password'), phone=data.get('phone'),
            state=data.get('state'), country=data.get('country'),
        )
        return Response({"message": "Profile created successfully"})
    except University.DoesNotExist:
        return Response({"error": "Invalid university"}, status=400)


@api_view(['GET'])
def get_students(request):
    students = Profile.objects.select_related('university').all()
    serializer = StudentSerializer(students, many=True)
    return Response(serializer.data)


@csrf_exempt
@api_view(['DELETE'])
def delete_student(request, id):
    try:
        student = Profile.objects.get(id=id)
    except Profile.DoesNotExist:
        return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
    student.delete()
    return Response({"message": "Student deleted successfully"}, status=status.HTTP_200_OK)


@api_view(['POST'])
def upload_files(request):
    files = request.FILES.getlist('files')
    saved_files = [ReportFile.objects.create(file=f) for f in files]
    serializer = ReportFileSerializer(saved_files, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def get_files(request):
    files = ReportFile.objects.all().order_by('-uploaded_at')
    serializer = ReportFileSerializer(files, many=True)
    return Response(serializer.data)


@csrf_exempt
@api_view(['POST'])
def bulk_upload(request):
    data = request.data.get("data", [])
    if not isinstance(data, list):
        return Response({"error": "Invalid data format"}, status=400)
    valid_objects, failed = [], []
    existing_records = set(Report.objects.values_list("usn", "subject_name"))
    for index, row in enumerate(data):
        try:
            usn = str(row.get("USN", "")).strip()
            subject = str(row.get("Subject Name", "")).strip()
            date_str = row.get("Written Date", "")
            marks_str = row.get("Marks Obtained", "")
            if not usn: raise ValueError("USN is required")
            if not subject: raise ValueError("Subject Name is required")
            written_date = parse_date(date_str).date() if date_str else None
            marks = int(float(marks_str)) if marks_str else 0
            if marks < 0 or marks > 100: raise ValueError("Marks must be 0-100")
            if (usn, subject) in existing_records: raise ValueError("Duplicate USN,Subject")
            valid_objects.append(Report(usn=usn, subject_name=subject, written_date=written_date, marks=marks))
        except Exception as e:
            failed.append({"row": index + 1, "error": str(e)})
    inserted_count = 0
    if valid_objects:
        Report.objects.bulk_create(valid_objects, ignore_conflicts=True)
        inserted_count = len(valid_objects)
    failed_count = len(failed)
    if inserted_count > 0 and failed_count == 0:
        message, response_status = "All records uploaded successfully", status.HTTP_200_OK
    elif inserted_count > 0:
        message, response_status = "Partially uploaded", status.HTTP_207_MULTI_STATUS
    else:
        message, response_status = "No records uploaded", status.HTTP_400_BAD_REQUEST
    return Response({"message": message, "insertedCount": inserted_count, "failedCount": failed_count, "failedRows": failed}, status=response_status)


@api_view(['POST'])
def read_pdf(request):
    try:
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file uploaded"}, status=400)
        pages = []
        with pdfplumber.open(file) as pdf:
            for i, page in enumerate(pdf.pages):
                pages.append({"page": i + 1, "text": page.extract_text() or ""})
        return Response({"message": "PDF processed successfully", "pages": pages}, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


from .models import PDFData



def extract_questions_answers(text):
    pattern = r"(Q\d+\..*?)\nAnswer:\s*(.*?)(?=Q\d+\.|$)"
    matches = re.findall(pattern, text, re.DOTALL)
    return [{"question": q.strip(), "answer": a.strip()} for q, a in matches]


def score_all_answers(qa_pairs, max_retries=4):
    """
    Returns a list of integer scores (0-10), one per question.
    Makes exactly ONE API call. Retries only on rate-limit (429).
    """
    n = len(qa_pairs)

    lines = []
    for i, item in enumerate(qa_pairs, start=1):
        q = item["question"][:200]         
        a = item["answer"][:300]            
        lines.append(f"[{i}] Q:{q} | A:{a}")

    user_msg = (
        f"Score each answer out of 10. "
        f"Return ONLY a JSON int array of exactly {n} numbers. No text.\n\n"
        + "\n".join(lines)
    )

    wait = 8  

    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are an exam scorer. Return only a JSON integer array."},
                    {"role": "user",   "content": user_msg},
                ],
                temperature=0,      
                max_tokens=60,      
            )

            raw = response.choices[0].message.content.strip()
            start, end = raw.find("["), raw.rfind("]") + 1
            scores = json.loads(raw[start:end])

            if len(scores) != n:
                raise ValueError(f"Expected {n} scores, got {len(scores)}")

            
            return [max(0, min(10, int(s))) for s in scores]

        except Exception as e:
            err = str(e)
            is_rate_limit = "429" in err or "rate" in err.lower() or "quota" in err.lower()

            if is_rate_limit and attempt < max_retries - 1:
                logger.warning(f"Rate limit — waiting {wait}s (attempt {attempt+1}/{max_retries})")
                time.sleep(wait)
                wait *= 2           
            else:
                logger.error(f"Scoring failed: {err}")
                return [0] * n     

    return [0] * n



@csrf_exempt
@api_view(['POST'])
def upload_pdf(request):
    try:
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file uploaded"}, status=400)

        full_text = ""
        with pdfplumber.open(file) as pdf:
            for page in pdf.pages:
                full_text += "\n" + (page.extract_text() or "")

        
        qa_pairs = extract_questions_answers(full_text)

        if not qa_pairs:
            return Response({
                "total_questions": 0,
                "total_score":     0,
                "max_score":       0,
                "percentage":      0.0,
                "results":         []
            })

        scores = score_all_answers(qa_pairs)

        max_score   = len(qa_pairs) * 10
        total_score = sum(scores)
        percentage  = round((total_score / max_score) * 100, 2) if max_score > 0 else 0.0

        results = [
            {
                "question_number": i + 1,
                "marks_obtained":  scores[i],
                "marks_out_of":    10,
            }
            for i in range(len(qa_pairs))
        ]

        return Response({
            "total_questions": len(qa_pairs),
            "total_score":     total_score,
            "max_score":       max_score,
            "percentage":      percentage,
            "results":         results,
        })

    except Exception as e:
        logger.error(f"upload_pdf error: {e}")
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
def get_pdf(request, id):
    try:
        pdf = PDFData.objects.get(id=id)
        return Response({"id": pdf.id, "pages": pdf.extracted_data})
    except PDFData.DoesNotExist:
        return Response({"error": "Not found"}, status=404) 