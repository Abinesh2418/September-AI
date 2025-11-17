import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ticketsAPI, accessRequestsAPI, onboardingAPI } from '../services/api';

interface Ticket {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
}

interface AccessRequest {
  id: number;
  system: string;
  accessType: string;
  reason: string;
  status: string;
  created_at: string;
}

interface OnboardingRequest {
  id: number;
  employeeName: string;
  department: string;
  role: string;
  status: string;
  created_at: string;
}

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [onboardingRequests, setOnboardingRequests] = useState<OnboardingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form visibility states
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [showAccessForm, setShowAccessForm] = useState(false);
  const [showOnboardingForm, setShowOnboardingForm] = useState(false);
  
  // Form data states
  const [ticketForm, setTicketForm] = useState({ title: '', description: '', priority: 'medium' });
  const [accessForm, setAccessForm] = useState({ system: '', accessType: 'read', reason: '', urgency: 'medium' });
  const [onboardingForm, setOnboardingForm] = useState({ 
    employeeName: '', 
    department: '', 
    role: '', 
    startDate: new Date().toISOString().split('T')[0],
    manager: ''
  });

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ticketsResponse, accessResponse, onboardingResponse] = await Promise.all([
        ticketsAPI.getAll(),
        accessRequestsAPI.getAll(),
        onboardingAPI.getAll(),
      ]);

      console.log('API responses:', { ticketsResponse, accessResponse, onboardingResponse });
      
      // Handle the actual response format from backend
      setTickets(ticketsResponse.tickets || []);
      setAccessRequests(accessResponse.requests || []);  // Backend returns 'requests'
      setOnboardingRequests(onboardingResponse.checklists || []);  // Backend returns 'checklists'
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.title || !ticketForm.description) return;
    
    try {
      const result = await ticketsAPI.create({
        title: ticketForm.title,
        description: ticketForm.description,
        priority: ticketForm.priority,
        category: 'General'
      });
      console.log('Ticket created:', result);
      setTicketForm({ title: '', description: '', priority: 'medium' });
      setShowTicketForm(false);
      await loadData(); // Ensure data is reloaded
    } catch (err) {
      console.error('Error creating ticket:', err);
    }
  };

  const handleCreateAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessForm.system || !accessForm.reason) return;
    
    try {
      const result = await accessRequestsAPI.create({
        system: accessForm.system,
        accessType: accessForm.accessType,
        reason: accessForm.reason,
        urgency: accessForm.urgency
      });
      console.log('Access request created:', result);
      setAccessForm({ system: '', accessType: 'read', reason: '', urgency: 'medium' });
      setShowAccessForm(false);
      await loadData(); // Ensure data is reloaded
    } catch (err) {
      console.error('Error creating access request:', err);
    }
  };

  const handleCreateOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardingForm.employeeName || !onboardingForm.department) return;
    
    try {
      const result = await onboardingAPI.create({
        employeeName: onboardingForm.employeeName,
        department: onboardingForm.department,
        role: onboardingForm.role,
        startDate: onboardingForm.startDate,
        manager: onboardingForm.manager
      });
      console.log('Onboarding created:', result);
      setOnboardingForm({ 
        employeeName: '', 
        department: '', 
        role: '', 
        startDate: new Date().toISOString().split('T')[0],
        manager: ''
      });
      setShowOnboardingForm(false);
      await loadData(); // Ensure data is reloaded
    } catch (err) {
      console.error('Error creating onboarding request:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getBadgeClass = (status: string, type: 'status' | 'priority' = 'status') => {
    if (type === 'priority') {
      switch (status?.toLowerCase()) {
        case 'high': return 'badge badge-high';
        case 'medium': return 'badge badge-medium';
        case 'low': return 'badge badge-low';
        default: return 'badge badge-low';
      }
    }
    
    switch (status?.toLowerCase()) {
      case 'open': return 'badge badge-open';
      case 'pending': return 'badge badge-pending';
      case 'approved': return 'badge badge-approved';
      case 'closed': return 'badge badge-closed';
      default: return 'badge badge-open';
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white', 
          padding: '20px', 
          borderRadius: '12px', 
          marginBottom: '20px', 
          textAlign: 'center' 
        }}>
          <h2 style={{ margin: '0 0 10px 0', color: 'white' }}>🚀 Try Enhanced Conversational AI Chat!</h2>
          <p style={{ margin: '0 0 15px 0', opacity: 0.9 }}>
            Experience natural conversations with intent detection, conversation history, and smart suggestions
          </p>
          <button 
            className="btn btn-sm" 
            style={{ background: 'white', color: '#667eea', border: 'none' }}
            onClick={() => navigate('/chat')}
          >
            Open Enhanced Chat →
          </button>
        </div>

        <div className="tabs">
          <button className={`tab ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
            AI Chat
          </button>
          <button className={`tab ${activeTab === 'tickets' ? 'active' : ''}`} onClick={() => setActiveTab('tickets')}>
            Tickets
          </button>
          <button className={`tab ${activeTab === 'access' ? 'active' : ''}`} onClick={() => setActiveTab('access')}>
            Access Requests
          </button>
          <button className={`tab ${activeTab === 'onboarding' ? 'active' : ''}`} onClick={() => setActiveTab('onboarding')}>
            Onboarding
          </button>
        </div>

        {activeTab === 'chat' && (
          <div className="card">
            <h3>🤖 AI Assistant Overview</h3>
            <p>Your intelligent IT assistant is ready to help with:</p>
            <div className="grid">
              <div className="stat-card">
                <h3>Ticket Support</h3>
                <div className="stat-value">{tickets.length}</div>
                <p>Active tickets</p>
              </div>
              <div className="stat-card">
                <h3>Access Requests</h3>
                <div className="stat-value">{accessRequests.length}</div>
                <p>Pending requests</p>
              </div>
              <div className="stat-card">
                <h3>Onboarding</h3>
                <div className="stat-value">{onboardingRequests.length}</div>
                <p>In progress</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tickets' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>🎫 Support Tickets</h3>
              <button 
                className="btn btn-primary" 
                onClick={() => setShowTicketForm(!showTicketForm)}
              >
                {showTicketForm ? 'Cancel' : '+ Create Ticket'}
              </button>
            </div>

            {showTicketForm && (
              <form onSubmit={handleCreateTicket} className="create-form">
                <div className="form-group">
                  <label>Ticket Title *</label>
                  <input
                    type="text"
                    value={ticketForm.title}
                    onChange={(e) => setTicketForm({...ticketForm, title: e.target.value})}
                    placeholder="Enter ticket title"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    value={ticketForm.description}
                    onChange={(e) => setTicketForm({...ticketForm, description: e.target.value})}
                    placeholder="Describe the issue"
                    rows={3}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm({...ticketForm, priority: e.target.value})}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">Create Ticket</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowTicketForm(false)}>Cancel</button>
                </div>
              </form>
            )}
            {tickets.length === 0 ? (
              <div className="empty-state">
                <p>No support tickets yet. Click "Create Ticket" to add one!</p>
              </div>
            ) : (
              tickets.map(ticket => (
                <div key={ticket.id} className="list-item">
                  <div className="list-item-header">
                    <div>
                      <div className="list-item-title">{ticket.title}</div>
                      <div className="list-item-meta">Created: {formatDate(ticket.created_at)}</div>
                    </div>
                    <div>
                      <span className={getBadgeClass(ticket.status)}>{ticket.status}</span>
                      <span className={getBadgeClass(ticket.priority, 'priority')} style={{ marginLeft: '8px' }}>
                        {ticket.priority}
                      </span>
                    </div>
                  </div>
                  <p>{ticket.description}</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'access' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>🔐 Access Requests</h3>
              <button 
                className="btn btn-primary" 
                onClick={() => setShowAccessForm(!showAccessForm)}
              >
                {showAccessForm ? 'Cancel' : '+ Request Access'}
              </button>
            </div>

            {showAccessForm && (
              <form onSubmit={handleCreateAccess} className="create-form">
                <div className="form-group">
                  <label>System Name *</label>
                  <input
                    type="text"
                    value={accessForm.system}
                    onChange={(e) => setAccessForm({...accessForm, system: e.target.value})}
                    placeholder="e.g., Jira, GitHub, Figma"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Access Type</label>
                  <select
                    value={accessForm.accessType}
                    onChange={(e) => setAccessForm({...accessForm, accessType: e.target.value})}
                  >
                    <option value="read">Read</option>
                    <option value="write">Write</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Reason *</label>
                  <textarea
                    value={accessForm.reason}
                    onChange={(e) => setAccessForm({...accessForm, reason: e.target.value})}
                    placeholder="Why do you need this access?"
                    rows={3}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Urgency</label>
                  <select
                    value={accessForm.urgency}
                    onChange={(e) => setAccessForm({...accessForm, urgency: e.target.value})}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">Submit Request</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAccessForm(false)}>Cancel</button>
                </div>
              </form>
            )}
            {accessRequests.length === 0 ? (
              <div className="empty-state">
                <p>No access requests yet. Click "Create Access Request" to add one!</p>
              </div>
            ) : (
              accessRequests.map(request => (
                <div key={request.id} className="list-item">
                  <div className="list-item-header">
                    <div>
                      <div className="list-item-title">{request.system} - {request.accessType}</div>
                      <div className="list-item-meta">Requested: {formatDate(request.created_at)}</div>
                    </div>
                    <span className={getBadgeClass(request.status)}>{request.status}</span>
                  </div>
                  <p>{request.reason}</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'onboarding' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>👋 Employee Onboarding</h3>
              <button 
                className="btn btn-primary" 
                onClick={() => setShowOnboardingForm(!showOnboardingForm)}
              >
                {showOnboardingForm ? 'Cancel' : '+ Create Onboarding'}
              </button>
            </div>

            {showOnboardingForm && (
              <form onSubmit={handleCreateOnboarding} className="create-form">
                <div className="form-group">
                  <label>Employee Name *</label>
                  <input
                    type="text"
                    value={onboardingForm.employeeName}
                    onChange={(e) => setOnboardingForm({...onboardingForm, employeeName: e.target.value})}
                    placeholder="Enter employee name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Department *</label>
                  <input
                    type="text"
                    value={onboardingForm.department}
                    onChange={(e) => setOnboardingForm({...onboardingForm, department: e.target.value})}
                    placeholder="e.g., Engineering, Marketing, Sales"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Role/Position *</label>
                  <input
                    type="text"
                    value={onboardingForm.role}
                    onChange={(e) => setOnboardingForm({...onboardingForm, role: e.target.value})}
                    placeholder="e.g., Software Engineer, Product Manager"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={onboardingForm.startDate}
                    onChange={(e) => setOnboardingForm({...onboardingForm, startDate: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Manager Name</label>
                  <input
                    type="text"
                    value={onboardingForm.manager}
                    onChange={(e) => setOnboardingForm({...onboardingForm, manager: e.target.value})}
                    placeholder="Enter manager's name"
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">Create Onboarding</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowOnboardingForm(false)}>Cancel</button>
                </div>
              </form>
            )}
            {onboardingRequests.length === 0 ? (
              <div className="empty-state">
                <p>No onboarding requests yet. Click "Create Onboarding" to add one!</p>
              </div>
            ) : (
              onboardingRequests.map(request => (
                <div key={request.id} className="list-item">
                  <div className="list-item-header">
                    <div>
                      <div className="list-item-title">{request.employeeName}</div>
                      <div className="list-item-meta">
                        {request.department} • {request.role} • {formatDate(request.created_at)}
                      </div>
                    </div>
                    <span className={getBadgeClass(request.status)}>{request.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;