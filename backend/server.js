/*
 Enhanced IT Workflow Chatbot with Authentication and Database
 - Auth routes: /api/auth/signup, /api/auth/login, /api/auth/logout, /api/auth/me
 - Ticket routes: /api/tickets (create, list)
 - Access request routes: /api/access-requests (create, list)
 - Onboarding routes: /api/onboarding (create, list)
 - AI chat routes: /api/chat/ticket, /api/chat/access, /api/chat/onboarding
 - Static files served from /static
*/

// Load environment variables early
try { require('dotenv').config({ path: '../.env' }); } catch (_) {}

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const crypto = require('crypto');

const AuthService = require('./auth/authService');
const authService = new AuthService();
const ticketService = require('./tickets/ticketService');
const accessRequestService = require('./access/accessRequestService');
const onboardingService = require('./onboarding/onboardingService');
const conversationService = require('./chat/conversationService');
const intentDetector = require('./chat/intentDetector');
const aiService = require('./chat/aiService');
const { PromptManager } = require('./chat/promptManager');
const { SimpleCache } = require('./utils/simpleCache');
const TaskManagementService = require('./tasks/taskManagementService');
const employeeProgressService = require('./tasks/employeeProgressService');

const app = express();

// CORS configuration for React development server
app.use(cors({ 
  origin: ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:3000', 'http://127.0.0.1:5000'], 
  credentials: true 
}));
app.use(bodyParser.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-prod',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(express.static('static'));

const port = process.env.PORT || 5000;
const cache = new SimpleCache({ maxEntries: 200 });
const prompts = new PromptManager();
const taskManagement = new TaskManagementService();

// Auth middleware
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

function makeCacheKey(prompt, metadata) {
  const h = crypto.createHash('sha256');
  h.update(prompt + JSON.stringify(metadata || {}));
  return h.digest('hex');
}


async function callModel(prompt, opts = {}) {
  const cacheKey = makeCacheKey(prompt, opts);
  const cached = cache.get(cacheKey);
  if (cached) return { ...cached, _cached: true };

  try {
    const result = await aiService.generateResponse(prompt, opts);
    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('AI service error:', error);
    const fallbackResult = {
      text: opts.fallback || 'Sorry, I encountered an error. Please try again.',
      usage: null
    };
    cache.set(cacheKey, fallbackResult);
    return fallbackResult;
  }
}

// ============ AUTH ROUTES ============
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, fullName, role } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    // For demo purposes, signup is disabled since we have predefined users
    return res.status(400).json({ 
      error: 'Signup disabled. Please use one of the predefined demo accounts.' 
    });
  } catch (err) {
    console.error('signup error', err);
    res.status(400).json({ error: 'User already exists or invalid input' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const userData = await authService.authenticate(email, password);
    if (!userData) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    req.session.userId = userData.id;
    
    // Return user data in the expected format
    const user = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      department: userData.department,
      permissions: userData.permissions
    };
    
    res.json({ success: true, user });
  } catch (err) {
    console.error('login error', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = authService.getUserById(req.session.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  // Return user data in the expected format
  const userResponse = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    department: user.department,
    permissions: user.permissions
  };
  
  res.json({ user: userResponse });
});

// ============ TICKET ROUTES ============
app.post('/api/tickets', requireAuth, (req, res) => {
  const { title, description, priority, category, assignee, tags } = req.body;
  console.log('📋 Ticket creation request:', { title, description, priority, category, userId: req.session.userId });
  
  if (!title) return res.status(400).json({ error: 'Title required' });
  try {
    const ticketId = ticketService.createTicket(req.session.userId, { title, description, priority, category, assignee, tags });
    console.log('✅ Ticket created successfully with ID:', ticketId);
    res.json({ success: true, ticketId });
  } catch (err) {
    console.error('❌ Create ticket error:', err);
    res.status(500).json({ error: String(err) });
  }
});

app.get('/api/tickets', requireAuth, (req, res) => {
  try {
    const user = authService.getUserById(req.session.userId);
    console.log('📋 Fetching tickets for user:', { userId: req.session.userId, userRole: user.role });
    
    let tickets;
    if (user.role === 'admin' || user.role === 'it_staff') {
      const startDate = req.query.startDate;
      tickets = ticketService.getAllTickets({ status: req.query.status, startDate });
    } else {
      tickets = ticketService.getTicketsByUser(req.session.userId);
    }
    
    console.log('✅ Retrieved tickets:', tickets.length, 'tickets found');
    res.json({ tickets });
  } catch (err) {
    console.error('❌ Get tickets error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// ============ ACCESS REQUEST ROUTES ============
app.post('/api/access-requests', requireAuth, (req, res) => {
  const { resourceName, accessType, justification } = req.body;
  if (!resourceName) return res.status(400).json({ error: 'Resource name required' });
  try {
    const requestId = accessRequestService.createAccessRequest(req.session.userId, resourceName, accessType, justification);
    res.json({ success: true, requestId });
  } catch (err) {
    console.error('create access request error', err);
    res.status(500).json({ error: String(err) });
  }
});

app.get('/api/access-requests', requireAuth, (req, res) => {
  try {
    const user = authService.getUserById(req.session.userId);
    let requests;
    if (user.role === 'admin' || user.role === 'it_staff') {
      requests = accessRequestService.getAllAccessRequests({ status: req.query.status });
    } else {
      requests = accessRequestService.getAccessRequestsByUser(req.session.userId);
    }
    res.json({ requests });
  } catch (err) {
    console.error('get access requests error', err);
    res.status(500).json({ error: String(err) });
  }
});

// ============ ONBOARDING ROUTES ============
app.post('/api/onboarding', requireAuth, (req, res) => {
  const { employeeName, role, checklistItems, systemsToProvision, welcomeMessage } = req.body;
  if (!employeeName) return res.status(400).json({ error: 'Employee name required' });
  try {
    const checklistId = onboardingService.createChecklist(
      req.session.userId,
      employeeName,
      role,
      checklistItems,
      systemsToProvision,
      welcomeMessage
    );
    res.json({ success: true, checklistId });
  } catch (err) {
    console.error('create onboarding error', err);
    res.status(500).json({ error: String(err) });
  }
});

app.get('/api/onboarding', requireAuth, (req, res) => {
  try {
    const user = authService.getUserById(req.session.userId);
    let checklists;
    if (user.role === 'admin' || user.role === 'hr') {
      checklists = onboardingService.getAllChecklists();
    } else {
      checklists = onboardingService.getChecklistsByUser(req.session.userId);
    }
    res.json({ checklists });
  } catch (err) {
    console.error('get onboarding error', err);
    res.status(500).json({ error: String(err) });
  }
});

// ============ AI CHAT ROUTES (Use Cases) ============

// Use case 1: Employee asks for access → Bot creates access request
app.post('/api/chat/access', requireAuth, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });
  
  try {
    const prompt = prompts.render({ scenario: 'access', message });
    const aiResponse = await callModel(prompt, { model: 'gpt-4o-mini', temperature: 0.15 });
    
    const text = aiResponse.text;
    const resourceMatch = text.match(/resource[:\s]+([A-Za-z0-9\s]+)/i) || text.match(/(Figma|Jira|GitHub|Slack|AWS|Azure)/i);
    const resourceName = resourceMatch ? resourceMatch[1].trim() : message.split(' ').slice(-1)[0];
    
    const requestId = accessRequestService.createAccessRequest(req.session.userId, resourceName, 'read', message);
    
    res.json({
      aiResponse: text,
      action: 'access_request_created',
      requestId,
      resourceName
    });
  } catch (err) {
    console.error('chat access error', err);
    res.status(500).json({ error: String(err) });
  }
});

// Use case 2: HR asks for onboarding checklist → Bot retrieves and displays
app.post('/api/chat/onboarding', requireAuth, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });
  
  try {
    const prompt = prompts.render({ scenario: 'onboarding', message });
    const aiResponse = await callModel(prompt, { model: 'gpt-4o-mini', temperature: 0.15 });
    
    const checklists = onboardingService.getChecklistsByUser(req.session.userId);
    
    res.json({
      aiResponse: aiResponse.text,
      action: 'onboarding_info_retrieved',
      existingChecklists: checklists
    });
  } catch (err) {
    console.error('chat onboarding error', err);
    res.status(500).json({ error: String(err) });
  }
});

