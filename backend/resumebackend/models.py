from django.db import models
from django.contrib.auth.models import AbstractUser
# Create your models here.

class CustomUser(AbstractUser):
    # email is already included in AbstractUser
    pass

class History(models.Model):
    ACTION_TYPES = [
        ('analyzer', 'Resume Analyzer'),
        ('builder', 'Resume Builder'),
        ('draft', 'Resume Draft'),
    ]
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='history')
    action_type = models.CharField(max_length=20, choices=ACTION_TYPES)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    file_path = models.CharField(max_length=500, blank=True)  # For generated resumes
    score = models.FloatField(null=True, blank=True)  # For ATS scores
    job_description = models.TextField(blank=True)  # For analyzer jobs
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Histories'
    
    def __str__(self):
        return f"{self.user.username} - {self.action_type} - {self.title}"