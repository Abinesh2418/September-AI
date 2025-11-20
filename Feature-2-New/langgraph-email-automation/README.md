# Feature-2: Real Gmail Ticket System 🎫

**Automated IT Ticket Creation from Real Gmail Inbox**

This system monitors your actual Gmail inbox (`sharang.23ad@kct.ac.in`), automatically analyzes incoming employee emails, creates IT tickets, assigns priorities, and routes them to appropriate staff members.

## 🚀 Quick Start

### 1. Installation
```bash
./install.sh
```

### 2. Configuration
Update `.env` file with your credentials:
```bash
# Gmail Settings
MY_EMAIL=sharang.23ad@kct.ac.in
GMAIL_APP_PASSWORD=your_16_character_app_password

# API Keys
GROQ_API_KEY=your_groq_api_key
GOOGLE_API_KEY=your_google_api_key

# Staff Routing
SOFTWARE_SECURITY_OFFICER=security@company.com
IT_HELPDESK_MANAGER=itmanager@company.com
HR_COORDINATOR=hr@company.com
# ... more staff emails
```

### 3. Get Gmail App Password
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification**
3. Click **App Passwords**
4. Generate password for "Mail"
5. Copy 16-character password to `.env`

### 4. Start System
```bash
./start_system.sh
```  

## 📊 Features

### Real Gmail Integration
- ✅ Monitors actual Gmail inbox (`sharang.23ad@kct.ac.in`)
- ✅ IMAP connection for real-time email processing
- ✅ Automatic email parsing and analysis

### AI-Powered Analysis
- 🧠 **GROQ API** with Llama-3.1-70B for email analysis
- 🎯 **Priority Detection**: High/Medium/Low based on content
- 📂 **Category Classification**: Security, Access, Hardware, etc.
- 👥 **Smart Routing**: Assigns to appropriate IT staff

### Automatic Ticket Creation
- 🎫 **Unique Ticket IDs**: Timestamp-based
- 📝 **Structured Data**: Sender, subject, priority, category
- ⏰ **Timestamps**: Creation time tracking
- 📧 **Email Notifications**: Sent to assigned staff

### Web Dashboard
- 🌐 **Real-time Interface**: http://localhost:8000
- 📊 **Live Statistics**: Priority counts, staff assignments
- 🔄 **Auto Refresh**: Updates every 30 seconds
- 🧪 **Email Simulation**: Test ticket creation
- 📱 **Responsive Design**: Works on all devices

## 🎯 How It Works

### 1. Email Monitoring
```
Employee sends email → Gmail Inbox → System detects new email
```

### 2. AI Analysis
```
Email content → GROQ API → Priority + Category + Routing
```

### 3. Ticket Creation
```
Analysis results → Create ticket → Store in system → Send notification
```

### 4. Staff Routing
```
Ticket type → Route to staff → Email notification → Dashboard update
```

## 👥 Staff Routing Logic

| Email Content | Priority | Assigned To |
|---------------|----------|-------------|
| Password reset, Security breach | **HIGH** | Software Security Officer |
| New employee setup | **MEDIUM** | HR Coordinator |
| Hardware problems | **MEDIUM** | IT Helpdesk Manager |
| VPN/Network issues | **HIGH** | Network Admin |
| Software purchases | **LOW** | Procurement Officer |

## 📂 System Files

### Core Components
- **`real_gmail_tickets.py`**: Main Gmail monitoring & ticket creation
- **`ticket_dashboard.py`**: Web dashboard FastAPI server
- **`.env`**: Configuration (Gmail, API keys, staff routing)

### Scripts
- **`install.sh`**: Install dependencies & setup
- **`start_system.sh`**: Start web dashboard & monitoring

## 🧪 Testing

### 1. Simulate Employee Email
Use the **"Simulate Employee Email"** button on dashboard

### 2. Send Real Email
Send test email to `sharang.23ad@kct.ac.in` and watch dashboard

### 3. Manual Inbox Check
Click **"Check Inbox Now"** button to force email processing

## 📊 Dashboard Features

- 🌐 **Real-time Interface**: http://localhost:8000
- 📊 **Live Statistics**: Priority counts, staff assignments
- 🔄 **Auto Refresh**: Updates every 30 seconds
- 🧪 **Email Simulation**: Test ticket creation
- 📱 **Responsive Design**: Works on all devices

## 🎯 Use Cases

### Real-world Scenarios
1. **Password Reset**: High priority → Security Officer
2. **New Hire Setup**: Medium priority → HR Coordinator  
3. **Hardware Issue**: Medium priority → IT Manager
4. **Software License**: Low priority → Procurement Officer
5. **Network Problem**: High priority → Network Admin

## 📈 System Architecture

```
Employee Email → Gmail Inbox (IMAP) → AI Analysis (GROQ) → 
Ticket Creation → Staff Notification (SMTP) → Web Dashboard (FastAPI)
```

---

**🎯 Feature-2: Transforming your Gmail inbox into a professional IT ticketing system!**
