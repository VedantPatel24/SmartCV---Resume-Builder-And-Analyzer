import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/admin.css';

function AdminDashboard() {
    const navigate = useNavigate();
    const [adminData, setAdminData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        // Check if user is admin
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        const email = localStorage.getItem('email');
        
        console.log('Admin check - isAdmin:', isAdmin, 'email:', email);
        
        if (!isAdmin) {
            console.log('User is not admin, redirecting to dashboard');
            navigate('/dashboard');
            return;
        }
        
        if (email !== 'admincv@gmail.com') {
            console.log('User email is not admincv@gmail.com, redirecting to dashboard');
            navigate('/dashboard');
            return;
        }

        console.log('User is admin, fetching admin data...');
        fetchAdminData();
    }, [navigate]);

    const fetchAdminData = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');
            console.log('Fetching admin data with token:', token ? 'Token exists' : 'No token');
            
            if (!token) {
                setError('No authentication token found. Please log in again.');
                setLoading(false);
                return;
            }
            
            const response = await axios.get('http://localhost:8000/admin-dashboard', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log('Admin data response:', response.data);
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            if (!response.data) {
                setError('No data received from server');
                return;
            }
            
            setAdminData(response.data);
        } catch (err) {
            console.error('Error fetching admin data:', err);
            console.error('Error response:', err.response);
            
            if (err.response?.status === 403) {
                setError('Access denied. You do not have admin privileges. Please log in with admincv@gmail.com');
            } else if (err.response?.status === 401) {
                setError('Authentication failed. Please log in again.');
            } else if (err.response?.data?.message) {
                setError(`Server error: ${err.response.data.message}`);
            } else if (err.message) {
                setError(`Network error: ${err.message}`);
            } else {
                setError('Failed to fetch admin data. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('username');
        localStorage.removeItem('email');
        navigate('/login');
    };

    if (loading) {
        return <div className="loading">Loading admin dashboard...</div>;
    }

    if (error) {
        return (
            <div className="error-message">
                <p>{error}</p>
                <button className="retry-btn" onClick={fetchAdminData}>
                    Retry
                </button>
            </div>
        );
    }

    if (!adminData) {
        return <div className="loading">No data available</div>;
    }

    // Debug: Log the adminData structure
    console.log('Admin data structure:', adminData);
    console.log('Admin data keys:', Object.keys(adminData));

    // Add defensive programming to handle missing data
    const overview = adminData.overview || {};
    const recent_activities = adminData.recent_activities || [];
    const users = adminData.users || [];
    
    // Debug: Log the extracted data
    console.log('Overview:', overview);
    console.log('Recent activities:', recent_activities);
    console.log('Users:', users);
    
    // Additional safety check
    if (!overview || typeof overview !== 'object') {
        console.error('Overview is not an object:', overview);
        return (
            <div className="error-message">
                <p>Invalid data structure received from server</p>
                <button className="retry-btn" onClick={fetchAdminData}>
                    Retry
                </button>
            </div>
        );
    }
    
    const username = localStorage.getItem('username') || 'Admin';
    const email = localStorage.getItem('email') || 'admincv@gmail.com';

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h1>Admin Dashboard</h1>
                <div className="admin-user-info">
                    <span>Welcome, {username}</span>
                    <span>({email})</span>
                    <button className="logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Total Users</h3>
                    <p className="stat-number">{overview.total_users || 0}</p>
                </div>
                <div className="stat-card">
                    <h3>Total Analyses</h3>
                    <p className="stat-number">{overview.total_analyses || 0}</p>
                </div>
                <div className="stat-card">
                    <h3>Total Builds</h3>
                    <p className="stat-number">{overview.total_builds || 0}</p>
                </div>
                <div className="stat-card">
                    <h3>Total Actions</h3>
                    <p className="stat-number">{overview.total_actions || 0}</p>
                </div>
            </div>

            <div className="admin-sections">
                <div className="section admin-section">
                    <h2>Recent Activities</h2>
                    <div className="activities-list">
                        {recent_activities.length > 0 ? (
                            recent_activities.map((activity) => (
                                <div key={activity.id} className="activity-item">
                                    <div className="activity-header">
                                        <span className="user-name">{activity.user}</span>
                                        <span className="activity-type">{activity.action_type}</span>
                                        <span className="activity-time">{activity.created_at}</span>
                                    </div>
                                    <div className="activity-title">{activity.title}</div>
                                    {activity.description && (
                                        <div className="activity-description">{activity.description}</div>
                                    )}
                                    {activity.score && (
                                        <div className="activity-score">Score: {activity.score}%</div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p>No recent activities</p>
                        )}
                    </div>
                </div>

                <div className="section">
                    <h2>User Statistics</h2>
                    <div className="users-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Joined</th>
                                    <th>Analyses</th>
                                    <th>Builds</th>
                                    <th>Drafts</th>
                                    <th>Avg Score</th>
                                    <th>Total Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td>{user.username}</td>
                                        <td>{user.email}</td>
                                        <td>{user.date_joined}</td>
                                        <td>{user.analyses_count}</td>
                                        <td>{user.builds_count}</td>
                                        <td>{user.drafts_count}</td>
                                        <td>{user.avg_score}%</td>
                                        <td>{user.total_actions}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
