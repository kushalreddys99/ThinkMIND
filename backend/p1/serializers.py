
from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'

from .models import Profile

class StudentSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    university_name = serializers.CharField(source='university.universityname')

    class Meta:
        model = Profile
        fields = ['id', 'name', 'email', 'phone','USN', 'university_name']

    def get_name(self, obj):
        return f"{obj.firstName} {obj.lastName}"

from .models import ReportFile

class ReportFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportFile
        fields = '__all__'