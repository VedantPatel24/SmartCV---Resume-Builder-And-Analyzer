from django.urls import path
from . import views

urlpatterns = [
    path('analyze', views.analyze_resume),
    path('build', views.build_resume),
    path('register', views.register_user),
    path('login', views.login_user),
    path('me', views.me),
    path('update-profile', views.update_profile),
    path('history', views.get_history),
    path('save-history', views.save_history),
    path('delete-history/<int:history_id>', views.delete_history),
    path('save-draft', views.save_draft),
    path('list-drafts', views.list_drafts),
    path('get-draft/<int:draft_id>', views.get_draft),
    path('admin-dashboard', views.admin_dashboard),
    path('admin-users', views.admin_users),
    path('admin-test', views.admin_test),
    path('generate-charts/', views.generate_charts, name='generate_charts'),
    path('career-paths', views.get_career_paths),
    path('job-details', views.get_job_details),
    path('download-resume', views.download_resume),
]