// Use case 3: IT staff asks for open tickets → Bot fetches data
app.post('/api/chat/tickets', requireAuth, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });
  
  try {
    const user = authService.getUserById(req.session.userId);
    
    let startDate = null;
    if (message.toLowerCase().includes('this week')) {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
      monday.setHours(0, 0, 0, 0);
      startDate = monday.toISOString();
    }
    
    const tickets = ticketService.getAllTickets({ status: 'open', startDate });
    
    const prompt = `You are an IT support assistant. The user asked: "${message}"\n\nHere are the matching tickets:\n${JSON.stringify(tickets, null, 2)}\n\nProvide a brief summary.`;
    const aiResponse = await callModel(prompt, { model: 'gpt-4o-mini', temperature: 0.15 });
    
    res.json({
      aiResponse: aiResponse.text,
      action: 'tickets_retrieved',
      tickets
    });
  } catch (err) {
    console.error('chat tickets error', err);
    res.status(500).json({ error: String(err) });
  }
});

// Legacy chat endpoint (generic)
app.post('/api/chat', requireAuth, async (req, res) => {
  const { message, scenario } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message required' });

  const template = prompts.render({ scenario, message });
  try {
    const out = await callModel(template, { model: 'gpt-4o-mini', temperature: 0.15 });
    res.json({ input: message, output: out });
  } catch (err) {
    console.error('model error', err);
    res.status(500).json({ error: 'model failure', detail: String(err) });
  }
});

