from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone

import PyPDF2
import requests
import pandas as pd
import joblib
import json

from fuzzywuzzy import fuzz
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS
import re
import spacy

# For Builder
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
import os
import sys

from .resume_layout import ResumeLayoutEngine

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(BASE_DIR, "ML", "job_prediction"))
@api_view(['POST'])
def analyze_resume(request):
    pdf_file = request.FILES.get('pdf')

    # Job Description - 2
    jd = request.data.get('job_description', '')

    if not pdf_file:
        return Response({"error": "No PDF file uploaded."}, status=400)
    
    # ATS Model - 1
    model_path = os.path.join(BASE_DIR, "ML", "ATS_Score", "model", "ats_score_model.pkl")
    model = joblib.load(model_path)
    
    reader = PyPDF2.PdfReader(pdf_file)
    text = "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])

    parsed_resume = extract_resume_data_from_text(text)
    # with open("DhruvrajSinh's Resume Parsed Data.txt", "w") as file:
    #     json.dump(parsed_resume, file, indent=4)

    features = extract_features_from_api_json(parsed_resume)
    input_df = pd.DataFrame([features])

    ats_score = model.predict(input_df)[0]

    # Matched, Not Matched, Total-Matched, Total-Not-Matched, Match-Percentage - 3 to 7
    resume_skills = parsed_resume.get("data", {}).get("skills", [])
    matched, missing, matched_count, total_required, match_percent = match_skills(resume_skills, jd)

    # Suggestions - 8
    suggestions = generate_suggestions(parsed_resume.get("data", {}), missing, match_percent)

    # Job Prediction - 10
    model_path_job_prediction = os.path.join(BASE_DIR, "ML", "Job_Prediction", "model", "job_role_model.pkl")
    vectorizer_path_job_prediction = os.path.join(BASE_DIR, "ML", "Job_Prediction", "model", "job_role_vectorizer.pkl")

    predicted_role = predict_job_role(", ".join(resume_skills), model_path_job_prediction, vectorizer_path_job_prediction)
    # predicted_role = predict_job_role("react, node, mongodb, docker", model_path_job_prediction, vectorizer_path_job_prediction)

    # Save to history if user is authenticated
    try:
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ', 1)[1]
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            email = payload.get('email')
            user = User.objects.get(email=email)
            
            # Create history entry
            title = f"Resume Analysis - {pdf_file.name}"
            description = f"ATS Score: {round(((ats_score*100)/9.0),2)}%, Match: {match_percent}%, Role: {predicted_role}"
            
            History.objects.create(
                user=user,
                action_type='analyzer',
                title=title,
                description=description,
                score=round(((ats_score*100)/9.0),2),
                job_description=jd[:200] + "..." if len(jd) > 200 else jd
            )
    except Exception as e:
        # If history saving fails, continue with the response
        pass

    return Response({
        "ats_score": round(((ats_score*100)/9.0),2),
        "job_description": jd,

        "matched_skills": matched,
        "missing_skills": missing,
        "total_skills_matched": matched_count,
        "total_skills_required": total_required,
        "match_percentage": match_percent,

        "suggestions": suggestions,
        
        "resume_sections": parsed_resume.get("data", {}),
        
        "predicted_role": predicted_role
    })

# Job Prediction - 10
def predict_job_role(skills_input , model_path, vectorizer_path):

    job_model = joblib.load(model_path)
    vectorizer = joblib.load(vectorizer_path)

    # Preprocess input
    cleaned = skills_input.lower().replace(";", ",").replace("|", ",").replace("  ", " ").strip()
    vectorized = vectorizer.transform([cleaned])
    prediction = job_model.predict(vectorized)
    # print(prediction)
    return prediction[0]


# Get json data of resume using API
def extract_resume_data_from_text(text):
    
    url = "https://resume-parser-api1.p.rapidapi.com/v1/parse/text"

    payload = text
    headers = {
        'x-rapidapi-key': "874a92b148msh54130c150899805p16f241jsn168d2e10a114",
        'x-rapidapi-host': "resume-parser-api1.p.rapidapi.com",
        'Content-Type': "text/plain"
    }

    print(text)
    try:
        response = requests.post(url, data=payload, headers=headers)
        response.raise_for_status()
        return response.json()


        # response = json.load(open("DhruvrajSinh's Resume Parsed Data.txt"))
        # return response
        
    except Exception as e:
        print("Resume API failed:", e)
        return {"data": {}} 

