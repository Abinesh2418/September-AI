import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import HRPanel from './HRPanel';
import ManagerDashboard from './ManagerDashboard';
import EmployeeTasks from './EmployeeTasks';

const RoleDashboard: React.FC = () => {
  const { user, isManager, isHR, isEmployee } = useAuth();

  if (!user) {
    return (
      <div className="dashboard-container">
        <div className="loading-message">Loading user data...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>
          Welcome back, {user.name}! 
          {isManager() && ' 👨‍💼'}
          {isHR() && ' 👥'}
          {isEmployee() && ' 👤'}
        </h1>
        <p className="dashboard-subtitle">
          {isManager() && 'Monitor your team progress and performance'}
          {isHR() && 'Manage employee onboarding and task assignments'}
          {isEmployee() && 'View and complete your assigned tasks'}
        </p>
      </div>

      <div className="dashboard-content">
        {isManager() && (
          <div className="manager-dashboard">
            <ManagerDashboard />
          </div>
        )}

        {isHR() && (
          <div className="hr-dashboard">
            <div className="dashboard-section">
              <h2>Employee Management</h2>
              <p>Assign role-based tasks to new employees and track their onboarding progress.</p>
            </div>
            <HRPanel />
          </div>
        )}

        {isEmployee() && (
          <div className="employee-dashboard">
            <div className="dashboard-section">
              <h2>Your Tasks</h2>
              <p>Complete your assigned tasks to progress through your onboarding journey.</p>
            </div>
            <EmployeeTasks />
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleDashboard;