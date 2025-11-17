import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },

  signup: async (email: string, password: string, name: string) => {
    const response = await api.post('/api/auth/signup', { email, password, name });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

// Chat API
export const chatAPI = {
  sendMessage: async (type: string, message: string) => {
    const response = await api.post(`/api/chat/${type}`, { message });
    return response.data;
  },

  sendEnhancedMessage: async (message: string, signal?: AbortSignal) => {
    const response = await api.post('/api/chat/enhanced', { message }, {
      signal
    });
    return response.data;
  },

  getConversations: async () => {
    const response = await api.get('/api/conversations');
    return response.data;
  },
};

// Tickets API
export const ticketsAPI = {
  create: async (data: { title: string; description: string; priority: string; category: string }) => {
    const response = await api.post('/api/tickets', data);
    return response.data;
  },

  getAll: async () => {
    const response = await api.get('/api/tickets');
    return response.data;
  },
};

// Access Requests API
export const accessRequestsAPI = {
  create: async (data: { system: string; accessType: string; reason: string; urgency: string }) => {
    const response = await api.post('/api/access-requests', data);
    return response.data;
  },

  getAll: async () => {
    const response = await api.get('/api/access-requests');
    return response.data;
  },
};

// Onboarding API
export const onboardingAPI = {
  create: async (data: { employeeName: string; department: string; role: string; startDate: string; manager: string }) => {
    const response = await api.post('/api/onboarding', data);
    return response.data;
  },

  getAll: async () => {
    const response = await api.get('/api/onboarding');
    return response.data;
  },
};

// Task Management API
export const taskAPI = {
  // Employee management
  getEmployees: async () => {
    const response = await api.get('/api/employees');
    return response.data;
  },

  createEmployee: async (employeeData: any) => {
    const response = await api.post('/api/employees', employeeData);
    return response.data;
  },

  getEmployee: async (id: string) => {
    const response = await api.get(`/api/employees/${id}`);
    return response.data;
  },

  // Task assignment
  assignTasks: async (assignmentData: any) => {
    const response = await api.post('/api/tasks/assign', assignmentData);
    return response.data;
  },

  // Employee tasks
  getEmployeeTasks: async (employeeId: string) => {
    const response = await api.get(`/api/employees/${employeeId}/tasks`);
    return response.data;
  },

  updateTaskStatus: async (taskId: string, updateData: any) => {
    const response = await api.patch(`/api/tasks/${taskId}/status`, updateData);
    return response.data;
  },

  // Manager dashboard
  getManagerDashboard: async () => {
    const response = await api.get('/api/manager/dashboard');
    return response.data;
  },

  // Task queries for chatbot
  queryTasks: async (queryData: any) => {
    const response = await api.post('/api/tasks/query', queryData);
    return response.data;
  },

  chatWithTasks: async (message: string, context?: any) => {
    const response = await api.post('/api/chat/tasks', { message, context });
    return response.data;
  },
};

export default api;