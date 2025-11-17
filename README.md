# 🤖 IT Workflow Chatbot - Role-Based Task Management System

## 📋 Project Overview

A comprehensive role-based AI chatbot system for IT workflow management, featuring intelligent task assignment, employee progress tracking, and automated onboarding processes. Built with React (TypeScript) frontend and Node.js backend with modular architecture.

## Key Features

### 🔐 **Role-Based Authentication**
- **Manager**: Team progress overview, employee management, comprehensive reporting
- **HR**: Employee onboarding, progress queries, role-specific task assignment  
- **Employee**: Personal task management, progress tracking, help requests

### 🤖 **Intelligent AI Chat**
- Smart intent detection and natural language processing
- Role-based response filtering with permission checking
- Real-time conversation history with persistence
- Employee-specific progress queries (e.g., "What is John Doe's progress?")

### 📊 **Advanced Task Management**
- Automated role-specific task templates
- Real-time progress tracking with analytics
- Subtask management and completion workflows
- Performance indicators and reporting

### 👥 **Employee Progress Tracking**
- Individual employee progress reports
- Task completion analytics with percentages
- Recent activity timelines and performance indicators
- Department-wise progress visualization

## 🏗️ Project Architecture

### **Backend (Node.js + Express)**
```
backend/
├── auth/                    # Authentication services
│   └── authService.js      # User management & login
├── tickets/                 # Ticket management
│   └── ticketService.js    # Support ticket handling
├── tasks/                   # Task management modules
│   ├── taskManagementService.js    # Core task operations
│   ├── taskDataService.js          # Task data handling
│   └── employeeProgressService.js  # Progress analytics
├── chat/                    # AI chat functionality
│   ├── aiService.js        # OpenAI/Gemini integration
│   ├── intentDetector.js   # Natural language processing
│   ├── conversationService.js  # Chat history management
│   └── promptManager.js    # AI prompt templates
├── access/                  # Access request management
│   └── accessRequestService.js
├── onboarding/             # Employee onboarding
│   └── onboardingService.js
├── utils/                  # Utility functions
│   ├── simpleCache.js     # Caching system
│   ├── database.js        # Database utilities
│   └── batch.js           # Batch operations
├── data/                   # JSON data storage
│   ├── users.json         # User accounts
│   ├── tasks.json         # Task data
│   ├── activity-log.json  # Activity tracking
│   └── conversations.json # Chat history
└── server.js              # Main server file
```

### **Frontend (React + TypeScript)**
```
frontend/
├── src/
│   ├── components/         # React components
│   │   ├── Chat.tsx       # AI chat interface
│   │   ├── Dashboard.tsx  # Role-specific dashboards
│   │   ├── Login.tsx      # Authentication
│   │   └── HRPanel.tsx    # HR management panel
│   ├── contexts/          # React context providers
│   │   └── AuthContext.tsx
│   ├── services/          # API communication
│   │   └── api.ts         # Backend API calls
│   └── types/             # TypeScript definitions
│       └── taskTypes.ts   # Task-related types
```

## 🚀 Setup & Installation

### **Prerequisites**
- **Node.js**: v16+ 
- **npm**: v7+
- **Git**: Latest version

### **1. Clone Repository**
```bash
git clone https://github.com/Abinesh2418/September-Platforms.git
cd September-Platforms/Chatbot-application/FluxAI/IT-Workflow-Chatbot
```

### **2. Backend Setup**
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Setup environment variables (optional for AI features)
# Create .env file in backend directory:
# OPENAI_API_KEY=your_openai_api_key_here
# GEMINI_API_KEY=your_gemini_api_key_here

# Start backend server
npm start
```
**Backend runs on**: `http://localhost:5000`

### **3. Frontend Setup**
```bash
# Open new terminal and navigate to frontend
cd frontend

# Install dependencies  
npm install

# Start development server
npm start
```
**Frontend runs on**: `http://localhost:3000`

## 🧪 Testing & Usage

### **Pre-configured Test Accounts**

