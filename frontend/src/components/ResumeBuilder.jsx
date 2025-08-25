import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../css/ResumeBuilder.css'

import {
    Plus,
    Download,
    Minus,
    Save,
    FileText,
    User,
    Mail,
    Phone,
    Github,
    Linkedin,
    GraduationCap,
    Award,
    Code,
    Briefcase,
    Eye,
    X,
} from "lucide-react";

function ResumeBuilder() {
    const [form, setForm] = useState({
        name: '',
        phone: '',
        email: '',
        github: '',
        linkedin: '',
        education: '',
        cgpa: '',
        skills: '',
        projects: [],
        certifications: []
    });
    const [draftId, setDraftId] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [builtResumePath, setBuiltResumePath] = useState('');
    const [builtResumeName, setBuiltResumeName] = useState('');
    const [layoutData, setLayoutData] = useState(null);
    const [canvasScale, setCanvasScale] = useState(1);
    const canvasRef = useRef(null);

    const removeProject = (index) => {
        if (projectCount > 1) {
            const newCount = projectCount - 1
            setProjectCount(newCount)
            const newProjects = form.projects.filter((_, i) => i !== index)
            setForm({ ...form, projects: newProjects })
        }
    }

    const removeCertification = (index) => {
        if (certCount > 1) {
            const newCount = certCount - 1
            setCertCount(newCount)
            const newCerts = form.certifications.filter((_, i) => i !== index)
            setForm({ ...form, certifications: newCerts })
        }
    }

    const [projectCount, setProjectCount] = useState(0);
    const [certCount, setCertCount] = useState(0);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleProjectChange = (index, field, value) => {
        const newProjects = [...form.projects];
        newProjects[index] = {
            ...newProjects[index],
            [field]: value
        };
        setForm({ ...form, projects: newProjects });
    };

    const handleCertChange = (index, field, value) => {
        const newCerts = [...form.certifications];
        newCerts[index] = {
            ...newCerts[index],
            [field]: value
        };
        setForm({ ...form, certifications: newCerts });
    };

    const generateProjectBlocks = () => {
        const blocks = [];
        for (let i = 0; i < projectCount; i++) {
            blocks.push(
                <div key={i} className="project-card">
                    <div className="project-card-header">
                        <div className="project-card-title" style={{fontWeight : 700, fontSize : 17}}>
                            <span className="project-title-content">
                                <Briefcase className="project-icon" />
                                Project {i + 1}
                            </span>
                            {projectCount > 1 && (
                                <button type="button" className="remove-btn" onClick={() => removeProject(i)}>
                                    <Minus className="remove-icon" />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="project-card-content">
                        <div className="form-group">
                            <label htmlFor={`project-title-${i}`}>Project Title</label>
                            <input
                                id={`project-title-${i}`}
                                type="text"
                                className="form-input"
                                placeholder="Enter project title"
                                value={form.projects[i]?.title || ""}
                                onChange={(e) => handleProjectChange(i, "title", e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor={`project-desc-${i}`}>Project Description</label>
                            <textarea
                                id={`project-desc-${i}`}
                                className="form-textarea"
                                rows={3}
                                placeholder="Describe your project, technologies used, and key achievements..."
                                value={form.projects[i]?.description || ""}
                                onChange={(e) => handleProjectChange(i, "description", e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor={`project-link-${i}`}>GitHub Link</label>
                            <input
                                id={`project-link-${i}`}
                                type="text"
                                className="form-input"
                                placeholder="https://github.com/username/project"
                                value={form.projects[i]?.link || ""}
                                onChange={(e) => handleProjectChange(i, "link", e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            );
        }
        return blocks;
    };

    const generateCertBlocks = () => {
        const blocks = [];
        for (let i = 0; i < certCount; i++) {
            blocks.push(
                <div key={i} className="cert-card">
                    <div className="cert-card-header">
                        <div className="cert-card-title">
                            <span className="cert-title-content" style={{fontWeight : 700, fontSize : 17}}>
                                <Award className="cert-icon" />
                                Certificate {i + 1}
                            </span>
                            {certCount > 1 && (
                                <button type="button" className="remove-btn" onClick={() => removeCertification(i)}>
                                    <Minus className="remove-icon" />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="cert-card-content">
                        <div className="form-group">
                            <label htmlFor={`cert-title-${i}`}>Certificate Title</label>
                            <input
                                id={`cert-title-${i}`}
                                type="text"
                                className="form-input"
                                placeholder="Enter certificate title"
                                value={form.certifications[i]?.title || ""}
                                onChange={(e) => handleCertChange(i, "title", e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor={`cert-provider-${i}`}>Provider</label>
                            <input
                                id={`cert-provider-${i}`}
                                type="text"
                                className="form-input"
                                placeholder="Certification provider (e.g., Google, AWS, Microsoft)"
                                value={form.certifications[i]?.provider || ""}
                                onChange={(e) => handleCertChange(i, "provider", e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor={`cert-link-${i}`}>Certificate Link</label>
                            <input
                                id={`cert-link-${i}`}
                                type="text"
                                className="form-input"
                                placeholder="Link to certificate or credential"
                                value={form.certifications[i]?.link || ""}
                                onChange={(e) => handleCertChange(i, "link", e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            );
        }
        return blocks;
    };

    const handleBuild = () => {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Include draft_id if building from a draft
        const buildData = { ...form };
        if (draftId) {
            buildData.draft_id = draftId;
        }
        
        axios.post('http://localhost:8000/build', buildData, { headers })
            .then(res => {
                // Store the built resume information
                setBuiltResumePath(res.data.path);
                setBuiltResumeName(res.data.path.split('/').pop() || `${form.name || 'Resume'}.pdf`);
                
                // Store layout data for canvas rendering
                if (res.data.layout_data) {
                    setLayoutData(res.data.layout_data);
                }
                
                // Show preview in main content area
                setShowPreview(true);
            })
            .catch(err => {
                console.error('Error building resume:', err);
                alert('Error building resume. Please try again.');
            });
    };

    const saveDraft = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;
            
            const draftData = {
                id: draftId,
                title: form.name ? `${form.name}'s Resume` : 'Untitled Resume',
                payload: form
            };
            
            const res = await axios.post('http://localhost:8000/save-draft', draftData, { headers });
            setDraftId(res.data.id);
            alert('Draft saved successfully!');
        } catch (e) {
            console.error(e);
            alert('Failed to save draft');
        }
    };

    const loadDraftIfAny = async () => {
        const params = new URLSearchParams(window.location.search);
        const draftParam = params.get('draft');
        if (!draftParam) return;
        
        try {
            const token = localStorage.getItem('token');
            const headers = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;
            
            const res = await axios.get(`http://localhost:8000/get-draft/${draftParam}`, { headers });
            const payload = res.data?.payload || {};
            
            setForm({
                name: payload.name || '',
                phone: payload.phone || '',
                email: payload.email || '',
                github: payload.github || '',
                linkedin: payload.linkedin || '',
                education: payload.education || '',
                cgpa: payload.cgpa || '',
                skills: payload.skills || '',
                projects: payload.projects || [],
                certifications: payload.certifications || []
            });
            
            setProjectCount((payload.projects || []).length);
            setCertCount((payload.certifications || []).length);
            setDraftId(res.data?.id);
            
            alert('Draft loaded successfully!');
        } catch (e) {
            console.error(e);
            alert('Failed to load draft');
        }
    };

    const downloadResume = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            // Download the PDF using the download endpoint
            const downloadData = { file_path: builtResumePath };
            const downloadRes = await axios.post('http://localhost:8000/download-resume', downloadData, { 
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                responseType: 'blob'  // Important: get response as blob
            });
            
            // Create blob and download
            const blob = new Blob([downloadRes.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = builtResumeName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            // Show success message
            alert('Resume downloaded successfully!');
        } catch (error) {
            console.error('Error downloading resume:', error);
            alert('Error downloading resume. Please try again.');
        }
    };

    const openPDFInNewTab = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            // Get the PDF and open in new tab
            const downloadData = { file_path: builtResumePath };
            const downloadRes = await axios.post('http://localhost:8000/download-resume', downloadData, { 
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                responseType: 'blob'
            });
            
            // Create blob URL and open in new tab
            const blob = new Blob([downloadRes.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            
            // Clean up the blob URL after a delay
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 1000);
        } catch (error) {
            console.error('Error opening PDF:', error);
            alert('Error opening PDF. Please try again.');
        }
    };

    const saveToHistory = async () => {
        if (!canvasRef.current || !layoutData) return;
        
        try {
            // Generate preview image from canvas
            const canvas = canvasRef.current;
            const previewImage = canvas.toDataURL('image/png');
            
            // Create history item
            const historyItem = {
                id: Date.now(),
                name: form.name || 'Untitled Resume',
                date: new Date().toISOString(),
                layout_data: layoutData,
                pdf_path: builtResumePath,
                preview_image: previewImage,
                form_data: { ...form }
            };
            
            // Save to localStorage for now (you can integrate with your backend history API)
            const existingHistory = JSON.parse(localStorage.getItem('resumeHistory') || '[]');
            existingHistory.unshift(historyItem);
            localStorage.setItem('resumeHistory', JSON.stringify(existingHistory));
            
            alert('Resume saved to history successfully!');
        } catch (error) {
            console.error('Error saving to history:', error);
            alert('Error saving to history. Please try again.');
        }
    };

    const goBackToForm = () => {
        setShowPreview(false);
        setBuiltResumePath('');
        setBuiltResumeName('');
        setLayoutData(null);
    };

    // Canvas rendering functions
    const renderCanvasPreview = (layoutData) => {
        if (!layoutData || !canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Apply scale
        ctx.save();
        ctx.scale(canvasScale, canvasScale);
        
        // Render each section directly (coordinates are already top-down)
        layoutData.sections.forEach(section => {
            renderSection(ctx, section);
        });
        
        ctx.restore();
    };

    const renderSection = (ctx, section) => {
        if (section.type === 'text' || section.type === 'header' || section.type === 'contact' || section.type === 'link' || section.type === 'section_header') {
            // Set font
            let fontFamily = 'Helvetica';
            if (section.font.includes('Bold')) {
                fontFamily = 'Helvetica-Bold';
            } else if (section.font.includes('Oblique')) {
                fontFamily = 'Helvetica-Oblique';
            }
            
            ctx.font = `${section.size}px ${fontFamily}`;
            ctx.fillStyle = section.color;
            
            // Handle text alignment
            if (section.text_anchor === 'middle') {
                ctx.textAlign = 'center';
            } else if (section.align === 'center') {
                ctx.textAlign = 'center';
            } else {
                ctx.textAlign = 'left';
            }
            
            // Draw text
            ctx.fillText(section.content, section.position.x, section.position.y);
            
        } else if (section.type === 'line') {
            // Draw lines (section underlines)
            ctx.strokeStyle = section.color;
            ctx.lineWidth = section.width;
            ctx.beginPath();
            ctx.moveTo(section.position.x, section.position.y);
            ctx.lineTo(section.end_position.x, section.end_position.y);
            ctx.stroke();
        }
    };

    const zoomCanvas = (scale) => {
        setCanvasScale(prevScale => {
            const newScale = prevScale * scale;
            // Limit zoom between 0.5 and 2.0
            if (newScale >= 0.5 && newScale <= 2.0) {
                return newScale;
            }
            return prevScale;
        });
    };

    // Effect to render canvas when layout data changes
    useEffect(() => {
        if (layoutData && showPreview) {
            renderCanvasPreview(layoutData);
        }
    }, [layoutData, showPreview, canvasScale]);

    useEffect(() => {
        loadDraftIfAny();
    }, []);

    return (
        <div className="builder-container">
            <div className="builder-content">
                {!showPreview ? (
                    // Resume Builder Form
                    <>
                        <div className="builder-header">
                            <div className="header-info">
                                <h1 className="builder-title">
                                    <FileText className="title-icon" />
                                    Resume Builder
                                </h1>
                                <p className="builder-description">Create your professional resume with our easy-to-use builder</p>
                            </div>
                            <div className="header-actions">
                                <button className="save-btn" onClick={saveDraft}>
                                    <Save className="btn-icon" />
                                    Save Draft
                                </button>
                                <button className="build-btn" onClick={handleBuild} >
                                    <FileText className="btn-icon" />
                                    Build & Preview
                                </button>
                            </div>
                        </div>

                        <div className="form-sections">
                            {/* Personal Information */}
                            <div className="form-section">
                                <div className="section-header-builder">
                                    <div className="section-title">
                                        <User className="section-icon" />
                                        Personal Information
                                    </div>
                                    <p className="section-description">Enter your basic contact details</p>
                                </div>
                                <div className="section-content">
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label htmlFor="name">Full Name</label>
                                            <input
                                                id="name"
                                                name="name"
                                                className="form-input"
                                                type="text"
                                                placeholder="John Doe"
                                                value={form.name}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="phone">Phone Number</label>
                                            <input
                                                id="phone"
                                                name="phone"
                                                className="form-input"
                                                type="tel"
                                                placeholder="+1 (555) 123-4567"
                                                value={form.phone}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="email">Email Address</label>
                                            <input
                                                id="email"
                                                name="email"
                                                className="form-input"
                                                type="email"
                                                placeholder="john.doe@email.com"
                                                value={form.email}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="github">GitHub Profile</label>
                                            <input
                                                id="github"
                                                name="github"
                                                className="form-input"
                                                type="url"
                                                placeholder="https://github.com/johndoe"
                                                value={form.github}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="linkedin">LinkedIn Profile</label>
                                            <input
                                                id="linkedin"
                                                name="linkedin"
                                                className="form-input"
                                                type="url"
                                                placeholder="https://linkedin.com/in/johndoe"
                                                value={form.linkedin}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Education */}
                            <div className="form-section">
                                <div className="section-header-builder">
                                    <div className="section-title">
                                        <GraduationCap className="section-icon" />
                                        Education
                                    </div>
                                    <p className="section-description">Add your educational background</p>
                                </div>
                                <div className="section-content">
                                    <div className="form-group">
                                        <label htmlFor="education">Education Details</label>
                                        <textarea
                                            id="education"
                                            name="education"
                                            className="form-textarea"
                                            rows={4}
                                            placeholder="Bachelor of Science in Computer Science&#10;University of Technology&#10;Graduated: 2023&#10;GPA: 3.8/4.0"
                                            value={form.education}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="cgpa">CGPA/SPI Details</label>
                                        <textarea
                                            id="cgpa"
                                            name="cgpa"
                                            className="form-textarea"
                                            rows={3}
                                            placeholder="CGPA: 3.8/4.0&#10;SPI: 9.2/10.0&#10;Dean's List: 3 semesters"
                                            value={form.cgpa}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Skills */}
                            <div className="form-section">
                                <div className="section-header-builder">
                                    <div className="section-title">
                                        <Code className="section-icon" />
                                        Skills
                                    </div>
                                    <p className="section-description">List your technical and soft skills</p>
                                </div>
                                <div className="section-content">
                                    <div className="form-group">
                                        <label htmlFor="skills">Skills (comma separated)</label>
                                        <textarea
                                            id="skills"
                                            name="skills"
                                            className="form-textarea"
                                            rows={3}
                                            placeholder="JavaScript, React, Node.js, Python, SQL, Git, Docker, AWS"
                                            value={form.skills}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Certifications */}
                            <div className="form-section">
                                <div className="section-header-builder">
                                    <div className="section-title-with-action">
                                        <div className="section-title">
                                            <Award className="section-icon" />
                                            Certifications
                                        </div>
                                        <button type="button" className="add-btn" onClick={() => setCertCount(certCount + 1)}>
                                            <Plus className="btn-icon" />
                                            Add Certificate
                                        </button>
                                    </div>
                                    <p className="section-description">Add your professional certifications</p>
                                </div>
                                <div className="section-content">
                                    <div className="form-group">
                                        <label htmlFor="cert-count">Number of Certifications</label>
                                        <input
                                            id="cert-count"
                                            type="number"
                                            min={0}
                                            className="form-input count-input"
                                            value={certCount}
                                            onChange={(e) => setCertCount(parseInt(e.target.value || 0))}
                                        />
                                    </div>
                                    <div className="dynamic-blocks">{generateCertBlocks()}</div>
                                </div>
                            </div>

                            {/* Projects */}
                            <div className="form-section">
                                <div className="section-header-builder">
                                    <div className="section-title-with-action">
                                        <div className="section-title">
                                            <Briefcase className="section-icon" />
                                            Projects
                                        </div>
                                        <button type="button" className="add-btn" onClick={() => setProjectCount(projectCount + 1)}>
                                            <Plus className="btn-icon" />
                                            Add Project
                                        </button>
                                    </div>
                                    <p className="section-description">Showcase your best projects</p>
                                </div>
                                <div className="section-content">
                                    <div className="form-group">
                                        <label htmlFor="project-count">Number of Projects</label>
                                        <input
                                            id="project-count"
                                            type="number"
                                            min={0}
                                            className="form-input count-input"
                                            value={projectCount}
                                            onChange={(e) => setProjectCount(parseInt(e.target.value || 0))}
                                        />
                                    </div>
                                    <div className="dynamic-blocks">{generateProjectBlocks()}</div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="action-buttons">
                                <button className="save-btn-large" onClick={saveDraft}>
                                    <Save className="btn-icon" />
                                    Save Draft
                                </button>
                                <button className="build-btn-large" onClick={handleBuild}>
                                    <FileText className="btn-icon" />
                                    Build & Preview
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    // Canvas-based PDF Preview
                    <div className="preview-content">
                        <div className="preview-header">
                            <h1 className="preview-title">
                                <FileText className="title-icon" />
                                Resume Preview
                            </h1>
                            <p className="preview-description">Your resume has been built successfully!</p>
                            <div className="preview-actions">
                                <button className="download-btn-large" onClick={downloadResume}>
                                    <Download className="btn-icon" />
                                    Download PDF
                                </button>
                                <button className="open-pdf-btn" onClick={openPDFInNewTab}>
                                    <Eye className="btn-icon" />
                                    Open PDF
                                </button>
                                <button className="save-history-btn" onClick={saveToHistory}>
                                    <Save className="btn-icon" />
                                    Save to History
                                </button>
                                <button className="back-btn" onClick={goBackToForm}>
                                    <FileText className="btn-icon" />
                                    Back to Builder
                                </button>
                            </div>
                        </div>
                        
                        {/* Canvas-based Resume Preview */}
                        <div className="canvas-preview-main">
                            <canvas 
                                id="resume-canvas" 
                                className="resume-canvas"
                                width="595"
                                height="842"
                                style={{
                                    width: `${595 * canvasScale}px`,
                                    height: `${842 * canvasScale}px`
                                }}
                                ref={canvasRef}
                            />
                            <div className="canvas-controls">
                                <button className="zoom-btn" onClick={() => zoomCanvas(1.2)}>
                                    <Plus className="btn-icon" />
                                    Zoom In
                                </button>
                                <button className="zoom-btn" onClick={() => zoomCanvas(0.8)}>
                                    <Minus className="btn-icon" />
                                    Zoom Out
                                </button>
                                <button className="zoom-btn" onClick={() => zoomCanvas(1)}>
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ResumeBuilder;
