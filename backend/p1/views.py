from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import User, University, Profile, ReportFile, Report
from .serializers import StudentSerializer, ReportFileSerializer
from datetime import datetime, timedelta
import logging
from rest_framework import status
import pdfplumber
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie

@ensure_csrf_cookie
def get_csrf(request):
    return JsonResponse({"message": "CSRF cookie set"})
logger = logging.getLogger(__name__)

def parse_date(value):
    print("RAW DATE:", value, type(value))

    if isinstance(value, (int, float)):
        return datetime(1899, 12, 30) + timedelta(days=value)

    if not value:
        return None

    value = str(value).strip()

    try:
        return datetime.fromisoformat(value.replace("Z", ""))
    except:
        pass

    formats = [
        "%Y-%m-%d",
        "%d-%m-%Y",
        "%d/%m/%Y",
        "%Y-%m-%d %H:%M:%S",
    ]

    for fmt in formats:
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

    user = User.objects.create(
        name=data['name'],
        email = data.get('email'),
        password = data.get('password')
    )

    return Response({"message": "User created successfully"})

@api_view(['POST'])
def login(request):
    try:
        data = request.data

        # ✅ SAFE extraction
        email = data.get('email')
        password = data.get('password')

        # ✅ Validation
        if not email or not password:
            return Response({"error": "Email and password required"}, status=400)

        # ✅ SAFE query (no crash)
        user = User.objects.filter(email=email, password=password).first()

        if user:
            return Response({
                "message": "Login successful",
                "user": user.email
            })
        else:
            return Response({"error": "Invalid credentials"}, status=400)

    except Exception as e:
        print("LOGIN ERROR:", str(e))  # 🔴 check terminal
        return Response({"error": "Server error"}, status=500)
@api_view(['GET'])
def get_universities(request):
    universities = University.objects.all().values('id', 'universityname')
    return Response([
        {'id': u['id'], 'name': u['universityname']}
        for u in universities
    ])

@api_view(['POST'])
def create_university(request):
    data = request.data
 
    University.objects.create(
        universityname          = data.get('universityname'),
        universitytype          = data.get('universitytype'),
        universityestablishment = data.get('universityestablishment'),
        fulladdress             = data.get('fulladdress'),
        website                 = data.get('website'),
        uhoi                    = data.get('uhoi'),
        principle               = data.get('principle'),
        collegecode             = data.get('collegecode'),
        affiliationdetails      = data.get('affiliationdetails'),
        accredationstatus       = data.get('accredationstatus'),
        requireddocs            = data.get('requireddocs'),
        state                   = data.get('state'),
        country                 = data.get('country'),
        email                   = data.get('email'),
        contact                 = data.get('contact'),
        about                   = data.get('about', ''),
    )
 
    return Response({"message": "University registered successfully"})

@api_view(['POST'])
def create_profile(request):
    data = request.data

    try:
        university = University.objects.get(id=data.get('university'))

        Profile.objects.create(
            firstName=data.get('firstName'),
            lastName=data.get('lastName'),
            dob=data.get('dob'),
            gender=data.get('gender'),
            USN=data.get('USN'),
            designation=data.get('designation'),
            university=university,
            universitycode=data.get('universitycode'),
            location=data.get('location'),
            email=data.get('email'),
            password=data.get('password'),
            phone=data.get('phone'),
            state=data.get('state'),
            country=data.get('country'),
        )

        return Response({"message": "Profile created successfully"})

    except University.DoesNotExist:
        return Response({"error": "Invalid university"}, status=400)