| Role | Email | Password | Permissions |
|------|--------|----------|-------------|
| **Manager** | `manager@company.com` | `manager123` | Full team access, reports, task assignment |
| **HR** | `hr@company.com` | `hr123` | Employee management, onboarding, progress queries |
| **Developer** | `john.doe@company.com` | `employee123` | Personal tasks, help requests |
| **Developer** | `abinesh.kumar@company.com` | `abinesh123` | Personal tasks, reports access |
| **Designer** | `jane.smith@company.com` | `employee123` | Personal tasks, help requests |
| **Analyst** | `mike.wilson@company.com` | `employee123` | Personal tasks, reports access |
| **Marketing** | `lisa.brown@company.com` | `employee123` | Personal tasks, help requests |

### **Quick Test Scenarios**

#### **🏛️ Manager Testing**
Login: `manager@company.com` / `manager123`
```bash
# AI Chat Queries:
"Show me team progress"
"List all employees" 
"What's the team status?"
"Show department statistics"
```

#### **👨‍💼 HR Testing**  
Login: `hr@company.com` / `hr123`
```bash
# Employee Progress Queries:
"What is the progress of John Doe?"
"Has Jane Smith completed the work?"
"Show Abinesh Kumar's progress"
"Is Mike Wilson done with tasks?"
```

#### **👨‍💻 Employee Testing**
Login: `john.doe@company.com` / `employee123`
```bash
# Personal Queries:
"Show my tasks"
"What's my progress?"
"I need help with development"
"Create a support ticket"
```

## 🔧 Configuration

### **Environment Variables (.env)**
```bash
# Backend configuration
PORT=5000
NODE_ENV=development

# AI Service Keys (Optional - system works without them)
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
AI_PROVIDER=gemini  # or 'openai'

# Session Configuration
SESSION_SECRET=your_session_secret_here
```

### **AI Service Setup**
The system works with fallback responses even without AI API keys. For full AI functionality:

1. **OpenAI**: Get API key from [OpenAI Platform](https://platform.openai.com/)
2. **Google Gemini**: Get API key from [Google AI Studio](https://aistudio.google.com/)
3. Add keys to `.env` file in backend directory

## 📚 API Documentation

### **Authentication Endpoints**
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - User logout  
- `GET /api/auth/me` - Get current user info

### **Chat Endpoints**
- `POST /api/chat/enhanced` - Main AI chat endpoint
- `GET /api/conversations/history` - Chat history retrieval

### **Task Management**
- `GET /api/employees` - Get all employees
- `POST /api/tasks/assign` - Assign tasks to employees
- `GET /api/employees/:id/tasks` - Get employee tasks

### **Progress Tracking**
- `GET /api/manager/dashboard` - Manager dashboard data
- `POST /api/chat/tasks` - Task-related chat queries

## 🛠️ Development

### **Adding New Features**
1. **Backend Services**: Add to appropriate folder (auth/, tasks/, chat/, etc.)
2. **Frontend Components**: Add to `frontend/src/components/`
3. **API Routes**: Update `server.js` with new endpoints
4. **Types**: Update TypeScript definitions in `frontend/src/types/`

### **Folder Structure Guidelines**
- **auth/**: Authentication and user management
- **tasks/**: Task assignment, progress tracking, employee management  
- **chat/**: AI chat, intent detection, conversation handling
- **tickets/**: Support ticket management
- **access/**: Access request workflows
- **onboarding/**: Employee onboarding processes
- **utils/**: Shared utilities and helpers

### **Testing New Intents**
Add new chat intents in `chat/intentDetector.js`:
```javascript
new_intent: {
  keywords: ['keyword1', 'keyword2'],
  patterns: [/pattern1/i, /pattern2/i],
  confidence: 0.8
}
```

## 🚀 Production Deployment

### **Backend Deployment**
1. Set environment variables in production
2. Use process manager like PM2
3. Configure reverse proxy (nginx)
4. Set up SSL certificates

### **Frontend Deployment**
1. Update API base URL in production
2. Build optimized bundle: `npm run build`
3. Serve static files with web server

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Open pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- **Repository**: [GitHub](https://github.com/Abinesh2418/September-Platforms)
- **Issues**: [Report Issues](https://github.com/Abinesh2418/September-Platforms/issues)
- **Documentation**: [Project Wiki](https://github.com/Abinesh2418/September-Platforms/wiki)

---

**Built with ❤️ by Abinesh Kumar**