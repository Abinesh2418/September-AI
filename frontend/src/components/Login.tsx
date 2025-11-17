import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const demoAccounts = [
  {
    email: 'manager@company.com',
    password: 'manager123',
    role: 'Manager',
    description: 'View team progress and monitor employee tasks'
  },
  {
    email: 'hr@company.com',
    password: 'hr123',
    role: 'HR',
    description: 'Assign role-based tasks and manage onboarding'
  },
  {
    email: 'john.doe@company.com',
    password: 'employee123',
    role: 'Developer',
    description: 'Complete assigned development tasks'
  },
  {
    email: 'jane.smith@company.com',
    password: 'employee123',
    role: 'Designer',
    description: 'Complete assigned design tasks'
  },
  {
    email: 'mike.wilson@company.com',
    password: 'employee123',
    role: 'Analyst',
    description: 'Complete assigned analysis tasks'
  },
  {
    email: 'abinesh.kumar@company.com',
    password: 'abinesh123',
    role: 'Developer',
    description: 'Complete assigned development tasks'
  }
];

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const quickLogin = (email: string, password: string) => {
    setFormData({ email, password });
    handleLoginWithCredentials(email, password);
  };

  const handleLoginWithCredentials = async (email: string, password: string) => {
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLoginWithCredentials(formData.email, formData.password);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Welcome Back</h1>
        <p>Sign in to your IT Workflow Assistant account</p>
        
        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        {/* Demo Account Section */}
        <div className="demo-accounts">
          <h3>🚀 Quick Demo Login</h3>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
            Choose a role to experience the system:
          </p>
          <div className="demo-grid">
            {demoAccounts.map((account, index) => (
              <button
                key={index}
                type="button"
                className="demo-account-btn"
                onClick={() => quickLogin(account.email, account.password)}
                disabled={loading}
              >
                <div className="demo-account-role">👤 {account.role}</div>
                <div className="demo-account-email">{account.email}</div>
                <div className="demo-account-desc">{account.description}</div>
              </button>
            ))}
          </div>
          <div className="divider">
            <span>or login manually</span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="you@company.com"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
            />
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <div className="auth-footer">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;