import React,{ useState } from 'react';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function DashboardLayout() {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const navigate = useNavigate();

	useEffect(() => {
		const token = localStorage.getItem('token');
		if (!token) {
			navigate('/login');
			return;
		}

		// Check if user is admin and redirect to admin dashboard
		const isAdmin = localStorage.getItem('isAdmin') === 'true';
		if (isAdmin) {
			navigate('/admin-dashboard');
			return;
		}
	}, [navigate]);

	return (
		<div className="dashboard-layout">

			{/* Mobile Navbar */}
			<div className="mobile-navbar">
				<h2 className="mobile-logo">ResumeAI</h2>
				<button className={`toggle-sidebar-btn ${sidebarOpen ? 'hidden' : ''}`} onClick={() => setSidebarOpen(true)}>
					&#9776;
				</button>
			</div>
			
			{/* Button to open sidebar on small screens */}
			{/* <button className="toggle-sidebar-btn" onClick={() => setSidebarOpen(true)}>
				&#9776;
			</button> */}
			
			<Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
				
			<div className="main-content">
				<Outlet />
			</div>
		</div>
	);
};

export default DashboardLayout;
