import React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/profile.css';

function Profile(){
	const [user, setUser] = useState({ username: '', email: '' });
	const [loading, setLoading] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	const [editData, setEditData] = useState({ username: '', email: '' });
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const navigate = useNavigate();

	useEffect(() => {
		const token = localStorage.getItem('token');
		if (!token) {
			navigate('/login');
			return;
		}
		
		// Check if user is admin and redirect
		const isAdmin = localStorage.getItem('isAdmin') === 'true';
		if (isAdmin) {
			navigate('/admin-dashboard');
			return;
		}
		
		axios.get('http://localhost:8000/me', { headers: { Authorization: `Bearer ${token}` } })
			.then(res => {
				setUser(res.data);
				setEditData(res.data);
				// Update localStorage with admin status
				if (res.data.is_admin !== undefined) {
					localStorage.setItem('isAdmin', res.data.is_admin);
				}
				setLoading(false);
			})
			.catch(() => {
				localStorage.removeItem('token');
				localStorage.removeItem('isAdmin');
				localStorage.removeItem('username');
				localStorage.removeItem('email');
				navigate('/login');
			});
	}, [navigate]);

	const handleLogout = () => {
		localStorage.removeItem('token');
		localStorage.removeItem('isAdmin');
		localStorage.removeItem('username');
		localStorage.removeItem('email');
		navigate('/login');
	};

	const handleEdit = () => {
		setIsEditing(true);
		setError('');
		setSuccess('');
	};

	const handleCancel = () => {
		setIsEditing(false);
		setEditData({ username: user.username, email: user.email });
		setError('');
		setSuccess('');
	};

	const handleSave = async () => {
		setSaving(true);
		setError('');
		setSuccess('');
		
		try {
			const token = localStorage.getItem('token');
			const res = await axios.put('http://localhost:8000/update-profile', editData, {
				headers: { Authorization: `Bearer ${token}` }
			});
			
			// Update local state
			setUser(editData);
			setIsEditing(false);
			
			// Update token and admin status if provided
			if (res.data.token) {
				localStorage.setItem('token', res.data.token);
			}
			if (res.data.is_admin !== undefined) {
				localStorage.setItem('isAdmin', res.data.is_admin);
			}
			
			setSuccess('Profile updated successfully!');
			setTimeout(() => setSuccess(''), 3000);
			
			// Check if user became admin and redirect
			if (res.data.is_admin) {
				setTimeout(() => {
					navigate('/admin-dashboard');
				}, 2000);
			} else {
				// Force sidebar to refresh user info
				window.location.reload();
			}
		} catch (err) {
			setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
		} finally {
			setSaving(false);
		}
	};

	const handleInputChange = (e) => {
		setEditData({
			...editData,
			[e.target.name]: e.target.value
		});
	};

	const getInitials = (name) => {
		if (!name) return 'U';
		return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
	};

	if (loading) {
		return (
			<div className="profile-container">
				<div className="profile-loading">Loading profile...</div>
			</div>
		);
	}

	return (
		<div className="profile-container">
			<div className="profile-header">
				<div className="profile-avatar">
					{getInitials(isEditing ? editData.username : user.username)}
				</div>
				<div className="profile-name">
					{isEditing ? (
						<input
							type="text"
							name="username"
							value={editData.username}
							onChange={handleInputChange}
							className="profile-edit-input"
							placeholder="Username"
						/>
					) : (
						user.username
					)}
				</div>
				<div className="profile-email">
					{isEditing ? (
						<input
							type="email"
							name="email"
							value={editData.email}
							onChange={handleInputChange}
							className="profile-edit-input"
							placeholder="Email"
						/>
					) : (
						user.email
					)}
				</div>
			</div>

			{error && <div className="message error">{error}</div>}
			{success && <div className="message success">{success}</div>}
			{editData.email === 'admincv@gmail.com' && isEditing && (
				<div className="message warning">
					⚠️ Changing your email to admincv@gmail.com will grant you administrator privileges.
				</div>
			)}

			<div className="profile-content">
				<div className="profile-section">
					<h2 className="section-title">Account Information</h2>
					<div className="profile-info">
						<div className="info-item">
							<div className="info-label">Username</div>
							<div className="info-value">
								{isEditing ? (
									<input
										type="text"
										name="username"
										value={editData.username}
										onChange={handleInputChange}
										className="info-edit-input"
										placeholder="Username"
									/>
								) : (
									user.username
								)}
							</div>
						</div>
						<div className="info-item">
							<div className="info-label">Email Address</div>
							<div className="info-value">
								{isEditing ? (
									<input
										type="email"
										name="email"
										value={editData.email}
										onChange={handleInputChange}
										className="info-edit-input"
										placeholder="Email"
									/>
								) : (
									user.email
								)}
							</div>
						</div>
						<div className="info-item">
							<div className="info-label">Account Type</div>
							<div className="info-value">
								{user.is_admin ? 'Administrator' : 'Standard User'}
							</div>
						</div>
						<div className="info-item">
							<div className="info-label">Member Since</div>
							<div className="info-value">2024</div>
						</div>
					</div>
				</div>

				<div className="profile-section">
					<h2 className="section-title">Account Actions</h2>
					<div className="profile-actions">
						{isEditing ? (
							<>
								<button 
									onClick={handleSave} 
									className="profile-btn profile-btn-primary"
									disabled={saving}
								>
									{saving ? 'Saving...' : '💾 Save Changes'}
								</button>
								<button 
									onClick={handleCancel} 
									className="profile-btn profile-btn-secondary"
									disabled={saving}
								>
									❌ Cancel
								</button>
							</>
						) : (
							<button 
								onClick={handleEdit} 
								className="profile-btn profile-btn-primary"
							>
								📝 Edit Profile
							</button>
						)}
						<button 
							onClick={handleLogout} 
							className="profile-btn profile-btn-danger"
						>
							🚪 Logout
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Profile;