# Get features from resume json data
def extract_features_from_api_json(api_json):
    """
    Extracts numerical features from structured resume JSON format
    to feed into the ATS scoring model.
    """
    data = api_json["data"]
    
    # Count of skills
    skill_count = len(data.get("skills", []))
    
    # Count of education entries
    education = data.get("education", [])
    education_count = len(education)
    
    # Count of institutions (college)
    college_count = len([edu for edu in education if edu.get("institution")])
    
    # Experience details
    experience = data.get("experience", [])
    experience_count = len(experience)
    company_count = len(set(exp.get("company") for exp in experience if "company" in exp and exp["company"]))

    # Projects
    projects = data.get("projects", [])
    project_count = len(projects)
    
    # Certifications
    certification_count = len(data.get("certifications", []))

    # Summary presence
    has_summary = 1 if data.get("summary") else 0

    # Total text length from project descriptions
    text_length = sum(len(proj.get("description", "")) for proj in projects)

    # Return feature dictionary
    return {
        "skill_count": skill_count,
        "education_count": education_count,
        "college_count": college_count,
        "company_count": company_count,
        "experience_count": experience_count,
        "project_count": project_count,
        # "certification_count": certification_count,
        # "has_summary": has_summary,
        "text_length": text_length
    }

# Provide 3 to 7 of Json Response 
# def match_skills(resume_skills, jd_text):
#     jd_keywords = extract_keywords_from_jd(jd_text)
#     matched = []
#     missing = []

#     for jd_word in jd_keywords:
#         found = False
#         for skill in resume_skills:
#             ratio = fuzz.partial_ratio(skill.lower(), jd_word.lower())
#             if ratio >= 85 :
#                 matched.append(jd_word)
#                 found = True
#                 break
#         if not found:
#             missing.append(jd_word)

#     total_required = len(jd_keywords)
#     total_matched = len(matched)
#     match_percentage = round((total_matched / total_required) * 100, 2) if total_required else 0.0

#     return matched, missing, total_matched, total_required, match_percentage

# def extract_keywords_from_jd(jd_text):
#     known_skills = {
#         "html", "css", "javascript", "react", "react.js", "nodejs", "node", "mongodb",
#         "express", "git", "github", "rest", "restful", "api", "apis", "frontend",
#         "backend", "fullstack", "python", "java", "django", "flask", "mysql", "sql",
#         "typescript", "docker", "aws", "azure", "firebase", "redux", "bootstrap"
#     }

#     text = jd_text.lower()
#     text = re.sub(r'[^\w\s]', '', text)
#     words = set(text.split())

#     # keywords = [word for word in words if word not in ENGLISH_STOP_WORDS and len(word) > 2]
#     cleaned = [skill for skill in known_skills if skill in words]

#     return cleaned


# New 3 To 7 Json Data

# ✅ Alias Mapping
alias_map = {
    "js": "javascript",
    "html5": "html",
    "css3": "css",
    "py": "python",
    "reactjs": "react",
    "nodejs": "node",
    "ml": "machine learning",
    "ai": "artificial intelligence",
    "postgres": "postgresql",
    "tailwindcss": "tailwind",
    "expressjs": "express",
    "next": "nextjs",
    "sklearn": "scikit-learn",
    "deeplearning": "deep learning",
    "sql server": "sql",
    "ms sql": "sql",
    "google cloud": "gcp",
    "docker-compose": "docker"
}

# 🧠 Initialize spaCy
nlp = spacy.load("en_core_web_sm")

# 🔄 Normalize skills
def normalize_skill(term):
    return alias_map.get(term.lower().strip(), term.lower().strip())

# 🧠 Synonym Groups
synonym_map = {
    "tensorflow": ["keras", "pytorch"],
    "pytorch": ["keras", "tensorflow"],
    "keras": ["tensorflow", "pytorch"],
    "sql": ["mysql", "postgresql", "sql server", "ms sql"],
    "git": ["github", "bitbucket"],
    "flask": ["django"],
    "django": ["flask"],
    "aws": ["azure", "gcp"],
    "machine learning": ["deep learning"],
    "data analysis": ["data analytics", "analytics"]
}


def match_skills(resume_skills, jd_text):
    jd_keywords = extract_keywords_from_jd(jd_text)
    matched = []
    missing = []

    resume_skills_normalized = [normalize_skill(skill) for skill in resume_skills]

    # You can modify this list depending on your project’s focus
    core_skills = {"python", "sql", "javascript", "react", "node", "aws", "docker", "django", "machine learning", "data analysis"}

    total_weight = 0.0
    matched_weight = 0.0

    for jd_skill in jd_keywords:
        found = False
        weight = 2.0 if jd_skill in core_skills else 1.0
        total_weight += weight

        for skill in resume_skills_normalized:
            # Direct match via fuzzy logic
            if fuzz.partial_ratio(skill, jd_skill) >= 85:
                matched.append(jd_skill)
                matched_weight += weight
                found = True
                break

            # Check if resume skill matches synonyms of JD skill
            if jd_skill in synonym_map and skill in synonym_map[jd_skill]:
                matched.append(jd_skill)
                matched_weight += weight
                found = True
                break
        if not found:
            missing.append(jd_skill)

    total_required = len(jd_keywords)
    total_matched = len(matched)
    # match_percentage = round((total_matched / total_required) * 100, 2) if total_required else 0.0
    match_percentage = round((matched_weight / total_weight) * 100, 2) if total_weight else 0.0

    return matched, missing, total_matched, total_required, match_percentage

