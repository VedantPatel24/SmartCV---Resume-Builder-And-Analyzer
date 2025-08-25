import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import '../css/analytics.css';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

function Analytics() {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [timeRange, setTimeRange] = useState('month'); // week, month, year
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        fetchAnalyticsData();
        fetchUserData();
    }, [timeRange]);

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No authentication token found');
                return;
            }

            // Get user's history data
            const response = await axios.get('http://localhost:8000/history', {
                headers: { Authorization: `Bearer ${token}` },
                params: { limit: 1000 } // Get all history for analytics
            });

            const historyData = response.data.history;
            const stats = response.data.stats;

            // Process data for charts
            const processedData = processHistoryData(historyData, stats);
            setAnalyticsData(processedData);

        } catch (err) {
            console.error('Error fetching analytics data:', err);
            setError('Failed to fetch analytics data');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await axios.get('http://localhost:8000/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserData(response.data);
        } catch (err) {
            console.error('Error fetching user data:', err);
        }
    };

    const processHistoryData = (historyData, stats) => {
        // Group data by date for trends
        const dateGroups = {};
        const scoreRanges = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
        const actionTypeCounts = { analyzer: 0, builder: 0, draft: 0 };
        const monthlyData = {};
        const weeklyData = {};

        historyData.forEach(item => {
            const date = new Date(item.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const weekKey = `${date.getFullYear()}-W${Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)}`;

            // Count action types
            actionTypeCounts[item.action_type]++;

            // Group by date
            const dateKey = date.toISOString().split('T')[0];
            if (!dateGroups[dateKey]) {
                dateGroups[dateKey] = { analyzer: 0, builder: 0, draft: 0, total: 0 };
            }
            dateGroups[dateKey][item.action_type]++;
            dateGroups[dateKey].total++;

            // Monthly grouping
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { analyzer: 0, builder: 0, draft: 0, total: 0, avgScore: 0, scoreCount: 0 };
            }
            monthlyData[monthKey][item.action_type]++;
            monthlyData[monthKey].total++;
            if (item.score) {
                monthlyData[monthKey].avgScore += item.score;
                monthlyData[monthKey].scoreCount++;
            }

            // Weekly grouping
            if (!weeklyData[weekKey]) {
                weeklyData[weekKey] = { analyzer: 0, builder: 0, draft: 0, total: 0, avgScore: 0, scoreCount: 0 };
            }
            weeklyData[weekKey][item.action_type]++;
            weeklyData[weekKey].total++;
            if (item.score) {
                weeklyData[weekKey].avgScore += item.score;
                weeklyData[weekKey].scoreCount++;
            }

            // Score distribution (only for analyzer actions)
            if (item.action_type === 'analyzer' && item.score) {
                if (item.score <= 20) scoreRanges['0-20']++;
                else if (item.score <= 40) scoreRanges['21-40']++;
                else if (item.score <= 60) scoreRanges['41-60']++;
                else if (item.score <= 80) scoreRanges['61-80']++;
                else scoreRanges['81-100']++;
            }
        });

        // Calculate averages
        Object.keys(monthlyData).forEach(key => {
            if (monthlyData[key].scoreCount > 0) {
                monthlyData[key].avgScore = Math.round(monthlyData[key].avgScore / monthlyData[key].scoreCount);
            }
        });

        Object.keys(weeklyData).forEach(key => {
            if (weeklyData[key].scoreCount > 0) {
                weeklyData[key].avgScore = Math.round(weeklyData[key].avgScore / weeklyData[key].scoreCount);
            }
        });

        return {
            stats,
            dateGroups,
            scoreRanges,
            actionTypeCounts,
            monthlyData,
            weeklyData,
            totalEntries: historyData.length
        };
    };

    const renderActivityChart = () => {
        if (!analyticsData) return null;

        const timeData = timeRange === 'month' ? analyticsData.monthlyData : 
                        timeRange === 'week' ? analyticsData.weeklyData : 
                        analyticsData.dateGroups;

        // Debug logging
        console.log('Time data for activity chart:', timeData);
        console.log('Time range:', timeRange);

        const labels = Object.keys(timeData).slice(-10); // Last 10 entries
        const analyzerData = labels.map(label => timeData[label]?.analyzer || 0);
        const builderData = labels.map(label => timeData[label]?.builder || 0);
        const draftData = labels.map(label => timeData[label]?.draft || 0);

        // Debug logging
        console.log('Labels:', labels);
        console.log('Analyzer data:', analyzerData);
        console.log('Builder data:', builderData);
        console.log('Draft data:', draftData);

        // If no data, show empty state
        if (labels.length === 0) {
            return (
                <div className="chart-container">
                    <h3>Activity Trends ({timeRange})</h3>
                    <div className="chart">
                        <div className="no-data-message">
                            <p>No activity data available for {timeRange} view</p>
                            <p>Try switching to a different time range or complete some activities</p>
                        </div>
                    </div>
                </div>
            );
        }

        const chartData = {
            labels: labels,
            datasets: [
                {
                    label: 'Analyses',
                    data: analyzerData,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 2,
                },
                {
                    label: 'Builds',
                    data: builderData,
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 2,
                },
                {
                    label: 'Drafts',
                    data: draftData,
                    backgroundColor: 'rgba(245, 158, 11, 0.8)',
                    borderColor: 'rgba(245, 158, 11, 1)',
                    borderWidth: 2,
                }
            ]
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        padding: 15,
                        font: {
                            size: window.innerWidth <= 480 ? 10 : 12
                        }
                    }
                },
                title: {
                    display: false,
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: {
                            size: window.innerWidth <= 480 ? 10 : 12
                        }
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: window.innerWidth <= 480 ? 8 : 10
                        }
                    }
                }
            }
        };

        return (
            <div className="chart-container">
                <h3>Activity Trends ({timeRange})</h3>
                <div className="chart">
                    <Bar data={chartData} options={options} />
                </div>
            </div>
        );
    };

    const renderScoreDistribution = () => {
        if (!analyticsData?.scoreRanges) return null;

        const scoreRanges = analyticsData.scoreRanges;
        console.log('Score ranges data:', scoreRanges);

        // Check if there are any scores
        const hasScores = Object.values(scoreRanges).some(count => count > 0);
        
        if (!hasScores) {
            return (
                <div className="chart-container">
                    <h3>ATS Score Distribution</h3>
                    <div className="chart">
                        <div className="no-data-message">
                            <p>No ATS scores available yet</p>
                            <p>Complete a resume analysis to see your score distribution</p>
                        </div>
                    </div>
                </div>
            );
        }

        const chartData = {
            labels: Object.keys(scoreRanges),
            datasets: [
                {
                    label: 'Number of Resumes',
                    data: Object.values(scoreRanges),
                    backgroundColor: [
                        'rgba(239, 68, 68, 0.8)',   // Red for 0-20
                        'rgba(245, 158, 11, 0.8)',  // Orange for 21-40
                        'rgba(245, 158, 11, 0.8)',  // Yellow for 41-60
                        'rgba(16, 185, 129, 0.8)',  // Green for 61-80
                        'rgba(16, 185, 129, 0.8)',  // Dark green for 81-100
                    ],
                    borderColor: [
                        'rgba(239, 68, 68, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(16, 185, 129, 1)',
                    ],
                    borderWidth: 2,
                }
            ]
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y', // Horizontal bar chart
            plugins: {
                legend: {
                    display: false,
                },
                title: {
                    display: false,
                },
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: {
                            size: window.innerWidth <= 480 ? 10 : 12
                        }
                    }
                },
                y: {
                    ticks: {
                        font: {
                            size: window.innerWidth <= 480 ? 10 : 12
                        }
                    }
                }
            }
        };

        return (
            <div className="chart-container">
                <h3>ATS Score Distribution</h3>
                <div className="chart">
                    <Bar data={chartData} options={options} />
                </div>
            </div>
        );
    };

    const renderActionTypePie = () => {
        if (!analyticsData?.actionTypeCounts) return null;

        const { analyzer, builder, draft } = analyticsData.actionTypeCounts;
        const total = analyzer + builder + draft;
        
        if (total === 0) return null;

        const chartData = {
            labels: ['Analyses', 'Builds', 'Drafts'],
            datasets: [
                {
                    data: [analyzer, builder, draft],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',   // Blue for analyses
                        'rgba(16, 185, 129, 0.8)',   // Green for builds
                        'rgba(245, 158, 11, 0.8)',   // Orange for drafts
                    ],
                    borderColor: [
                        'rgba(59, 130, 246, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)',
                    ],
                    borderWidth: 2,
                }
            ]
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        padding: 10,
                        font: {
                            size: window.innerWidth <= 480 ? 10 : 12
                        }
                    }
                },
                title: {
                    display: false,
                },
            }
        };

        return (
            <div className="chart-container">
                <h3>Action Type Distribution</h3>
                <div className="chart">
                    <Pie data={chartData} options={options} />
                </div>
            </div>
        );
    };

    const renderPerformanceMetrics = () => {
        if (!analyticsData?.stats) return null;

        const { total_analyzer, total_builder, avg_score, total_actions } = analyticsData.stats;

        return (
            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-icon">📊</div>
                    <div className="metric-value">{total_actions}</div>
                    <div className="metric-label">Total Activities</div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon">🔍</div>
                    <div className="metric-value">{total_analyzer}</div>
                    <div className="metric-label">Resume Analyses</div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon">📝</div>
                    <div className="metric-value">{total_builder}</div>
                    <div className="metric-label">Resumes Built</div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon">⭐</div>
                    <div className="metric-value">{avg_score}%</div>
                    <div className="metric-label">Average ATS Score</div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="analytics-container">
                <div className="loading">Loading analytics...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="analytics-container">
                <div className="error-message">
                    <p>{error}</p>
                    <button onClick={fetchAnalyticsData}>Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="analytics-container">
            <div className="analytics-header">
                <h1>Analytics Dashboard</h1>
                <p>Track your resume building performance and insights</p>
                {userData && (
                    <div className="user-welcome">
                        Welcome back, <strong>{userData.username}</strong>! 
                        Here's your performance overview.
                    </div>
                )}
            </div>

            {/* Time Range Selector */}
            <div className="time-selector">
                <button 
                    className={timeRange === 'week' ? 'active' : ''} 
                    onClick={() => setTimeRange('week')}
                >
                    Week
                </button>
                <button 
                    className={timeRange === 'month' ? 'active' : ''} 
                    onClick={() => setTimeRange('month')}
                >
                    Month
                </button>
                <button 
                    className={timeRange === 'year' ? 'active' : ''} 
                    onClick={() => setTimeRange('year')}
                >
                    Year
                </button>
            </div>

            {/* Performance Metrics */}
            {renderPerformanceMetrics()}

            {/* Charts Grid */}
            <div className="charts-grid">
                {renderActivityChart()}
                {renderActionTypePie()}
                {renderScoreDistribution()}
            </div>

            {/* Insights Section */}
            {analyticsData && (
                <div className="insights-section">
                    <h2>Key Insights</h2>
                    <div className="insights-grid">
                        <div className="insight-card">
                            <h4>📈 Activity Trend</h4>
                            <p>
                                {analyticsData.totalEntries > 0 
                                    ? `You've been active with ${analyticsData.totalEntries} total actions. Keep up the momentum!`
                                    : "Start building your resume to see your analytics here!"
                                }
                            </p>
                        </div>
                        <div className="insight-card">
                            <h4>🎯 Score Analysis</h4>
                            <p>
                                {analyticsData.stats.avg_score > 0
                                    ? `Your average ATS score is ${analyticsData.stats.avg_score}%. Focus on improving skills to boost this score.`
                                    : "Complete your first resume analysis to get your ATS score!"
                                }
                            </p>
                        </div>
                        <div className="insight-card">
                            <h4>🚀 Recommendations</h4>
                            <p>
                                {analyticsData.actionTypeCounts.analyzer > analyticsData.actionTypeCounts.builder
                                    ? "You're analyzing more than building. Try building some resumes to practice your skills!"
                                    : "Great job building resumes! Consider analyzing them to improve your ATS scores."
                                }
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Analytics;