// ============ CONVERSATIONAL AI ENHANCEMENTS ============

// Enhanced chat with conversation history and intent detection
app.post('/api/chat/enhanced', requireAuth, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });
  
  try {
    const userId = req.session.userId;
    
    // 1. Save user message
    conversationService.saveMessage(userId, message, 'user');
    
    // 2. Detect intent
    const intent = intentDetector.detect(message);
    
    // 3. Get conversation context
    const context = conversationService.getRecentContext(userId, 5);
    
    // 4. Build enhanced prompt with context
    let enhancedPrompt = `Previous conversation:\n${context}\n\nUser: ${message}\n\nDetected intent: ${intent.intent} (confidence: ${intent.confidence.toFixed(2)})`;
    
    // 5. Route to appropriate handler based on intent
    let response;
    let action = null;
    
    if (intent.confidence > 0.4) {  // Lowered threshold for better detection
      switch (intent.intent) {
        case 'access_request':
          const resourceName = intent.entities.extracted || 'Unknown Resource';
          const requestId = accessRequestService.createAccessRequest(userId, resourceName, 'read', message);
          response = `I've created an access request for ${resourceName}. Request ID: ${requestId}. The IT team will review it shortly.`;
          action = { type: 'access_request_created', requestId, resourceName };
          break;
          
        case 'ticket_creation':
          const ticketTitle = intent.entities.extracted || message.substring(0, 50);
          const ticketId = ticketService.createTicket(userId, { 
            title: ticketTitle, 
            description: message,
            priority: 'medium'
          });
          response = `I've created a support ticket: "${ticketTitle}". Ticket ID: ${ticketId}. Our IT team will address this soon.`;
          action = { type: 'ticket_created', ticketId };
          break;
          
        case 'ticket_query':
          const tickets = ticketService.getAllTickets();
          const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'pending');
          const totalTickets = tickets.length;
          
          if (message.toLowerCase().includes('how many') || message.toLowerCase().includes('count')) {
            response = `📊 **Ticket Statistics:**\n• Total tickets: ${totalTickets}\n• Open tickets: ${openTickets.length}\n• Closed tickets: ${totalTickets - openTickets.length}`;
          } else if (openTickets.length === 0) {
            response = `✅ Great news! There are no open tickets currently. All ${totalTickets} tickets have been resolved.`;
          } else {
            response = `📋 **Found ${openTickets.length} open ticket(s):**\n\n${openTickets.slice(0, 5).map(t => 
              `🎫 **#${t.id}**: ${t.title}\n   Priority: ${t.priority} | Status: ${t.status}\n   Created: ${new Date(t.created_at).toLocaleDateString()}`
            ).join('\n\n')}${openTickets.length > 5 ? `\n\n... and ${openTickets.length - 5} more tickets` : ''}`;
          }
          action = { type: 'tickets_retrieved', count: openTickets.length, total: totalTickets };
          break;
          
        case 'access_request_query':
          const accessRequests = accessRequestService.getAllAccessRequests();
          const pendingRequests = accessRequests.filter(r => r.status === 'pending' || r.status === 'review');
          
          if (message.toLowerCase().includes('how many') || message.toLowerCase().includes('count')) {
            response = `📊 **Access Request Statistics:**\n• Total requests: ${accessRequests.length}\n• Pending: ${pendingRequests.length}\n• Approved: ${accessRequests.filter(r => r.status === 'approved').length}`;
          } else if (accessRequests.length === 0) {
            response = `🔐 No access requests found. Create one if you need access to a system or resource.`;
          } else {
            response = `🔑 **Found ${accessRequests.length} access request(s):**\n\n${accessRequests.slice(0, 4).map(r => 
              `🔐 **${r.system}** (${r.accessType} access)\n   Reason: ${r.reason}\n   Status: ${r.status || 'pending'}`
            ).join('\n\n')}${accessRequests.length > 4 ? `\n\n... and ${accessRequests.length - 4} more requests` : ''}`;
          }
          action = { type: 'access_requests_retrieved', count: accessRequests.length, pending: pendingRequests.length };
          break;
          
        case 'onboarding_query':
          const checklists = onboardingService.getAllChecklists();
          const pendingOnboarding = checklists.filter(c => c.status === 'pending' || c.status === 'in-progress');
          
          if (message.toLowerCase().includes('how many') || message.toLowerCase().includes('count')) {
            response = `📊 **Onboarding Statistics:**\n• Total requests: ${checklists.length}\n• Pending: ${pendingOnboarding.length}\n• Completed: ${checklists.length - pendingOnboarding.length}`;
          } else if (checklists.length === 0) {
            response = `👥 No onboarding requests found. Create one for new employees joining your team.`;
          } else {
            response = `👋 **Found ${checklists.length} onboarding request(s):**\n\n${checklists.slice(0, 3).map(c => 
              `👤 **${c.employee_name}** (${c.role})\n   Department: ${c.department}\n   Status: ${c.status || 'pending'}`
            ).join('\n\n')}${checklists.length > 3 ? `\n\n... and ${checklists.length - 3} more requests` : ''}`;
          }
          action = { type: 'onboarding_retrieved', count: checklists.length, pending: pendingOnboarding.length };
          break;
          
        case 'team_progress':
          // Check if user has permission to view team progress
          const user = await authService.getUserById(userId);
          if (!user || !authService.hasPermission(user, 'view_team_progress')) {
            response = `🚫 **Access Denied**: You don't have permission to view team progress. This feature is available to managers and supervisors only.`;
          } else {
            // Mock team progress data - in a real app, this would come from a database
            const teamData = [
              { name: 'John Doe', role: 'Developer', progress: 85, tasks: 12, completed: 10 },
              { name: 'Jane Smith', role: 'Designer', progress: 92, tasks: 8, completed: 7 },
              { name: 'Mike Wilson', role: 'Analyst', progress: 78, tasks: 15, completed: 12 },
              { name: 'Lisa Brown', role: 'Marketing Specialist', progress: 88, tasks: 10, completed: 9 }
            ];
            
            response = `📊 **Team Progress Overview:**\n\n${teamData.map(member => 
              `👤 **${member.name}** (${member.role})\n   Progress: ${member.progress}% | Tasks: ${member.completed}/${member.tasks} completed\n   Status: ${member.progress >= 90 ? '🟢 Excellent' : member.progress >= 75 ? '🟡 On Track' : '🔴 Needs Attention'}`
            ).join('\n\n')}\n\n📈 **Team Average**: ${Math.round(teamData.reduce((sum, member) => sum + member.progress, 0) / teamData.length)}%`;
          }
          action = { type: 'team_progress_retrieved', authorized: !!authService.hasPermission(user, 'view_team_progress') };
          break;
          
        case 'employee_management':
          // Check if user has permission to view all employees
          const managerUser = await authService.getUserById(userId);
          if (!managerUser || !authService.hasPermission(managerUser, 'view_all_employees')) {
            response = `🚫 **Access Denied**: You don't have permission to view all employees. This feature is available to managers and HR only.`;
          } else {
            // Get all users from the system
            const allUsers = authService.getUsers();
            const employees = allUsers.filter(u => u.role !== 'manager');
            
            if (employees.length === 0) {
              response = `👥 No employees found in the system.`;
            } else {
              response = `👥 **Employee Directory (${employees.length} employees):**\n\n${employees.map((emp, index) => 
                `${index + 1}. **${emp.name}**\n   📧 ${emp.email}\n   🏢 ${emp.department || 'No Department'}\n   👔 ${emp.role ? emp.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'No Role'}`
              ).join('\n\n')}`;
            }
          }
          action = { type: 'employees_retrieved', authorized: !!authService.hasPermission(managerUser, 'view_all_employees'), count: authService.getUsers().length };
          break;
          
        case 'employee_progress':
          // Check if user has permission to view employee progress (HR or Manager)
          const hrUser = await authService.getUserById(userId);
          if (!hrUser || (!authService.hasPermission(hrUser, 'view_all_progress') && !authService.hasPermission(hrUser, 'view_team_progress'))) {
            response = `🚫 **Access Denied**: You don't have permission to view employee progress. This feature is available to managers and HR only.`;
          } else {
            // Extract employee name from the intent entities
            const employeeName = intent.entities && intent.entities.extracted 
              ? intent.entities.extracted 
              : null;
            
            if (!employeeName) {
              // If no employee name was extracted, provide guidance
              const availableEmployees = employeeProgressService.getAllEmployeeNames();
              response = `👤 **Employee Progress Query**: Please specify which employee you'd like to check.\\n\\n📋 **Available Employees:**\\n${availableEmployees.map((name, index) => `${index + 1}. ${name}`).join('\\n')}\\n\\n💡 **Try asking:** "What is the progress of John Doe?" or "Has Jane Smith completed the work?"`;
            } else {
              // Get progress for the specified employee
              const progressResult = employeeProgressService.getEmployeeProgress(employeeName);
              response = progressResult.message;
            }
          }
          action = { type: 'employee_progress_retrieved', authorized: !!(authService.hasPermission(hrUser, 'view_all_progress') || authService.hasPermission(hrUser, 'view_team_progress')) };
          break;
          
        case 'greeting':
          response = `Hello! I'm your IT Workflow Assistant. I can help you with:\n- Access requests (e.g., "I need access to Figma")\n- IT tickets (e.g., "My laptop is not working")\n- Onboarding checklists\n- Ticket queries\n\nHow can I assist you today?`;
          break;
          
        case 'help':
          response = `I can help you with several tasks:\n\n🔑 Access Requests: "I need access to [resource]"\n🎫 Create Tickets: "Issue with [description]"\n📋 View Tickets: "Show open tickets"\n👥 Onboarding: "Show onboarding checklist"\n\nJust ask naturally, and I'll understand!`;
          break;
          
        default:
          // Use AI for unknown intents with data context
          const dataContext = await prompts.generateDataContext();
          
          const prompt = prompts.render({ 
            scenario: 'data_query', 
            message: enhancedPrompt,
            dataContext: dataContext
          });
          const aiResponse = await callModel(prompt, { temperature: 0.3 });
          response = aiResponse.text;
      }
    } else {
      // Low confidence - use AI with data context for better responses
      const dataContext = await prompts.generateDataContext();
      
      const prompt = prompts.render({ 
        scenario: 'data_query', 
        message: enhancedPrompt,
        dataContext: dataContext
      });
      const aiResponse = await callModel(prompt, { temperature: 0.3 });
      response = aiResponse.text;
    }
    
    // 6. Save bot response
    conversationService.saveMessage(userId, response, 'assistant', { intent: intent.intent, confidence: intent.confidence });
    
    // 7. Get suggestions for next actions
    const suggestions = intentDetector.getSuggestions(intent.intent);
    
    res.json({
      response,
      intent: intent.intent,
      confidence: intent.confidence,
      action,
      suggestions
    });
    
  } catch (err) {
    console.error('enhanced chat error', err);
    res.status(500).json({ error: String(err) });
  }
});

