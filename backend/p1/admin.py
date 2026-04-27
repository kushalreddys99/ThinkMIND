from django.contrib import admin


from .models import User, University, Profile

admin.site.register(User)
admin.site.register(University)
admin.site.register(Profile)