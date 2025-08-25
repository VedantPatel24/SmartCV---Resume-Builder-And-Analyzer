import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/history.css';

function History() {
    const [history, setHistory] = useState([]);
    const [drafts, setDrafts] = useState([]);
    const [stats, setStats] = useState({
        total_analyzer: 0,
        total_builder: 0,
        avg_score: 0,
        total_actions: 0
    });
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('history'); // 'history' or 'drafts'
    const navigate = useNavigate();

    useEffect(() => {
        fetchHistory();
        fetchDrafts();
    }, [filterType]);

    // Refresh data when user returns to the page (e.g., after building a resume from draft)
    useEffect(() => {
        const handleFocus = () => {
            fetchHistory();
            fetchDrafts();
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const params = new URLSearchParams();
            if (filterType) {
                params.append('action_type', filterType);
            }

            const response = await axios.get(`http://localhost:8000/history?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setHistory(response.data.history);
            setStats(response.data.stats);
            setLoading(false);
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                navigate('/login');
            } else {
                setError('Failed to load history');
                setLoading(false);
            }
        }
    };

    const fetchDrafts = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await axios.get('http://localhost:8000/list-drafts', {
                headers: { Authorization: `Bearer ${token}` }
            });

            setDrafts(response.data.drafts || []);
        } catch (err) {
            console.error('Failed to fetch drafts:', err);
        }
    };

    const handleDelete = async (historyId) => {
        if (!window.confirm('Are you sure you want to delete this history item?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:8000/delete-history/${historyId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Refresh history after deletion
            fetchHistory();
        } catch (err) {
            setError('Failed to delete history item');
        }
    };

    const handleDeleteDraft = async (draftId) => {
        if (!window.confirm('Are you sure you want to delete this draft?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:8000/delete-history/${draftId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Refresh drafts after deletion
            fetchDrafts();
        } catch (err) {
            setError('Failed to delete draft');
        }
    };

    const handleDownload = (filePath) => {
        if (filePath) {
            window.open(`http://localhost:8000${filePath}`, '_blank');
        }
    };

    const handleContinueDraft = (draftId) => {
        navigate(`/dashboard/builder?draft=${draftId}`);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getActionIcon = (actionType) => {
        return actionType === 'analyzer' ? '📊' : '📝';
    };

    const getActionColor = (actionType) => {
        return actionType === 'analyzer' ? 'analyzer' : 'builder';
    };

    if (loading) {
        return (
            <div className="history-container">
                <div className="history-loading">Loading history...</div>
            </div>
        );
    }

    return (
        <div className="history-container">
            <div className="history-header">
                <h1 className="history-title">Activity History</h1>
                <p className="history-subtitle">Track your resume analysis, building activities, and drafts</p>
            </div>

            {error && (
                <div className="message error" style={{ marginBottom: '20px' }}>
                    {error}
                </div>
            )}

            {/* Stats Cards */}
            {/* <div className="history-stats">
                <div className="stat-card">
                    <div className="stat-number">{stats.total_actions}</div>
                    <div className="stat-label">Total Activities</div>
                </div>
                <div className="stat-card">
                    <div className="stat-number">{stats.total_analyzer}</div>
                    <div className="stat-label">Resume Analyses</div>
                </div>
                <div className="stat-card">
                    <div className="stat-number">{stats.total_builder}</div>
                    <div className="stat-label">Resumes Built</div>
                </div>
                <div className="stat-card">
                    <div className="stat-number">{drafts.length}</div>
                    <div className="stat-label">Saved Drafts</div>
                </div>
            </div> */}

            {/* Tab Navigation */}
            <div className="history-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    📋 History
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'drafts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('drafts')}
                >
                    📝 Drafts ({drafts.length})
                </button>
            </div>

            {/* Filters - Only show for history tab */}
            {activeTab === 'history' && (
                <div className="history-filters">
                    <div className="filter-row">
                        <div className="filter-group">
                            <label className="filter-label">Filter by Type</label>
                            <select
                                className="filter-select"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                            >
                                <option value="">All Activities</option>
                                <option value="analyzer">Resume Analyzer</option>
                                <option value="builder">Resume Builder</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Content based on active tab */}
            {activeTab === 'history' ? (
                /* History List */
                <div className="history-list">
                    {history.length === 0 ? (
                        <div className="history-empty">
                            <div className="history-empty-icon">📋</div>
                            <h3 className="history-empty-title">No History Found</h3>
                            <p className="history-empty-text">
                                Start using ResumeAI to see your activity history here.
                            </p>
                            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                                <button
                                    className="action-btn action-btn-primary"
                                    onClick={() => navigate('/dashboard/analyzer')}
                                >
                                    📊 Analyze Resume
                                </button>
                                <button
                                    className="action-btn action-btn-secondary"
                                    onClick={() => navigate('/dashboard/builder')}
                                >
                                    📝 Build Resume
                                </button>
                            </div>
                        </div>
                    ) : (
                        history.map((item) => (
                            <div key={item.id} className="history-item">
                                <div className="history-item-header">
                                    <div>
                                        <h3 className="history-item-title">
                                            {getActionIcon(item.action_type)} {item.title}
                                        </h3>
                                        <span className={`history-item-type ${getActionColor(item.action_type)}`}>
                                            {item.action_type === 'analyzer' ? 'Resume Analyzer' : 'Resume Builder'}
                                        </span>
                                    </div>
                                    <div className="history-item-date">
                                        {formatDate(item.created_at)}
                                    </div>
                                </div>

                                <div className="history-item-details">
                                    <div className="detail-item">
                                        <div className="detail-label">Description</div>
                                        <div className="detail-value">{item.description}</div>
                                    </div>
                                    
                                    {item.score && (
                                        <div className="detail-item">
                                            <div className="detail-label">ATS Score</div>
                                            <div className="detail-value">{item.score}%</div>
                                        </div>
                                    )}
                                    
                                    {item.job_description && (
                                        <div className="detail-item">
                                            <div className="detail-label">Job Description</div>
                                            <div className="detail-value">
                                                {item.job_description.length > 100 
                                                    ? `${item.job_description.substring(0, 100)}...` 
                                                    : item.job_description
                                                }
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="history-item-actions">
                                    {item.file_path && (
                                        <button
                                            className="action-btn action-btn-primary"
                                            onClick={() => handleDownload(item.file_path)}
                                        >
                                            📥 Download
                                        </button>
                                    )}
                                    
                                    <button
                                        className="action-btn action-btn-secondary"
                                        onClick={() => {
                                            if (item.action_type === 'analyzer') {
                                                navigate('/dashboard/analyzer');
                                            } else {
                                                navigate('/dashboard/builder');
                                            }
                                        }}
                                    >
                                        🔄 Repeat
                                    </button>
                                    
                                    <button
                                        className="action-btn action-btn-danger"
                                        onClick={() => handleDelete(item.id)}
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                /* Drafts List */
                <div className="history-list">
                    {drafts.length === 0 ? (
                        <div className="history-empty">
                            <div className="history-empty-icon">📝</div>
                            <h3 className="history-empty-title">No Drafts Found</h3>
                            <p className="history-empty-text">
                                Start building a resume to save drafts for later.
                            </p>
                            <button
                                className="action-btn action-btn-primary"
                                onClick={() => navigate('/dashboard/builder')}
                            >
                                📝 Start Building
                            </button>
                        </div>
                    ) : (
                        drafts.map((draft) => (
                            <div key={draft.id} className="history-item">
                                <div className="history-item-header">
                                    <div>
                                        <h3 className="history-item-title">
                                            📝 {draft.title}
                                        </h3>
                                        <span className="history-item-type draft">
                                            Resume Draft
                                        </span>
                                    </div>
                                    <div className="history-item-date">
                                        {formatDate(draft.updated_at)}
                                    </div>
                                </div>

                                <div className="history-item-details">
                                    <div className="detail-item">
                                        <div className="detail-label">Last Modified</div>
                                        <div className="detail-value">{formatDate(draft.updated_at)}</div>
                                    </div>
                                </div>

                                <div className="history-item-actions">
                                    <button
                                        className="action-btn action-btn-primary"
                                        onClick={() => handleContinueDraft(draft.id)}
                                    >
                                        ✏️ Continue Editing
                                    </button>
                                    
                                    <button
                                        className="action-btn action-btn-danger"
                                        onClick={() => handleDeleteDraft(draft.id)}
                                    >
                                        🗑️ Delete Draft
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export default History;
