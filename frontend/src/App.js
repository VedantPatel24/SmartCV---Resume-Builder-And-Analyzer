import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './css/dashboard.css';
import './css/auth.css';
import './css/profile.css';
import './css/history.css';
import './css/admin.css';

import Analytics from './components/Analytics';
import Dashboard from './components/Dashboard';
import DashboardLayout from './components/DashboardLayout';
import History from './components/History';
import Login from './components/Login';
import Profile from './components/Profile';
import Register from './components/Register';
import ResumeAnalyzer from './components/ResumeAnalyzer';
import ResumeBuilder from './components/ResumeBuilder';
import AdminDashboard from './components/AdminDashboard';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/dashboard" element={<DashboardLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="analyzer" element={<ResumeAnalyzer />} />
                    <Route path="builder" element={<ResumeBuilder />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="history" element={<History />} />
                    <Route path="profile" element={<Profile />} />
                </Route>
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
            </Routes>
        </Router>
    )
}

export default App;
