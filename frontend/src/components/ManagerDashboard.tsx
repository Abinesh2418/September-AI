import React, { useState, useEffect } from 'react';
import { taskAPI } from '../services/api';
import { ManagerDashboardData, Employee } from '../types/taskTypes';

const ManagerDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<ManagerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await taskAPI.getManagerDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return '#28a745';
    if (percentage >= 60) return '#ffc107';
    if (percentage >= 40) return '#fd7e14';
    return '#dc3545';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'created': return '📝';
      case 'started': return '🚀';
      case 'completed': return '✅';
      case 'updated': return '🔄';
      case 'commented': return '💬';
      default: return '📋';
    }
  };

  const getEmployeeProgress = (employeeId: string) => {
    return dashboardData?.taskProgress.find(p => p.employeeId === employeeId);
  };

  if (loading) {
    return <div className="dashboard"><div className="container">Loading dashboard...</div></div>;
  }

  if (!dashboardData) {
    return <div className="dashboard"><div className="container">Failed to load dashboard data</div></div>;
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="manager-dashboard-header">
          <div className="header-content">
            <h1>📈 Manager Dashboard</h1>
            <p>Monitor your team's progress and onboarding status</p>
          </div>
          
          <div className="timeframe-selector">
            <label>View:</label>
            <div className="timeframe-buttons">
              {['today', 'week', 'month'].map((timeframe) => (
                <button
                  key={timeframe}
                  className={`timeframe-btn ${selectedTimeframe === timeframe ? 'active' : ''}`}
                  onClick={() => setSelectedTimeframe(timeframe as any)}
                >
                  {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="team-stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-number">{dashboardData.teamStats.activeEmployees}</div>
              <div className="stat-label">Active Employees</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <div className="stat-number">{dashboardData.teamStats.totalTasks}</div>
              <div className="stat-label">Total Tasks</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-number">{dashboardData.teamStats.completedTasks}</div>
              <div className="stat-label">Completed Tasks</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-number">{dashboardData.teamStats.avgCompletionRate}%</div>
              <div className="stat-label">Avg Completion</div>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="team-progress-section">
            <div className="section-header">
              <h2>👥 Team Progress</h2>
              <button className="btn btn-sm btn-outline" onClick={loadDashboardData}>
                🔄 Refresh
              </button>
            </div>
            
            <div className="employee-progress-list">
              {dashboardData.employees.map((employee) => {
                const progress = getEmployeeProgress(employee.id);
                if (!progress) return null;

                return (
                  <div 
                    key={employee.id}
                    className={`employee-progress-card ${selectedEmployee?.id === employee.id ? 'selected' : ''}`}
                    onClick={() => setSelectedEmployee(employee)}
                  >
                    <div className="employee-header">
                      <div className="employee-info">
                        <div className="employee-avatar">
                          {(employee.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="employee-details">
                          <div className="employee-name">{employee.name || 'Unknown Employee'}</div>
                          <div className="employee-role">{(employee.role || 'employee').replace(/[_-]/g, ' ')}</div>
                          <div className="employee-team">{employee.department || 'No Department'}</div>
                        </div>
                      </div>
                      
                      <div className="progress-summary">
                        <div 
                          className="progress-circle-small"
                          style={{ 
                            background: `conic-gradient(${getCompletionColor(progress.completionPercentage)} ${progress.completionPercentage * 3.6}deg, #e9ecef 0deg)` 
                          }}
                        >
                          <span className="progress-text">{progress.completionPercentage}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="progress-details">
                      <div className="progress-stats">
                        <div className="stat">
                          <span className="stat-value">{progress.completedTasks}</span>
                          <span className="stat-label">Completed</span>
                        </div>
                        <div className="stat">
                          <span className="stat-value">{progress.inProgressTasks}</span>
                          <span className="stat-label">In Progress</span>
                        </div>
                        <div className="stat">
                          <span className="stat-value">{progress.pendingTasks}</span>
                          <span className="stat-label">Pending</span>
                        </div>
                        <div className="stat">
                          <span className="stat-value">{progress.tasksCompletedToday}</span>
                          <span className="stat-label">Today</span>
                        </div>
                      </div>
                      
                      {progress.lastActivity && (
                        <div className="last-activity">
                          Last activity: {formatTime(progress.lastActivity)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="activity-feed-section">
            <div className="section-header">
              <h2>🔔 Recent Activity</h2>
            </div>
            
            <div className="activity-feed">
              {dashboardData.recentActivity.slice(0, 10).map((activity) => {
                const employee = dashboardData.employees.find(emp => emp.id === activity.employeeId);
                return (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">
                      {getActivityIcon(activity.action)}
                    </div>
                    <div className="activity-content">
                      <div className="activity-text">
                        <strong>{employee?.name || 'Unknown'}</strong> {activity.details}
                      </div>
                      <div className="activity-time">
                        {formatTime(activity.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {dashboardData.recentActivity.length === 0 && (
                <div className="empty-activity">
                  <span className="empty-icon">📭</span>
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedEmployee && (
          <div className="employee-detail-section">
            <div className="section-header">
              <h2>👤 {selectedEmployee.name} - Detailed View</h2>
              <button 
                className="btn btn-sm btn-secondary"
                onClick={() => setSelectedEmployee(null)}
              >
                ✕ Close
              </button>
            </div>
            
            <div className="employee-detail-content">
              <div className="employee-info-card">
                <div className="info-header">
                  <div className="employee-avatar-large">
                    {(selectedEmployee.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="employee-meta">
                    <h3>{selectedEmployee.name || 'Unknown Employee'}</h3>
                    <div className="meta-row">
                      <span className="meta-label">Role:</span>
                      <span className="meta-value">{(selectedEmployee.role || 'employee').replace(/[_-]/g, ' ')}</span>
                    </div>
                    <div className="meta-row">
                      <span className="meta-label">Department:</span>
                      <span className="meta-value">{selectedEmployee.department || 'No Department'}</span>
                    </div>
                    <div className="meta-row">
                      <span className="meta-label">Join Date:</span>
                      <span className="meta-value">{formatDate(selectedEmployee.joinDate || new Date().toISOString())}</span>
                    </div>
                  </div>
                </div>

                {(() => {
                  const progress = getEmployeeProgress(selectedEmployee.id);
                  return progress ? (
                    <div className="progress-overview">
                      <div className="progress-header">
                        <h4>Task Progress Overview</h4>
                      </div>
                      <div className="progress-grid">
                        <div className="progress-item">
                          <div className="progress-number">{progress.totalTasks}</div>
                          <div className="progress-label">Total Tasks</div>
                        </div>
                        <div className="progress-item completed">
                          <div className="progress-number">{progress.completedTasks}</div>
                          <div className="progress-label">Completed</div>
                        </div>
                        <div className="progress-item in-progress">
                          <div className="progress-number">{progress.inProgressTasks}</div>
                          <div className="progress-label">In Progress</div>
                        </div>
                        <div className="progress-item pending">
                          <div className="progress-number">{progress.pendingTasks}</div>
                          <div className="progress-label">Pending</div>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>

              <div className="employee-activity-card">
                <h4>Recent Activity</h4>
                <div className="employee-activities">
                  {dashboardData.recentActivity
                    .filter(activity => activity.employeeId === selectedEmployee.id)
                    .slice(0, 5)
                    .map(activity => (
                      <div key={activity.id} className="activity-item-small">
                        <span className="activity-icon-small">
                          {getActivityIcon(activity.action)}
                        </span>
                        <div className="activity-content-small">
                          <div className="activity-text-small">{activity.details}</div>
                          <div className="activity-time-small">{formatTime(activity.timestamp)}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerDashboard;