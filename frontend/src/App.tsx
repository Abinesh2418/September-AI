import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Signup from './components/Signup';
import RoleDashboard from './components/RoleDashboard';
import Chat from './components/Chat';
import Layout from './components/Layout';
import EmployeeTasks from './components/EmployeeTasks';
import HRPanel from './components/HRPanel';
import ManagerDashboard from './components/ManagerDashboard';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }
  
  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return !user ? <>{children}</> : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/signup" 
              element={
                <PublicRoute>
                  <Signup />
                </PublicRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <RoleDashboard />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-tasks" 
              element={
                <ProtectedRoute allowedRoles={['developer', 'designer', 'analyst', 'marketing_specialist']}>
                  <Layout>
                    <EmployeeTasks />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/chat" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Chat />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hr-panel" 
              element={
                <ProtectedRoute allowedRoles={['hr']}>
                  <Layout>
                    <HRPanel />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/manager-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['manager', 'hr']}>
                  <Layout>
                    <ManagerDashboard />
                  </Layout>
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;