@api_view(['GET'])
def get_students(request):
    students = Profile.objects.select_related('university').all()
    serializer = StudentSerializer(students, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def upload_files(request):
    files = request.FILES.getlist('files')

    saved_files = []

    for f in files:
        file_obj = ReportFile.objects.create(file=f)
        saved_files.append(file_obj)

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
    logger.info(f"Received bulk data: {len(request.data.get('data', []))} rows")
    
    data = request.data.get("data", [])

    if not isinstance(data, list):
        return Response({"error": "Invalid data format"}, status=400)

    valid_objects = []
    failed = []

    existing_records = set(
        Report.objects.values_list("usn", "subject_name")
    )

    for index, row in enumerate(data):
        try:
            usn = str(row.get("USN", "")).strip()
            subject = str(row.get("Subject Name", "")).strip()
            date_str = row.get("Written Date", "")
            marks_str = row.get("Marks Obtained", "")
            
            if not usn:
                raise ValueError("USN is required")

            if not subject:
                raise ValueError("Subject Name is required")

            written_date = parse_date(date_str).date() if date_str else None
            
            marks = int(float(marks_str)) if marks_str else 0
            if marks < 0 or marks > 100:
                raise ValueError("Marks must be 0-100")

            if (usn, subject) in existing_records:
                raise ValueError("Duplicate USN,Subject")

            valid_objects.append(
                Report(
                    usn=usn,
                    subject_name=subject,
                    written_date=written_date,
                    marks=marks
                )
            )

        except Exception as e:
            error_msg = str(e)
            logger.error(f"Row {index+1} failed: {error_msg}")
            failed.append({
                "row": index + 1,
                "data": {k: v for k, v in row.items() if k in ["USN", "Subject Name", "Written Date", "Marks Obtained"]},
                "error": error_msg
            })

    inserted_count = 0
    if valid_objects:
        Report.objects.bulk_create(valid_objects, ignore_conflicts=True)
        inserted_count = len(valid_objects)
        logger.info(f"Inserted {inserted_count} records")
    failed_count=len(failed)
    if inserted_count>0 and failed_count==0:
        message="all recordes uploaded successfully"
        response_status=status.HTTP_200_OK
    elif inserted_count>0 and failed_count>0:
        message="partially uploaded"
       
        response_status = status.HTTP_207_MULTI_STATUS  
    else:
        message = "No Records uploaded"
        response_status = status.HTTP_400_BAD_REQUEST

    response_data = {
        "message":message,
        "insertedCount": inserted_count,
        "failedCount": len(failed),
        "failedRows": failed,
    }
    logger.info(f"Bulk upload result: {response_data}")
    return Response(response_data,status=response_status)

@api_view(['POST'])
def read_pdf(request):
    try:
        file = request.FILES.get('file')

        if not file:
            return Response({"error": "No file uploaded"}, status=400)

     
        pages = []

        with pdfplumber.open(file) as pdf:
            for i, page in enumerate(pdf.pages):
                text = page.extract_text() or ""

                pages.append({
                    "page": i + 1,
                    "text": text   
                })

        return Response({
            "message": "PDF processed successfully",
            "pages": pages
        }, status=200)

    except Exception as e:
        return Response({
            "error": str(e)
        }, status=500)
from rest_framework.decorators import api_view
from rest_framework.response import Response
import pdfplumber
from .models import PDFData

@api_view(['POST'])
def upload_pdf(request):
    try:
        file = request.FILES.get('file')

        if not file:
            return Response({"error": "No file uploaded"}, status=400)

        pages = []

        with pdfplumber.open(file) as pdf:
            for i, page in enumerate(pdf.pages):
                text = page.extract_text() or ""

                pages.append({
                    "page": i + 1,
                    "text": text
                })

        pdf_obj = PDFData.objects.create(
            extracted_data=pages
        )

        return Response({
            "message": "PDF stored successfully",
            "id": pdf_obj.id,     
            "pages": pages
        })

    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
def get_pdf(request, id):
    try:
        pdf = PDFData.objects.get(id=id)

        return Response({
            "id": pdf.id,
            "pages": pdf.extracted_data
        })

    except PDFData.DoesNotExist:
        return Response({"error": "Not found"}, status=404)