// Get conversation history
app.get('/api/conversations/history', requireAuth, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const history = conversationService.getConversationHistory(req.session.userId, limit);
    res.json({ history });
  } catch (err) {
    console.error('get history error', err);
    res.status(500).json({ error: String(err) });
  }
});

// Clear conversation history
app.delete('/api/conversations/history', requireAuth, (req, res) => {
  try {
    conversationService.clearHistory(req.session.userId);
    res.json({ success: true, message: 'Conversation history cleared' });
  } catch (err) {
    console.error('clear history error', err);
    res.status(500).json({ error: String(err) });
  }
});

// Get conversation statistics
app.get('/api/conversations/stats', requireAuth, (req, res) => {
  try {
    const stats = conversationService.getStats(req.session.userId);
    res.json({ stats });
  } catch (err) {
    console.error('get stats error', err);
    res.status(500).json({ error: String(err) });
  }
});

// Detect intent from message (utility endpoint)
app.post('/api/intent/detect', requireAuth, (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });
  
  try {
    const intent = intentDetector.detect(message);
    const suggestions = intentDetector.getSuggestions(intent.intent);
    res.json({ intent, suggestions });
  } catch (err) {
    console.error('intent detection error', err);
    res.status(500).json({ error: String(err) });
  }
});

// ============ AI PROVIDER MANAGEMENT ROUTES ============
app.get('/api/ai/status', requireAuth, (req, res) => {
  const info = aiService.getProviderInfo();
  res.json(info);
});