# ✅ Expanded Known Skills
known_skills = {
    "html", "css", "javascript", "react", "vue", "angular", "typescript", "node", "express", 
    "django", "flask", "spring", "java", "python", "c++", "c", "sql", "mysql", "postgresql", 
    "mongodb", "firebase", "aws", "azure", "docker", "kubernetes", "git", "github", "bitbucket", 
    "jira", "rest", "graphql", "redux", "nextjs", "tailwind", "bootstrap", "pandas", "numpy", 
    "matplotlib", "seaborn", "scikit-learn", "tensorflow", "keras", "pytorch", "nlp", "opencv",
    "data analysis", "machine learning", "deep learning", "linux", "bash", "shell scripting",
    "android", "kotlin", "swift", "firebase auth", "firebase firestore"
}

# 🔍 Extract Keywords from JD using Known Skills + Aliases
def extract_keywords_from_jd(jd_text):
    jd_text = re.sub(r'[^\w\s]', '', jd_text.lower())
    words = jd_text.split()
    full_text = " ".join(words)
    doc = nlp(jd_text)

    found_keywords = set()

    # 1. Check for known multi-word phrases first
    for skill in known_skills:
        if " " in skill and skill in full_text:
            found_keywords.add(skill)

    # 2. Then check for individual words
    for word in words:
        norm = normalize_skill(word)
        if norm in known_skills:
            found_keywords.add(norm)

    # Noun phrases
    for chunk in doc.noun_chunks:
        norm = normalize_skill(chunk.text.strip())
        if norm in known_skills:
            found_keywords.add(norm)

    # Single tokens
    for token in doc:
        norm = normalize_skill(token.text.strip())
        if norm in known_skills:
            found_keywords.add(norm)

    return list(found_keywords)

# Suggestions for the resume - 8
def generate_suggestions(parsed_resume, missing_skills, match_percent):
    suggestions = []

    skills = parsed_resume.get("skills", [])
    projects = parsed_resume.get("projects", [])
    certifications = parsed_resume.get("certifications", [])
    summary = parsed_resume.get("summary", "")
    linkedin = parsed_resume.get("person", {}).get("linkedin", "")

    lower_skills = set(skill.lower() for skill in skills)

    ROLE_SKILLS = {
        "Frontend Development": ["html", "css", "javascript", "react", "tailwind", "typescript"],
        "Backend Development": ["node", "express", "mongodb", "sql", "django", "flask"],
        "Data Science": ["python", "pandas", "numpy", "matplotlib", "excel", "powerbi"],
        "DevOps": ["docker", "kubernetes", "aws", "gitlab", "jenkins", "ci/cd"]
    }

    for role, expected_skills in ROLE_SKILLS.items():
        matched = [skill for skill in expected_skills if skill in lower_skills]
        missing = [skill for skill in expected_skills if skill not in lower_skills]

        section_match_percent = (len(matched) / len(expected_skills)) * 100
        if section_match_percent < 50:
            suggestions.append(f"Your {role} skills are limited. Consider learning: {', '.join(missing[:3])}")

    if len(skills) < 5:
        suggestions.append("Try to list at least 5 relevant technical or soft skills.")
    if len(projects) < 2:
        suggestions.append("Showcase more projects to demonstrate practical expertise.")
    if len(certifications) == 0:
        suggestions.append("Add certifications to validate your knowledge in specific tools.")
    if not summary:
        suggestions.append("Include a brief professional summary to grab recruiter attention.")
    if match_percent < 50:
        suggestions.append("Improve your resume by adding more relevant keywords from the job description.")
    if not linkedin:
        suggestions.append("Add a LinkedIn profile link to connect with recruiters and showcase your professional network.")

    return suggestions



