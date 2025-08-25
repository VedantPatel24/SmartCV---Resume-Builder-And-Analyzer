import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Sidebar({ isOpen, setIsOpen }){
	const location = useLocation();
	const navigate = useNavigate();
	const [user, setUser] = useState({ username: '', email: '' });

	useEffect(() => {
		const token = localStorage.getItem('token');
		if (!token) return;
		
		// Check if user is admin and redirect
		const isAdmin = localStorage.getItem('isAdmin') === 'true';
		if (isAdmin) {
			navigate('/admin-dashboard');
			return;
		}
		
		axios.get('http://localhost:8000/me', { headers: { Authorization: `Bearer ${token}` } })
			.then(res => setUser(res.data))
			.catch(() => {
				// If token invalid, force logout
				localStorage.removeItem('token');
				localStorage.removeItem('isAdmin');
				localStorage.removeItem('username');
				localStorage.removeItem('email');
				navigate('/login');
			});
	}, [navigate]);

	const links = [
		{ name: 'Dashboard', path: '/dashboard/' },
		{ name: 'Resume Analyzer', path: '/dashboard/analyzer' },
		{ name: 'Resume Builder', path: '/dashboard/builder' },
		{ name: 'Analytics', path: '/dashboard/analytics' },
		{ name: 'History', path: '/dashboard/history' },
	];

	const accountLinks = [
		{ name: 'Profile', path: '/dashboard/profile' },
	];

	const handleLogout = () => {
		localStorage.removeItem('token');
		localStorage.removeItem('isAdmin');
		localStorage.removeItem('username');
		localStorage.removeItem('email');
		navigate('/login');
	};

	return (
		<div className={`sidebar ${isOpen ? 'open' : ''}`}>
			{/* Close button removed - not needed */}

			<h1 className="logo">SmartCV</h1>

			<div className="section sidebar-section">
				<p className="section-title">Main</p>
				{links.map((link) => (
					<Link
						key={link.path}
						to={link.path}
						className={location.pathname === link.path ? 'active-link' : 'link'}
						// onClick={onClose}
						onClick={() => setIsOpen(false)}
					>
						{link.name}
					</Link>
				))}
			</div>

			<div className="section">
				<p className="section-title">Account</p>
				{accountLinks.map((link) => (
					<Link
						key={link.path}
						to={link.path}
						className={location.pathname === link.path ? 'active-link' : 'link'}
						// onClick={onClose}
						onClick={() => setIsOpen(false)}
					>
						{link.name}
						
					</Link>
				))}
			</div>

			<div className="user-info">
				<p>{user.username || 'Guest'}</p>
				<p>{user.email || ''}</p>
				<button onClick={handleLogout} className="logout-btn">Logout</button>
			</div>
		</div>
	);
};

export default Sidebar;