app.post('/api/ai/switch', requireAuth, (req, res) => {
  const { provider } = req.body;
  if (!provider || (provider !== 'openai' && provider !== 'gemini')) {
    return res.status(400).json({ error: 'Provider must be "openai" or "gemini"' });
  }
  
  const success = aiService.switchProvider(provider);
  if (success) {
    const info = aiService.getProviderInfo();
    res.json({ success: true, info });
  } else {
    res.status(400).json({ error: 'Failed to switch provider' });
  }
});

// ============ TASK MANAGEMENT ROUTES ============

// Employee routes
app.get('/api/employees', requireAuth, async (req, res) => {
  try {
    const employees = await taskManagement.getEmployees();
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/employees', requireAuth, async (req, res) => {
  try {
    const employee = await taskManagement.createEmployee(req.body);
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/employees/:id', requireAuth, async (req, res) => {
  try {
    const employee = await taskManagement.getEmployeeById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Task assignment routes
app.post('/api/tasks/assign', requireAuth, async (req, res) => {
  try {
    const assignmentRequest = {
      ...req.body,
      assignedBy: req.session.userId
    };
    
    const tasks = await taskManagement.assignTasks(assignmentRequest);
    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Employee task routes
app.get('/api/employees/:id/tasks', requireAuth, async (req, res) => {
  try {
    const employeeTasks = await taskManagement.getEmployeeTasks(req.params.id);
    res.json(employeeTasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/tasks/:id/status', requireAuth, async (req, res) => {
  try {
    const taskUpdateRequest = {
      taskId: req.params.id,
      ...req.body,
      updatedBy: req.session.userId
    };
    
    const updatedTask = await taskManagement.updateTaskStatus(taskUpdateRequest);
    res.json({ success: true, task: updatedTask });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manager dashboard routes
app.get('/api/manager/dashboard', requireAuth, async (req, res) => {
  try {
    const managerId = req.session.userId;
    const dashboardData = await taskManagement.getManagerDashboard(managerId);
    res.json(dashboardData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Task progress query routes (for chatbot)
app.post('/api/tasks/query', requireAuth, async (req, res) => {
  try {
    const queryResult = await taskManagement.getTaskProgressQuery(req.body);
    res.json({
      success: true,
      ...queryResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enhanced chat with task queries
app.post('/api/chat/tasks', requireAuth, async (req, res) => {
  try {
    const { message, context } = req.body;
    
    // Try to detect if this is a task-related query
    const taskQueryPatterns = [
      /progress.+for.+(\w+)/i,
      /what.+did.+(\w+).+do.+today/i,
      /status.+of.+(\w+)/i,
      /how.+is.+(\w+).+doing/i,
      /(\w+).+completed.+today/i
    ];
    
    let detectedQuery = null;
    let employeeName = null;
    
    for (const pattern of taskQueryPatterns) {
      const match = message.match(pattern);
      if (match) {
        employeeName = match[1];
        break;
      }
    }
    
    if (employeeName) {
      // Try to find employee by name
      const employees = await taskManagement.getEmployees();
      const employee = employees.find(emp => 
        emp.name.toLowerCase().includes(employeeName.toLowerCase())
      );
      
      if (employee) {
        if (message.toLowerCase().includes('today') || message.toLowerCase().includes('daily')) {
          detectedQuery = {
            type: 'daily-summary',
            employeeId: employee.id,
            date: new Date().toISOString().split('T')[0]
          };
        } else if (message.toLowerCase().includes('progress')) {
          detectedQuery = {
            type: 'employee-progress',
            employeeId: employee.id
          };
        } else {
          detectedQuery = {
            type: 'task-status',
            employeeId: employee.id
          };
        }
        
        const queryResult = await taskManagement.getTaskProgressQuery(detectedQuery);
        return res.json({
          response: queryResult.response,
          data: queryResult.data,
          detectedQuery
        });
      }
    }
    
    // If no specific task query detected, fall back to general AI response
    const aiResponse = await callModel(
      prompts.createChatPrompt(message, context),
      { temperature: 0.7, maxTokens: 500 }
    );
    
    res.json({
      response: aiResponse.output || 'I can help you with task management queries. Try asking about an employee\'s progress or daily summary.',
      fallback: true
    });
    
  } catch (error) {
    console.error('Enhanced chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

app.listen(port, () => console.log('Server running on', port));