@api_view(['POST'])
def build_resume(request):
    data = request.data

    name = data.get("name", "")
    phone = data.get("phone", "")
    email = data.get("email", "")
    github = data.get("github", "")
    linkedin = data.get("linkedin", "")
    education = data.get("education", "")
    cgpa = data.get("cgpa", "")
    skills = data.get("skills", "")
    projects = data.get("projects", [])
    certifications = data.get("certifications", [])
    
    # Check if this is being built from a draft
    draft_id = data.get("draft_id")

    # Create layout engine
    layout_engine = ResumeLayoutEngine(data)
    layout_data = layout_engine.get_layout_data()

    # Generated resume path
    output_dir = os.path.join("generated")
    os.makedirs(output_dir, exist_ok=True)

    file_name = f"{name.strip().replace(' ', '_') or 'resume'}.pdf"
    final_path = os.path.join(output_dir, file_name)

    # Generate PDF from Canvas using layout data
    c = canvas.Canvas(final_path, pagesize=A4)
    width, height = A4
    
    # Define colors
    primary_color = colors.HexColor('#1e40af')  # Blue
    secondary_color = colors.HexColor('#64748b')  # Gray
    accent_color = colors.HexColor('#3b82f6')  # Light blue
    
    # Apply layout data to PDF
    for section in layout_data['sections']:
        if section['type'] == 'text' or section['type'] == 'header' or section['type'] == 'contact' or section['type'] == 'link' or section['type'] == 'section_header':
            # Set font
            if 'Bold' in section['font']:
                c.setFont("Helvetica-Bold", section['size'])
            elif 'Oblique' in section['font']:
                c.setFont("Helvetica-Oblique", section['size'])
            else:
                c.setFont("Helvetica", section['size'])
            
            # Set color
            if section['color'] == '#1e40af':
                c.setFillColor(primary_color)
            elif section['color'] == '#64748b':
                c.setFillColor(secondary_color)
            elif section['color'] == '#3b82f6':
                c.setFillColor(accent_color)
            else:
                c.setFillColor(colors.black)
            
            # Draw text - Note: PDF Y=0 is at bottom, so we need to flip Y coordinate
            pdf_y = height - section['position']['y']
            if section['text_anchor'] == 'middle':
                c.drawCentredString(section['position']['x'], pdf_y, section['content'])
            else:
                c.drawString(section['position']['x'], pdf_y, section['content'])
            
            # Add clickable links
            if section['type'] == 'link' and 'url' in section:
                c.linkURL(section['url'], (section['position']['x'], pdf_y - 2, 
                                         section['position']['x'] + c.stringWidth(section['content'], section['font'], section['size']), 
                                         pdf_y + 10))
        
        elif section['type'] == 'line':
            # Draw lines (section underlines) - Flip Y coordinate for PDF
            pdf_y = height - section['position']['y']
            pdf_end_y = height - section['end_position']['y']
            c.setStrokeColor(primary_color)
            c.setLineWidth(section['width'])
            c.line(section['position']['x'], pdf_y, 
                   section['end_position']['x'], pdf_end_y)
            c.setStrokeColor(colors.black)
            c.setLineWidth(1)
    
    c.save()
    
    # Save to history if user is authenticated
    if request.user.is_authenticated:
        try:
            history_entry = History.objects.create(
                user=request.user,
                name=name or "Untitled Resume",
                pdf_path=final_path,
                layout_data=layout_data,  # Store layout data for history
                created_at=timezone.now()
            )
        except Exception as e:
            print(f"Error saving to history: {e}")
    
    return Response({
        "status": "success", 
        "path": f"/generated/{file_name}",
        "layout_data": layout_data,  # Return layout data for frontend
        "message": "Resume built successfully!"
    })


@api_view(['POST'])
def download_resume(request):
    """Download the generated resume as a file"""
    try:
        data = request.data
        file_path = data.get('file_path', '')
        
        if not file_path:
            return Response({"error": "File path is required"}, status=400)
        
        # Remove leading slash if present
        if file_path.startswith('/'):
            file_path = file_path[1:]
        
        # Construct full path
        full_path = os.path.join(BASE_DIR, file_path)
        
        # Check if file exists
        if not os.path.exists(full_path):
            return Response({"error": "File not found"}, status=404)
        
        # Read file and return as downloadable response
        with open(full_path, 'rb') as file:
            file_data = file.read()
        
        # Extract filename from path
        filename = os.path.basename(file_path)
        
        # Return file data directly as binary content
        from django.http import HttpResponse
        response = HttpResponse(file_data, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
        
    except Exception as e:
        return Response({"error": f"Download failed: {str(e)}"}, status=500)


from django.contrib.auth import authenticate
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .serializers import RegisterSerializer, LoginSerializer
from django.contrib.auth import get_user_model
from .models import History
import jwt
from django.conf import settings
from django.db import models
from rest_framework.permissions import IsAuthenticated

User = get_user_model()
SECRET_KEY = 'authenticate_login'

@api_view(['POST'])
def register_user(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'message': 'User registered successfully'}, status=201)
    return Response(serializer.errors, status=400)


@api_view(['POST'])
def login_user(request):
    data = request.data
    email = data.get('email')
    password = data.get('password')
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'message': 'User not found'}, status=404)
    
    if user.check_password(password):
        # Check if user is admin
        is_admin = email == 'admincv@gmail.com'
        
        token = jwt.encode({'email': user.email, 'is_admin': is_admin}, SECRET_KEY, algorithm='HS256')
        return Response({
            'token': token, 
            'is_admin': is_admin,
            'username': user.username,
            'email': user.email
        }, status=200)
    return Response({'message': 'Invalid credentials'}, status=401)


