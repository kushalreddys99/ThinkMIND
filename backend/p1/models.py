from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class User(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=100)

    def __str__(self):
        return self.email
    

class University(models.Model):
    universityname= models.CharField(max_length=200, default='')
    universitytype= models.CharField(max_length=100, default='')
    universityestablishment = models.DateField(null=True, blank=True)
    fulladdress= models.TextField(default='')
    website = models.CharField(max_length=200, default='')
    uhoi = models.CharField(max_length=100, default='')
    principle= models.CharField(max_length=100, default='')
    collegecode= models.CharField(max_length=50, default='')
    affiliationdetails = models.CharField(max_length=200, default='')
    accredationstatus = models.CharField(max_length=100, default='')
    requireddocs  = models.TextField(default='')
    state  = models.CharField(max_length=100, default='')
    country = models.CharField(max_length=100, default='')
    email  = models.EmailField(default='')
    contact = models.CharField(max_length=15, default='')
    about = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.universityname


class Profile(models.Model):
    firstName   = models.CharField(max_length=100)
    lastName  = models.CharField(max_length=100)
    dob = models.DateField()
    gender  = models.CharField(max_length=10)
    USN  = models.CharField(max_length=20)
    designation  = models.CharField(max_length=100)
    university  = models.ForeignKey(University, on_delete=models.CASCADE)
    universitycode = models.CharField(max_length=20)
    location  = models.CharField(max_length=100)
    email  = models.EmailField()
    password  = models.CharField(max_length=255)
    phone  = models.CharField(max_length=10)
    state = models.CharField(max_length=100)
    country  = models.CharField(max_length=100)

    def __str__(self):
        return self.firstName
    
class ReportFile(models.Model):
    file = models.FileField(upload_to='reports/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file.name

class Report(models.Model):
    usn = models.CharField(max_length=50)
    subject_name = models.CharField(max_length=100)
    written_date = models.DateField(null=True, blank=True)
    marks = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "reports"
        ordering = ["-created_at"]
        unique_together = ('usn', 'subject_name')

    def __str__(self):
        return f"{self.usn} - {self.subject_name}"
    
from django.db import models

class PDFData(models.Model):
    extracted_data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"PDF {self.id}"
