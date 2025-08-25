from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, History

# Register your models here.
admin.site.register(CustomUser, UserAdmin)

@admin.register(History)
class HistoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'action_type', 'title', 'score', 'created_at')
    list_filter = ('action_type', 'created_at', 'user')
    search_fields = ('title', 'description', 'user__username', 'user__email')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('User Information', {
            'fields': ('user',)
        }),
        ('Activity Details', {
            'fields': ('action_type', 'title', 'description')
        }),
        ('Analysis Data', {
            'fields': ('score', 'job_description'),
            'classes': ('collapse',)
        }),
        ('File Information', {
            'fields': ('file_path',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