@api_view(['GET'])
def me(request):
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return Response({'message': 'Unauthorized'}, status=401)

    token = auth_header.split(' ', 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        email = payload.get('email')
        is_admin = payload.get('is_admin', False)
        user = User.objects.get(email=email)
        return Response({
            'username': user.username, 
            'email': user.email,
            'is_admin': is_admin
        }, status=200)
    except Exception:
        return Response({'message': 'Invalid token'}, status=401)


@api_view(['PUT'])
def update_profile(request):
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return Response({'message': 'Unauthorized'}, status=401)

    token = auth_header.split(' ', 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        email = payload.get('email')
        user = User.objects.get(email=email)
        
        # Get updated data
        new_username = request.data.get('username')
        new_email = request.data.get('email')
        
        # Validate data
        if not new_username or not new_email:
            return Response({'message': 'Username and email are required'}, status=400)
        
        # Check if email is already taken by another user
        if new_email != user.email and User.objects.filter(email=new_email).exists():
            return Response({'message': 'Email is already taken'}, status=400)
        
        # Check if username is already taken by another user
        if new_username != user.username and User.objects.filter(username=new_username).exists():
            return Response({'message': 'Username is already taken'}, status=400)
        
        # Update user
        user.username = new_username
        user.email = new_email
        user.save()
        
        # Check if user is admin
        is_admin = new_email == 'admincv@gmail.com'
        
        # Generate new token with updated email and admin status
        new_token = jwt.encode({'email': user.email, 'is_admin': is_admin}, SECRET_KEY, algorithm='HS256')
        
        return Response({
            'message': 'Profile updated successfully',
            'username': user.username,
            'email': user.email,
            'is_admin': is_admin,
            'token': new_token
        }, status=200)
        
    except Exception as e:
        return Response({'message': 'Invalid token'}, status=401)


@api_view(['GET'])
def get_history(request):
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return Response({'message': 'Unauthorized'}, status=401)

    token = auth_header.split(' ', 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        email = payload.get('email')
        user = User.objects.get(email=email)
        
        # Get filter parameters
        action_type = request.GET.get('action_type', '')
        limit = int(request.GET.get('limit', 50))
        
        # Query history
        history_queryset = History.objects.filter(user=user)
        if action_type:
            history_queryset = history_queryset.filter(action_type=action_type)
        
        history_list = history_queryset[:limit]
        
        # Calculate stats
        total_analyzer = History.objects.filter(user=user, action_type='analyzer').count()
        total_builder = History.objects.filter(user=user, action_type='builder').count()
        avg_score = History.objects.filter(user=user, action_type='analyzer', score__isnull=False).aggregate(
            avg_score=models.Avg('score')
        )['avg_score'] or 0
        
        # Format history data
        history_data = []
        for item in history_list:
            history_data.append({
                'id': item.id,
                'action_type': item.action_type,
                'title': item.title,
                'description': item.description,
                'file_path': item.file_path,
                'score': item.score,
                'job_description': item.job_description,
                'created_at': timezone.localtime(item.created_at).strftime('%Y-%m-%d %H:%M:%S'),
                'updated_at': timezone.localtime(item.updated_at).strftime('%Y-%m-%d %H:%M:%S'),
            })
        
        return Response({
            'history': history_data,
            'stats': {
                'total_analyzer': total_analyzer,
                'total_builder': total_builder,
                'avg_score': round(avg_score, 2),
                'total_actions': total_analyzer + total_builder
            }
        }, status=200)
        
    except Exception as e:
        return Response({'message': 'Invalid token'}, status=401)


@api_view(['POST'])
def save_history(request):
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return Response({'message': 'Unauthorized'}, status=401)

    token = auth_header.split(' ', 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        email = payload.get('email')
        user = User.objects.get(email=email)
        
        # Get data from request
        action_type = request.data.get('action_type')
        title = request.data.get('title')
        description = request.data.get('description', '')
        file_path = request.data.get('file_path', '')
        score = request.data.get('score')
        job_description = request.data.get('job_description', '')
        
        # Validate required fields
        if not action_type or not title:
            return Response({'message': 'Action type and title are required'}, status=400)
        
        # Create history entry
        history = History.objects.create(
            user=user,
            action_type=action_type,
            title=title,
            description=description,
            file_path=file_path,
            score=score,
            job_description=job_description
        )
        
        return Response({
            'message': 'History saved successfully',
            'id': history.id
        }, status=201)
        
    except Exception as e:
        return Response({'message': 'Invalid token'}, status=401)


@api_view(['DELETE'])
def delete_history(request, history_id):
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return Response({'message': 'Unauthorized'}, status=401)

    token = auth_header.split(' ', 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        email = payload.get('email')
        user = User.objects.get(email=email)
        
        # Get history item and verify ownership
        try:
            history = History.objects.get(id=history_id, user=user)
            history.delete()
            return Response({'message': 'History deleted successfully'}, status=200)
        except History.DoesNotExist:
            return Response({'message': 'History not found'}, status=404)
        
    except Exception as e:
        return Response({'message': 'Invalid token'}, status=401)


@api_view(['POST'])
def save_draft(request):
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return Response({'message': 'Unauthorized'}, status=401)

    token = auth_header.split(' ', 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        email = payload.get('email')
        user = User.objects.get(email=email)

        draft_id = request.data.get('id')
        title = request.data.get('title') or 'Untitled Draft'
        payload_data = request.data.get('payload') or {}

        if draft_id:
            try:
                draft = History.objects.get(id=draft_id, user=user, action_type='draft')
                draft.title = title
                draft.description = json.dumps(payload_data)
                draft.save()
                return Response({'message': 'Draft updated', 'id': draft.id}, status=200)
            except History.DoesNotExist:
                return Response({'message': 'Draft not found'}, status=404)
        else:
            draft = History.objects.create(
                user=user,
                action_type='draft',
                title=title,
                description=json.dumps(payload_data)
            )
            return Response({'message': 'Draft saved', 'id': draft.id}, status=201)

    except Exception:
        return Response({'message': 'Invalid token'}, status=401)


@api_view(['GET'])
def list_drafts(request):
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return Response({'message': 'Unauthorized'}, status=401)

    token = auth_header.split(' ', 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        email = payload.get('email')
        user = User.objects.get(email=email)

        drafts = History.objects.filter(user=user, action_type='draft').order_by('-updated_at')
        data = [{
            'id': d.id,
            'title': d.title,
            'updated_at': d.updated_at.strftime('%Y-%m-%d %H:%M:%S')
        } for d in drafts]
        return Response({'drafts': data}, status=200)
    except Exception:
        return Response({'message': 'Invalid token'}, status=401)


@api_view(['GET'])
def get_draft(request, draft_id):
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return Response({'message': 'Unauthorized'}, status=401)

    token = auth_header.split(' ', 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        email = payload.get('email')
        user = User.objects.get(email=email)

        draft = History.objects.get(id=draft_id, user=user, action_type='draft')
        return Response({
            'id': draft.id, 
            'title': draft.title, 
            'payload': json.loads(draft.description) if draft.description else {}
        }, status=200)
    except History.DoesNotExist:
        return Response({'message': 'Draft not found'}, status=404)
    except Exception:
        return Response({'message': 'Invalid token'}, status=401)


@api_view(['GET'])
def admin_dashboard(request):
    """Admin dashboard endpoint - only accessible by admin users"""
    print("Admin dashboard endpoint called")
    auth_header = request.headers.get('Authorization', '')
    print(f"Auth header: {auth_header}")
    
    if not auth_header.startswith('Bearer '):
        print("No Bearer token found")
        return Response({'message': 'Unauthorized'}, status=401)

    token = auth_header.split(' ', 1)[1]
    print(f"Token: {token[:20]}...")
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        print(f"Decoded payload: {payload}")
        email = payload.get('email')
        is_admin = payload.get('is_admin', False)
        
        print(f"Email: {email}, Is admin: {is_admin}")
        
        # Check if user is admin
        if not is_admin or email != 'admincv@gmail.com':
            print(f"Admin access denied for {email}")
            return Response({'message': 'Admin access required'}, status=403)
        
        print("Admin access granted, fetching data...")
        
        # Get admin dashboard data
        total_users = User.objects.count()
        total_analyses = History.objects.filter(action_type='analyzer').count()
        total_builds = History.objects.filter(action_type='builder').count()
        total_drafts = History.objects.filter(action_type='draft').count()
        
        print(f"Counts - Users: {total_users}, Analyses: {total_analyses}, Builds: {total_builds}, Drafts: {total_drafts}")
        
        # Get recent activities (limit to existing action types to avoid errors)
        recent_activities = History.objects.select_related('user').order_by('-created_at')[:10]
        activities_data = []
        for activity in recent_activities:
            try:
                activities_data.append({
                    'id': activity.id,
                    'user': activity.user.username,
                    'user_email': activity.user.email,
                    'action_type': activity.action_type,
                    'title': activity.title,
                    'description': activity.description,
                    'created_at': timezone.localtime(activity.created_at).strftime('%Y-%m-%d %H:%M:%S'),
                    'score': activity.score,
                })
            except Exception as e:
                print(f"Error processing activity {activity.id}: {e}")
                continue
        
        print(f"Recent activities count: {len(activities_data)}")
        
        # Get user statistics
        users_data = []
        users = User.objects.all()
        for user in users:
            try:
                user_analyses = History.objects.filter(user=user, action_type='analyzer').count()
                user_builds = History.objects.filter(user=user, action_type='builder').count()
                user_drafts = History.objects.filter(user=user, action_type='draft').count()
                avg_score = History.objects.filter(user=user, action_type='analyzer', score__isnull=False).aggregate(
                    avg_score=models.Avg('score')
                )['avg_score'] or 0
                
                users_data.append({
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'date_joined': user.date_joined.strftime('%Y-%m-%d'),
                    'analyses_count': user_analyses,
                    'builds_count': user_builds,
                    'drafts_count': user_drafts,
                    'avg_score': round(avg_score, 2),
                    'total_actions': user_analyses + user_builds + user_drafts
                })
            except Exception as e:
                print(f"Error processing user {user.id}: {e}")
                continue
        
        print(f"Users data count: {len(users_data)}")
        
        response_data = {
            'overview': {
                'total_users': total_users,
                'total_analyses': total_analyses,
                'total_builds': total_builds,
                'total_drafts': total_drafts,
                'total_actions': total_analyses + total_builds + total_drafts
            },
            'recent_activities': activities_data,
            'users': users_data
        }
        
        print(f"Response data keys: {list(response_data.keys())}")
        print(f"Overview keys: {list(response_data['overview'].keys())}")
        
        return Response(response_data, status=200)
        
    except Exception as e:
        print(f"Error in admin_dashboard: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'message': f'Error: {str(e)}'}, status=500)


@api_view(['GET'])
def admin_users(request):
    """Get all users for admin management"""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return Response({'message': 'Unauthorized'}, status=401)

    token = auth_header.split(' ', 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        email = payload.get('email')
        is_admin = payload.get('is_admin', False)
        
        # Check if user is admin
        if not is_admin or email != 'admincv@gmail.com':
            return Response({'message': 'Admin access required'}, status=403)
        
        users = User.objects.all().order_by('-date_joined')
        users_data = []
        
        for user in users:
            user_analyses = History.objects.filter(user=user, action_type='analyzer').count()
            user_builds = History.objects.filter(user=user, action_type='builder').count()
            user_drafts = History.objects.filter(user=user, action_type='draft').count()
            avg_score = History.objects.filter(user=user, action_type='analyzer', score__isnull=False).aggregate(
                avg_score=models.Avg('score')
            )['avg_score'] or 0
            
            users_data.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'date_joined': user.date_joined.strftime('%Y-%m-%d %H:%M:%S'),
                'last_login': user.last_login.strftime('%Y-%m-%d %H:%M:%S') if user.last_login else 'Never',
                'is_active': user.is_active,
                'analyses_count': user_analyses,
                'builds_count': user_builds,
                'drafts_count': user_drafts,
                'avg_score': round(avg_score, 2),
                'total_actions': user_analyses + user_builds + user_drafts
            })
        
        return Response({'users': users_data}, status=200)
        
    except Exception as e:
        return Response({'message': 'Invalid token'}, status=401)


@api_view(['GET'])
def admin_test(request):
    """Simple test endpoint for admin debugging"""
    print("Admin test endpoint called")
    try:
        # Test basic database access
        user_count = User.objects.count()
        history_count = History.objects.count()
        
        print(f"User count: {user_count}")
        print(f"History count: {history_count}")
        
        # Test action types
        action_types = History.objects.values_list('action_type', flat=True).distinct()
        print(f"Action types found: {list(action_types)}")
        
        return Response({
            'message': 'Admin test successful',
            'user_count': user_count,
            'history_count': history_count,
            'action_types': list(action_types)
        }, status=200)
        
    except Exception as e:
        print(f"Error in admin_test: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'message': f'Error: {str(e)}'}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_charts(request):
    """Generate chart data and images for analytics"""
    try:
        # Get user's history
        history = History.objects.filter(user=request.user).order_by('created_at')
        
        if not history.exists():
            return Response({
                'error': 'No history data available for charts'
            }, status=404)
        
        # Process data for charts
        chart_data = {
            'activity_trend': {},
            'score_distribution': {},
            'action_types': {}
        }
        
        # Activity trend data (last 30 days)
        from datetime import datetime, timedelta
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        
        daily_activity = {}
        for i in range(31):
            date = start_date + timedelta(days=i)
            date_key = date.strftime('%Y-%m-%d')
            daily_activity[date_key] = {
                'analyzer': 0,
                'builder': 0,
                'draft': 0,
                'total': 0
            }
        
        # Fill in actual data
        for item in history:
            if item.created_at.date() >= start_date.date():
                date_key = timezone.localtime(item.created_at).strftime('%Y-%m-%d')
                if date_key in daily_activity:
                    daily_activity[date_key][item.action_type] += 1
                    daily_activity[date_key]['total'] += 1
        
        chart_data['activity_trend'] = daily_activity
        
        # Score distribution
        scores = [item.score for item in history if item.action_type == 'analyzer' and item.score is not None]
        if scores:
            score_ranges = {
                '0-20': len([s for s in scores if s <= 20]),
                '21-40': len([s for s in scores if 21 <= s <= 40]),
                '41-60': len([s for s in scores if 41 <= s <= 60]),
                '61-80': len([s for s in scores if 61 <= s <= 80]),
                '81-100': len([s for s in scores if s > 80])
            }
            chart_data['score_distribution'] = score_ranges
        
        # Action type counts
        action_counts = {}
        for item in history:
            action_counts[item.action_type] = action_counts.get(item.action_type, 0) + 1
        
        chart_data['action_types'] = action_counts
        
        return Response({
            'success': True,
            'charts': chart_data,
            'total_entries': history.count(),
            'has_scores': len(scores) > 0,
            'score_count': len(scores)
        })
        
    except Exception as e:
        print(f"Error generating charts: {str(e)}")
        return Response({
            'error': 'Failed to generate charts'
        }, status=500)

@api_view(['POST'])
def get_career_paths(request):
    """Get potential career paths based on user skills"""
    try:
        import pandas as pd
        import os
        
        # Get user skills from request
        user_skills = request.data.get('skills', [])
        
        if not user_skills:
            return Response({
                'error': 'No skills provided'
            }, status=400)
        
        # Path to the CSV file
        csv_path = os.path.join(BASE_DIR, "ML", "Job_Prediction", "train", "job_skills_batch_1.csv")
        
        # Read the CSV file
        df = pd.read_csv(csv_path)
        
        # Process career paths with duplicate prevention
        career_paths = []
        seen_job_titles = set()  # Track seen job titles to prevent duplicates
        
        for _, row in df.iterrows():
            job_title = row['job'].strip()
            
            # Skip if we've already seen this job title
            if job_title.lower() in seen_job_titles:
                continue
                
            required_skills = [skill.strip().lower() for skill in str(row['skills']).split(',')]
            
            # Calculate skill match
            matched_skills = [skill for skill in user_skills if skill.lower() in required_skills]
            missing_skills = [skill for skill in required_skills if skill not in [s.lower() for s in user_skills]]
            
            # Calculate match percentage
            match_percentage = (len(matched_skills) / len(required_skills)) * 100 if required_skills else 0
            
            # Only include paths with at least 40% match AND missing skills
            if match_percentage >= 40 and len(missing_skills) > 0:
                # Add to seen set to prevent duplicates
                seen_job_titles.add(job_title.lower())
                
                career_paths.append({
                    'job_title': job_title,
                    'match_percentage': round(match_percentage, 1),
                    'matched_skills': matched_skills,
                    'missing_skills': missing_skills,
                    'total_required': len(required_skills),
                    'total_matched': len(matched_skills)
                })
        
        # Sort by match percentage (highest first)
        career_paths.sort(key=lambda x: x['match_percentage'], reverse=True)
        
        # Limit to top 8 career paths (reduced since we have higher quality now)
        career_paths = career_paths[:8]
        
        return Response({
            'success': True,
            'career_paths': career_paths,
            'total_paths': len(career_paths)
        })
        
    except Exception as e:
        print(f"Error getting career paths: {str(e)}")
        return Response({
            'error': 'Failed to get career paths'
        }, status=500)

@api_view(['POST'])
def get_job_details(request):
    """Get job details from internshala CSV that match the predicted role"""
    try:
        import pandas as pd
        import os
        
        # Get predicted role from request
        predicted_role = request.data.get('predicted_role', '')
        
        if not predicted_role:
            return Response({
                'error': 'No predicted role provided'
            }, status=400)
        
        # Path to the internshala CSV file
        csv_path = os.path.join(BASE_DIR, "ML", "Job_Prediction", "train", "internshala_jobs_fully_cleaned_final.csv")
        
        # Read the CSV file
        df = pd.read_csv(csv_path)
        
        # Find jobs that match the predicted role
        matching_jobs = []
        
        for _, row in df.iterrows():
            job_title = str(row['Job Title']).lower()
            predicted_role_lower = predicted_role.lower()
            
            # Check if predicted role matches job title
            if predicted_role_lower in job_title: 
            # or any(word in job_title for word in predicted_role_lower.split()):
                job_details = {
                    'job_title': row['Job Title'],
                    'company_name': row['Company Name'],
                    'location': row['Location'],
                    'salary': row['Salary'],
                    'work_from_home': row['Work From Home'],
                    'job_link': row['Job Link'],
                    'skills': row['Skills']
                }
                matching_jobs.append(job_details)
        
        # Sort by salary (highest first) and limit to top 5
        matching_jobs = matching_jobs[:5]
        
        return Response({
            'success': True,
            'matching_jobs': matching_jobs,
            'total_jobs': len(matching_jobs),
            'predicted_role': predicted_role
        })
        
    except Exception as e:
        print(f"Error getting job details: {str(e)}")
        return Response({
            'error': 'Failed to get job details'
        }, status=500)