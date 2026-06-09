from django.urls import path
from django.views.decorators.csrf import csrf_exempt

from .views import get_csrf,read_pdf
from .views import read_pdf

from .views import upload_pdf
from .reference_evaluation import reference_evaluation

from . import views
from .views import upload_pdf, get_pdf
from .views import (
    signup, login, get_universities,
    create_profile, create_university,
    get_students, upload_files,
    get_files, bulk_upload
)
from .Reference_evaluation1 import reference_evaluation1



urlpatterns = [
    path('signup/', signup),
    path('login/', login),
    path('universities/', get_universities),
    path('create-profile/', create_profile),
    path('create-university/', create_university),
    path('students/', get_students),
    path('upload-files/', upload_files),
    path('get-files/', get_files),
    path('bulk/', bulk_upload),
    path("get-csrf/", get_csrf),
    path('read-pdf/', read_pdf, name='read_pdf'),
    path('upload-pdf/', upload_pdf),
    path('get-pdf/<int:id>/', get_pdf),
    path('students/<int:id>/', views.delete_student, name='delete_student'),
    path('reference-evaluation1/', reference_evaluation1),
    path('reference-evaluation/', csrf_exempt(reference_evaluation), name='reference_evaluation'),

]

