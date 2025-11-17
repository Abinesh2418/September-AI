import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const { user, logout, isManager, isHR, isEmployee } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getMenuItems = () => {
    const commonItems = [
      {
        path: '/chat',
        icon: '💬',
        label: 'AI Chat',
        description: 'Enhanced Conversations'
      }
    ];

    if (isManager()) {
      return [
        {
          path: '/dashboard',
          icon: '📊',
          label: 'Team Dashboard',
          description: 'Team Overview'
        },
        {
          path: '/manager-dashboard',
          icon: '📈',
          label: 'Progress Tracking',
          description: 'Monitor Team Tasks'
        },
        ...commonItems
      ];
    }

    if (isHR()) {
      return [
        {
          path: '/dashboard',
          icon: '📊',
          label: 'HR Dashboard',
          description: 'HR Overview'
        },
        {
          path: '/hr-panel',
          icon: '👥',
          label: 'Task Assignment',
          description: 'Assign Role-Based Tasks'
        },
        {
          path: '/manager-dashboard',
          icon: '📈',
          label: 'Employee Progress',
          description: 'View All Progress'
        },
        ...commonItems
      ];
    }

    if (isEmployee()) {
      return [
        {
          path: '/dashboard',
          icon: '📊',
          label: 'My Dashboard',
          description: 'Personal Overview'
        },
        {
          path: '/my-tasks',
          icon: '✅',
          label: 'My Tasks',
          description: 'Personal Task Board'
        },
        ...commonItems
      ];
    }

    return commonItems;
  };

  const menuItems = getMenuItems();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <span className="brand-icon">🤖</span>
          <div className="brand-text">
            <div className="brand-title">IT Workflow</div>
            <div className="brand-subtitle">Assistant</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-list">
          {menuItems.map((item) => (
            <li key={item.path} className="nav-item">
              <button
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className="nav-icon">{item.icon}</span>
                <div className="nav-text">
                  <div className="nav-label">{item.label}</div>
                  <div className="nav-description">{item.description}</div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">
            <span>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
          </div>
          <div className="user-details">
            <div className="user-name">{user?.name || 'User'}</div>
            <div className="user-email">{user?.email || 'user@example.com'}</div>
            <div className="user-role">
              {user?.role === 'manager' ? '👨‍💼 Manager' : 
               user?.role === 'hr' ? '👥 HR' : 
               `👤 ${user?.role || 'Employee'}`}
            </div>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Logout">
          <span>🚪</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;