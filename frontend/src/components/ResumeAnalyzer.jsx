import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/ResumeAnalyzer.css'

function ResumeAnalyzer() {
	const [pdf, setPdf] = useState(null);
	const [jobDescription, setJobDescription] = useState('');
	const [result, setResult] = useState(null);
	const [careerPaths, setCareerPaths] = useState([]);
	const [jobDetails, setJobDetails] = useState([]);

	const getScoreClass = (score) => {
		if (score >= 80) return "score-good"
		if (score >= 60) return "score-average"
		return "score-poor"
	}

	// Fetch career paths when analysis result is available
	useEffect(() => {
		if (result && result.resume_sections && result.resume_sections.skills) {
			fetchCareerPaths(result.resume_sections.skills);
		}
	}, [result]);

	// Fetch job details when predicted role is available
	useEffect(() => {
		if (result && result.predicted_role) {
			fetchJobDetails(result.predicted_role);
		}
	}, [result]);

	const fetchCareerPaths = async (userSkills) => {
		try {
			const token = localStorage.getItem('token');
			const headers = { 'Content-Type': 'application/json' };
			if (token) {
				headers['Authorization'] = `Bearer ${token}`;
			}
			
			const response = await axios.post('http://localhost:8000/career-paths', {
				skills: userSkills
			}, { headers });
			
			if (response.data.success) {
				setCareerPaths(response.data.career_paths);
			}
		} catch (err) {
			console.error('Error fetching career paths:', err);
			// Fallback to static data if API fails (updated to match new backend logic)
			setCareerPaths([
				{
					job_title: "MERN Stack Developer",
					missing_skills: ["mongodb", "express", "node", "react"],
					match_percentage: 45.0
				},
				{
					job_title: "Full Stack Developer",
					missing_skills: ["django", "react", "api development"],
					match_percentage: 42.0
				}
			]);
		}
	};

	const fetchJobDetails = async (predictedRole) => {
		try {
			const token = localStorage.getItem('token');
			const headers = { 'Content-Type': 'application/json' };
			if (token) {
				headers['Authorization'] = `Bearer ${token}`;
			}
			
			const response = await axios.post('http://localhost:8000/job-details', {
				predicted_role: predictedRole
			}, { headers });
			
			if (response.data.success) {
				setJobDetails(response.data.matching_jobs);
			}
		} catch (err) {
			console.error('Error fetching job details:', err);
			setJobDetails([]);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!pdf || !jobDescription.trim()) {
			alert("Please upload a resume and enter a job description.");
			return;
		}

		const formData = new FormData();
		formData.append('pdf', pdf);
		formData.append('job_description', jobDescription);

		try {
			const token = localStorage.getItem('token');
			const headers = { 'Content-Type': 'multipart/form-data' };
			if (token) {
				headers['Authorization'] = `Bearer ${token}`;
			}
			
			const response = await axios.post('http://localhost:8000/analyze', formData, { headers });
			setResult(response.data);
		} catch (err) {
			console.error(err);
			alert("Failed to analyze resume");
		}
	};

	return (
		// Original Code 

		// <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
		//     <h2>📄 Resume Analyzer</h2>

		//     <form onSubmit={handleSubmit}>
		//         <div style={{ marginBottom: '10px' }}>
		//             <label><strong>Upload Resume PDF:</strong></label><br />
		//             <input
		//                 type="file"
		//                 accept="application/pdf"
		//                 onChange={(e) => setPdf(e.target.files[0])}
		//             />
		//         </div>

		//         <div style={{ marginBottom: '10px' }}>
		//             <label><strong>Preferred Job Role / Description:</strong></label><br />
		//             <textarea
		//                 rows={4}
		//                 cols={60}
		//                 placeholder="e.g., Frontend Developer, Data Analyst..."
		//                 value={jobDescription}
		//                 onChange={(e) => setJobDescription(e.target.value)}
		//             />
		//         </div>

		//         <button type="submit">Analyze Resume</button>
		//     </form>

		//     {result && (
		//         <div style={{ marginTop: '30px' }}>
		//             <h3>✅ Extracted Information</h3>
		//             {
		//                 <div style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: '10px' }}>
		//                     {result}
		//                 </div>
		//             }
		//             <h3>🧠 Job Description Provided</h3>
		//             <div style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: '10px' }}>
		//                 {jobDescription}
		//             </div>
		//         </div>
		//     )}
		// </div>

		// Code for css - 1 

		// <div className="resume-analyzer-wrapper">
		// 	<div className="upload-section">
		// 		<h3>Upload Resume</h3>
		// 		<input
		// 			type="file"
		// 			accept="application/pdf"
		// 			onChange={(e) => setPdf(e.target.files[0])}
		// 		/>
		// 	</div>

		// 	<div className="jd-section">
		// 		<h3>Paste Job Description</h3>
		// 		<textarea
		// 			rows="6"
		// 			value={jobDescription}
		// 			onChange={(e) => setJobDescription(e.target.value)}
		// 			placeholder="e.g., Frontend Developer, Data Analyst..."
		// 		/>
		// 		<button className="analyze-button" onClick={handleSubmit}>Analyze</button>

		// 		{result && (
		// 			<div style={{ marginTop: '30px' }}>
		// 				<h4>Result:</h4>
		// 				<div style={{ background: '#f5f5f5', padding: '10px', whiteSpace: 'pre-wrap' }}>
		// 					{/* {typeof result === 'string' ? result : JSON.stringify(result, null, 2)} */}
		// 					{JSON.stringify(result.resume_text, null, 2)}
		// 				</div>
		// 				<div style={{ background: '#f5f5f5', padding: '10px', whiteSpace: 'pre-wrap' }}>
		// 					{JSON.stringify(result.ats_score, null, 2)}
		// 				</div>
		// 				<div style={{ background: '#f5f5f5', padding: '10px', whiteSpace: 'pre-wrap' }}>
		// 					{JSON.stringify(result.job_description, null, 2)}
		// 				</div>
		// 			</div>
		// 		)}
		// 	</div>
		// </div>

		// Original Code after new json return - 2

		// <div className="resume-analyzer-wrapper">
		// 	<h2>📄 Resume Analyzer</h2>

		// 	<form onSubmit={handleSubmit} className="analyze-form">
		// 		<div className="upload-section">
		// 			<label><strong>Upload Resume PDF:</strong></label><br />
		// 			<input type="file" accept="application/pdf" onChange={(e) => setPdf(e.target.files[0])} />
		// 		</div>

		// 		<div className="jd-section">
		// 			<label><strong>Paste Job Description:</strong></label><br />
		// 			<textarea
		// 				rows={6}
		// 				cols={60}
		// 				placeholder="e.g., Frontend Developer with React, JS, CSS..."
		// 				value={jobDescription}
		// 				onChange={(e) => setJobDescription(e.target.value)}
		// 			/>
		// 		</div>

		// 		<button className="analyze-button" type="submit">Analyze Resume</button>
		// 	</form>

		// 	{result && (
		// 		<div className="analysis-results">
		// 			<h3>🎯 ATS Score: {result.ats_score} / 100</h3>
		// 			<p><strong>Job Description:</strong><br />{result.job_description}</p>

		// 			<h4>✅ Matched Skills</h4>
		// 			<div className="skills-box">
		// 				{result.matched_skills.map((skill, idx) => (
		// 					<span className="skill-badge matched" key={idx}>{skill}</span>
		// 				))}
		// 			</div>

		// 			<h4>❌ Missing Skills</h4>
		// 			<div className="skills-box">
		// 				{result.missing_skills.map((skill, idx) => (
		// 					<span className="skill-badge missing" key={idx}>{skill}</span>
		// 				))}
		// 			</div>

		// 			<p><strong>Match %:</strong> {result.match_percentage}%</p>

		// 			<h4>🧾 Resume Details</h4>
		// 			<pre className="resume-section-box">
		// 				{JSON.stringify(result.resume_sections, null, 2)}
		// 			</pre>
		// 		</div>
		// 	)}
		// </div>



		// Original Code after new json return - 3
		<div className='resume-analyzer'>
			<div className='container'>
				{/* Header */}
				<div className="header">
					<h1>Resume Analyzer</h1>
					<p>Upload your resume and job description to get detailed analysis</p>
				</div>

				{/* Upload Section */}
				{!result && (
					<div className="upload-section">
						{/* Resume Upload */}
						<div className="card">
							<div className="card-header">
								<h3 style={{ display: 'flex', gap: '7px' }}>
									<span style={{ display: 'flex', alignItems: 'center' }}>
										<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
											<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
											<path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
											<path d="M10 9H8"></path><path d="M16 13H8"></path>
											<path d="M16 17H8"></path>
										</svg>
									</span>
									<span>Upload Resume</span>
								</h3>
								<p>Upload your resume in PDF format</p>
							</div>
							<div className="card-content">
								<div className="upload-area">
									<div className="upload-icon">
										<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className='upload-icon'>
											<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
											<polyline points="17 8 12 3 7 8"></polyline>
											<line x1="12" x2="12" y1="3" y2="15"></line>
										</svg>
									</div>
									<div className="upload-text">
										<label htmlFor="resume-upload" className="upload-label">
											<span className="upload-link">Click to upload</span>
											<span> or drag and drop</span>
										</label>
										<input id="resume-upload" type="file" accept="application/pdf" onChange={(e) => setPdf(e.target.files[0])} className="file-input" />
										<p className="upload-hint">PDF files only</p>
									</div>
								</div>
								{pdf && (
									<div className="file-success">
										<span className="success-icon">
											<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className='check-icon'>
												<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
												<path d="m9 11 3 3L22 4"></path>
											</svg>
										</span>
										<span>{pdf.name}</span>
									</div>
								)}
							</div>
						</div>

						{/* Job Description */}
						<div className="card">
							<div className="card-header">
								<h3 style={{ display: 'flex', gap: '7px' }}>
									<span style={{ display: 'flex', alignItems: 'center' }}>
										<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
											<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
											<rect width="20" height="14" x="2" y="6" rx="2"></rect>
										</svg>
									</span>
									<span>Job Description</span>
								</h3>
								<p>Paste the job description you want to match against</p>
							</div>
							<div className="card-content">
								<textarea
									placeholder="Paste the job description here..."
									value={jobDescription}
									onChange={(e) => setJobDescription(e.target.value)}
									className="job-textarea"
								/>
							</div>
						</div>
					</div>
				)}

				{/* Analyze Button */}
				{!result && (
					<div className="analyze-section">
						<button onClick={handleSubmit} disabled={!pdf || !jobDescription.trim()} className="analyze-btn">
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className='target-icon'>
								<circle cx="12" cy="12" r="10"></circle>
								<circle cx="12" cy="12" r="6"></circle>
								<circle cx="12" cy="12" r="2"></circle>
							</svg>
							Analyze Resume
						</button>
					</div>
				)}

				{/* Analysis Results */}
				{result && (
					<div className="results-section">
						{/* Back Button */}
						<button className="back-btn" onClick={() => setResult(null)}>
							← New Analysis
						</button>

						{/* ATS Score & Overview */}
						<div className="overview-grid">
							<div className={`score-card ${getScoreClass(result.ats_score)}`}>
								<h3 style={{ textAlign: 'center' }} className='first-row'>ATS Score</h3>
								<div className="score-value">{result.ats_score}%</div>
							</div>

							<div className="card">
								<div className="card-header">
									<h3 className='first-row'>Skills Match</h3>
									<div className="match-score">
										{result.total_skills_matched}/{result.total_skills_required}
									</div>
									<div className="progress-bar">
										<div className="progress-fill" style={{ width: `${result.match_percentage}%` }}></div>
									</div>
									<p className="match-percentage">{result.match_percentage}% Match</p>
								</div>
							</div>

							<div className="card">
								<div className="card-header" style={{ height: '100%' }}>
									<h3 className='first-row'>Predicted Role</h3>
									<div className="predicted-role">{result.predicted_role}</div>
								</div>
							</div>
						</div>

						{/* Skills Analysis */}
						<div className="skills-grid">
							<div className="card">
								<div className="card-header">
									<h3 className="matched-skills-title">
										<span style={{ display: 'flex', alignItems: 'center' }}>
											<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check-big h-5 w-5">
												<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
												<path d="m9 11 3 3L22 4"></path>
											</svg>
										</span>
										<span>Matched Skills</span>
									</h3>
								</div>
								<div className="card-content">
									<div className="skills-container">
										{result.matched_skills.map((skill, index) => (
											<span key={index} className="skill-badge matched">
												{skill}
											</span>
										))}
									</div>
								</div>
							</div>

							<div className="card">
								<div className="card-header">
									<h3 className="missing-skills-title">
										<span style={{ display: 'flex', alignItems: 'center' }}>
											<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-x h-5 w-5">
												<circle cx="12" cy="12" r="10"></circle>
												<path d="m15 9-6 6"></path>
												<path d="m9 9 6 6"></path>
											</svg>
										</span>
										<span>Missing Skills</span>
									</h3>
								</div>
								<div className="card-content">
									<div className="skills-container">
										{result.missing_skills.map((skill, index) => (
											<span key={index} className="skill-badge missing">
												{skill}
											</span>
										))}
									</div>
								</div>
							</div>
						</div>

						{/* Suggestions */}
						<div className="card">
							<div className="card-header">
								<h3 style={{ display: 'flex', gap: '7px' }}>
									<span style={{ display: 'flex', alignItems: 'center' }}>
										<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-lightbulb h-5 w-5 text-yellow-500">
											<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path>
											<path d="M9 18h6"></path>
											<path d="M10 22h4"></path>
										</svg>
									</span>
									<span>Improvement Suggestions</span>
								</h3>
							</div>
							<div className="card-content">
								<div className="suggestions-list">
									{result.suggestions.map((suggestion, index) => (
										<div key={index} className="suggestion-item">
											<span className="suggestion-number">{index + 1}.</span>
											<span>{suggestion}</span>
										</div>
									))}
								</div>
							</div>
						</div>

						{/* Potential Roles */}
						<div className="card">
							<div className="card-header">
								<h3 style={{ display: 'flex', gap: '7px' }}>
									<span style={{ display: 'flex', alignItems: 'center' }}>
										<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trending-up h-5 w-5 text-purple-500">
											<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
											<polyline points="16 7 22 7 22 13"></polyline>
										</svg>
									</span>
									<span>Potential Career Paths</span>
								</h3>
								<p>Roles you could qualify for with additional skills</p>
							</div>
							<div className="card-content">
								<div className="roles-list">
									{careerPaths.map((role, index) => (
										<div key={index} className="role-item">
											<h4>{role.job_title}</h4>
											<p>Skills needed:</p>
											<div className="skills-container">
												{role.missing_skills.map((skill, skillIndex) => (
													<span key={skillIndex} className="skill-badge outline">
														{skill}
													</span>
												))}
											</div>
											<p>Match Percentage: {role.match_percentage}%</p>
										</div>
									))}
								</div>
							</div>
						</div>

						{/* Job Details */}
						<div className="card">
							<div className="card-header">
								<h3 style={{ display: 'flex', gap: '7px' }}>
									<span style={{ display: 'flex', alignItems: 'center' }}>
										<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-briefcase h-5 w-5 text-blue-500">
											<rect width="20" height="14" x="2" y="6" rx="2"></rect>
											<path d="M16 10H8"></path>
											<path d="M16 14H8"></path>
											<path d="M10 6H8"></path>
										</svg>
									</span>
									<span>Job Opportunities for {result.predicted_role}</span>
								</h3>
								<p>Real job listings matching your predicted role</p>
							</div>
							<div className="card-content">
								{jobDetails.length > 0 ? (
									<div className="job-details-list">
										{jobDetails.map((job, index) => (
											<div key={index} className="job-item">
												<div className="job-header">
													<h4>{job.job_title}</h4>
													<span className={`work-type ${job.work_from_home === 'Yes' ? 'remote' : 'onsite'}`}>
														{job.work_from_home === 'Yes' ? '🌐 Remote' : '🏢 On-site'}
													</span>
												</div>
												<div className="job-info">
													<p className="company-name">🏢 {job.company_name}</p>
													<p className="location">📍 {job.location}</p>
													<p className="salary">💰 {job.salary}</p>
												</div>
												<div className="job-skills">
													<p><strong>Required Skills:</strong></p>
													<div className="skills-container">
														{job.skills.split(',').map((skill, skillIndex) => (
															<span key={skillIndex} className="skill-badge outline">
																{skill.trim()}
															</span>
														))}
													</div>
												</div>
												<a href={job.job_link} target="_blank" rel="noopener noreferrer" className="apply-link">
													Apply Now →
												</a>
											</div>
										))}
									</div>
								) : (
									<div className="no-jobs">
										<p>No job listings found for this role. Try analyzing a resume with different skills.</p>
									</div>
								)}
							</div>
						</div>

						{/* Resume Breakdown */}
						<div className="card">
							<div className="card-header">
								<h3 style={{ display: 'flex', gap: '7px' }}>
									<span style={{ display: 'flex', alignItems: 'center' }}>
										<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user h-5 w-5">
											<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
											<circle cx="12" cy="7" r="4"></circle>
										</svg>
									</span>
									<span>Resume Overview</span>
								</h3>
							</div>
							<div className="card-content">
								<div className="resume-grid">
									<div className="resume-info">
										<div className="info-item">
											<span className="info-icon">
												<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="icon-small-gray">
													<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
													<circle cx="12" cy="7" r="4"></circle>
												</svg>
											</span>
											<span className="info-label">Name:</span>
											<span>{result.resume_sections.person.name}</span>
										</div>
										<div className="info-item">
											<span className="info-icon">
												<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="icon-small-gray">
													<rect width="20" height="16" x="2" y="4" rx="2"></rect>
													<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
												</svg>
											</span>
											<span className="info-label">Email:</span>
											<span>{result.resume_sections.person.email}</span>
										</div>
										<div className="info-item">
											<span className="info-icon">
												<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="icon-small-gray">
													<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
												</svg>
											</span>
											<span className="info-label">Phone:</span>
											<span>{result.resume_sections.person.phone}</span>
										</div>
									</div>

									<div className="resume-sections">
										<div className="section-item">
											<div className="section-header">
												<span className="section-icon-analyze">
													<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="icon-small-gray">
														<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"></path>
														<path d="M22 10v6"></path><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"></path>
													</svg>
												</span>
												<span className="section-label">Education:</span>
											</div>
											<div className="section-content-analyze">
												{result.resume_sections.education.map((edu, index) => (
													<span key={index} className="skill-badge outline">
														{edu.degree}
													</span>
												))}
											</div>
										</div>

										<div className="section-item">
											<div className="section-header">
												<span className="section-icon-analyze">
													<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="icon-small-gray">
														<rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect>
														<path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path>
														<path d="M16 6h.01"></path><path d="M12 6h.01"></path>
														<path d="M12 10h.01"></path><path d="M12 14h.01"></path>
														<path d="M16 10h.01"></path><path d="M16 14h.01"></path>
														<path d="M8 10h.01"></path><path d="M8 14h.01"></path>
													</svg>
												</span>
												<span className="section-label">Experience:</span>
											</div>
											<div className="section-content-analyze">
												{result.resume_sections.experience.map((exp, index) => (
													<span key={index} className="skill-badge outline">
														{exp}
													</span>
												))}
											</div>
										</div>

										<div className="section-item">
											<div className="section-header">
												<span className="section-icon-analyze">
													<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="icon-small-gray">
														<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"></path>
													</svg>
												</span>
												<span className="section-label">Projects:</span>
											</div>
											<div className="section-content-analyze">
												{result.resume_sections.projects.map((project, index) => (
													<span key={index} className="skill-badge outline">
														{project.name}
													</span>
												))}
											</div>
										</div>

										<div className="section-item">
											<div className="section-header">
												<span className="section-icon-analyze">
													<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="icon-small-gray">
														<path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"></path>
														<circle cx="12" cy="8" r="6"></circle>
													</svg>
												</span>
												<span className="section-label">Certifications:</span>
											</div>
											<div className="section-content-analyze">
												{result.resume_sections.certifications.map((cert, index) => (
													<span key={index} className="skill-badge outline">
														{cert.name}
													</span>
												))}
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default ResumeAnalyzer;

