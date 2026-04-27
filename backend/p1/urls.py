from django.urls import path

from .views import get_csrf,read_pdf


from .views import upload_pdf, get_pdf
from .views import (
    signup, login, get_universities,
    create_profile, create_university,
    get_students, upload_files,
    get_files, bulk_upload
)

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
]
from .views import read_pdf

