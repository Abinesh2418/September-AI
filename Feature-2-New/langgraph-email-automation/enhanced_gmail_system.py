#!/usr/bin/env python3
"""
Feature-2: Enhanced Real-Time Gmail Ticket System
Monitors Gmail inbox in real-time and creates tickets automatically
"""

import os
import sys
import time
import imaplib
import smtplib
import email
import json
import uuid
import requests
from datetime import datetime
from typing import Dict, List
from dotenv import load_dotenv
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Load environment variables
load_dotenv()

class EnhancedGmailTicketSystem:
    def __init__(self):
        """Initialize the enhanced Gmail ticket system"""
        # Gmail configuration
        self.email_address = os.getenv('MY_EMAIL', 'sharang.23ad@kct.ac.in')
        self.app_password = os.getenv('GMAIL_APP_PASSWORD')
        
        # API keys
        self.groq_api_key = os.getenv('GROQ_API_KEY')
        self.google_api_key = os.getenv('GOOGLE_API_KEY')
        
        # Gmail servers
        self.imap_server = 'imap.gmail.com'
        self.smtp_server = 'smtp.gmail.com'
        
        # Staff routing
        self.staff_routing = {
            'SOFTWARE_SECURITY_OFFICER': os.getenv('SOFTWARE_SECURITY_OFFICER', 'security@company.com'),
            'IT_HELPDESK_MANAGER': os.getenv('IT_HELPDESK_MANAGER', 'itmanager@company.com'),
            'HR_COORDINATOR': os.getenv('HR_COORDINATOR', 'hr@company.com'),
            'PROCUREMENT_OFFICER': os.getenv('PROCUREMENT_OFFICER', 'procurement@company.com'),
            'NETWORK_ADMIN': os.getenv('NETWORK_ADMIN', 'network@company.com')
        }
        
        # System state
        self.tickets = []
        self.processed_email_ids = set()
        self.stats = {
            'total_tickets': 0,
            'high_priority': 0,
            'medium_priority': 0,
            'low_priority': 0,
            'tickets_by_category': {},
            'start_time': datetime.now()
        }
        
        print("🎯 Enhanced Gmail Ticket System Initialized")
        print(f"📧 Monitoring: {self.email_address}")
        self._validate_configuration()
    
    def _validate_configuration(self):
        """Validate system configuration"""
        issues = []
        
        if not self.app_password:
            issues.append("❌ Gmail App Password not set")
        elif len(self.app_password) != 16:
            issues.append("❌ Gmail App Password should be 16 characters")
        else:
            print("✅ Gmail App Password: Set")
            
        if not self.groq_api_key:
            issues.append("❌ GROQ API Key not set")
        else:
            print("✅ GROQ API Key: Set")
            
        if not self.google_api_key:
            issues.append("❌ Google API Key not set") 
        else:
            print("✅ Google API Key: Set")
        
        if issues:
            print("\n🚨 Configuration Issues:")
            for issue in issues:
                print(f"  {issue}")
            print("\n📋 To fix Gmail App Password:")
            print("1. Go to: https://myaccount.google.com/security")
            print("2. Enable 2-Step Verification")
            print("3. Click 'App Passwords'")
            print("4. Generate password for 'Mail'")
            print("5. Copy the 16-character password to .env file")
            return False
        
        return True
    
    def test_gmail_connection(self) -> bool:
        """Test Gmail IMAP connection"""
        try:
            print(f"🔍 Testing Gmail connection for {self.email_address}...")
            mail = imaplib.IMAP4_SSL(self.imap_server)
            mail.login(self.email_address, self.app_password)
            mail.select('inbox')
            
            # Test search
            status, messages = mail.search(None, 'ALL')
            if status == 'OK':
                total_emails = len(messages[0].split())
                print(f"✅ Gmail connection successful! Found {total_emails} emails in inbox")
                mail.close()
                mail.logout()
                return True
            
        except Exception as e:
            print(f"❌ Gmail connection failed: {e}")
            print("\n💡 Troubleshooting:")
            print("1. Verify Gmail App Password is correct (16 characters)")
            print("2. Ensure 2-Step Verification is enabled")
            print("3. Check if 'Less secure app access' is disabled (use App Password instead)")
            return False
        
        return False
    
    def analyze_email_with_ai(self, email_data: Dict) -> Dict:
        """Enhanced AI analysis with GROQ API"""
        try:
            prompt = f"""
            Analyze this IT support email and provide structured categorization:
            
            From: {email_data['sender']}
            Subject: {email_data['subject']}
            Body: {email_data['body']}
            
            Classify this email and respond with ONLY valid JSON:
            {{
                "category": "security|access|hardware|software|network|general",
                "priority": "high|medium|low", 
                "route_to": "SOFTWARE_SECURITY_OFFICER|IT_HELPDESK_MANAGER|HR_COORDINATOR|PROCUREMENT_OFFICER|NETWORK_ADMIN",
                "issue_type": "brief description of the issue",
                "urgency_reason": "explanation for priority level"
            }}
            
            Routing Rules:
            - Security issues, password resets → SOFTWARE_SECURITY_OFFICER (HIGH)
            - New employee setup, departures → HR_COORDINATOR (MEDIUM)
            - Hardware problems, software issues → IT_HELPDESK_MANAGER (MEDIUM/HIGH)
            - Network/VPN problems → NETWORK_ADMIN (HIGH)
            - Software purchases, licenses → PROCUREMENT_OFFICER (LOW)
            """
            
            headers = {
                "Authorization": f"Bearer {self.groq_api_key}",
                "Content-Type": "application/json"
            }
            
            data = {
                "model": "llama-3.1-70b-versatile",
                "messages": [
                    {"role": "system", "content": "You are an expert IT ticket analyzer. Respond only with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.1,
                "max_tokens": 300
            }
            
            response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=data,
                timeout=15
            )
            
            if response.status_code == 200:
                result = response.json()
                ai_response = result["choices"][0]["message"]["content"].strip()
                
                # Clean JSON response
                if ai_response.startswith("```json"):
                    ai_response = ai_response[7:-3]
                elif ai_response.startswith("```"):
                    ai_response = ai_response[3:-3]
                
                analysis = json.loads(ai_response)
                return analysis
                
        except Exception as e:
            print(f"❌ AI analysis failed: {e}")
        
        # Fallback analysis
        return self._fallback_analysis(email_data)
    
    def _fallback_analysis(self, email_data: Dict) -> Dict:
        """Fallback analysis when AI fails"""
        text = f"{email_data['subject']} {email_data['body']}".lower()
        
        # Security keywords
        if any(word in text for word in ['password', 'reset', 'security', 'breach', 'hack', 'unauthorized']):
            return {
                "category": "security",
                "priority": "high",
                "route_to": "SOFTWARE_SECURITY_OFFICER", 
                "issue_type": "Security or access issue",
                "urgency_reason": "Security-related issues require immediate attention"
            }
        
        # HR/Onboarding keywords  
        if any(word in text for word in ['new employee', 'onboarding', 'departure', 'leaving']):
            return {
                "category": "access",
                "priority": "medium",
                "route_to": "HR_COORDINATOR",
                "issue_type": "Employee lifecycle management", 
                "urgency_reason": "Standard employee onboarding/offboarding process"
            }
        
        # Network keywords
        if any(word in text for word in ['vpn', 'network', 'connectivity', 'internet', 'wifi']):
            return {
                "category": "network", 
                "priority": "high",
                "route_to": "NETWORK_ADMIN",
                "issue_type": "Network connectivity issue",
                "urgency_reason": "Network issues affect productivity"
            }
        
        # Hardware keywords
        if any(word in text for word in ['laptop', 'computer', 'hardware', 'screen', 'keyboard']):
            return {
                "category": "hardware",
                "priority": "medium", 
                "route_to": "IT_HELPDESK_MANAGER",
                "issue_type": "Hardware support request",
                "urgency_reason": "Hardware issues affect daily work"
            }
        
        # Software/License keywords
        if any(word in text for word in ['license', 'software', 'purchase', 'subscription']):
            return {
                "category": "software",
                "priority": "low",
                "route_to": "PROCUREMENT_OFFICER",
                "issue_type": "Software or license request", 
                "urgency_reason": "Standard procurement process"
            }
        
        # Default fallback
        return {
            "category": "general",
            "priority": "medium",
            "route_to": "IT_HELPDESK_MANAGER", 
            "issue_type": "General IT support request",
            "urgency_reason": "Standard IT support ticket"
        }
    
    def create_ticket(self, email_data: Dict, analysis: Dict) -> Dict:
        """Create ticket from email analysis"""
        ticket_id = f"TK-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{str(uuid.uuid4())[:6].upper()}"
        
        # Extract sender info
        sender = email_data['sender']
        if '<' in sender:
            sender_name = sender.split('<')[0].strip().replace('"', '')
            sender_email = sender.split('<')[1].replace('>', '')
        else:
            sender_name = sender.split('@')[0].replace('.', ' ').title()
            sender_email = sender
        
        ticket = {
            "ticket_id": ticket_id,
            "sender_name": sender_name,
            "sender_email": sender_email,
            "subject": email_data['subject'],
            "description": email_data['body'][:500] + ('...' if len(email_data['body']) > 500 else ''),
            "priority": analysis['priority'],
            "category": analysis['category'], 
            "issue_type": analysis['issue_type'],
            "urgency_reason": analysis['urgency_reason'],
            "assigned_role": analysis['route_to'],
            "assigned_to": self.staff_routing.get(analysis['route_to'], 'it.manager@company.com'),
            "status": "open",
            "created_at": datetime.now().isoformat(),
            "email_id": email_data.get('id', 'simulated'),
            "escalated": False,
            "notification_sent": False
        }
        
        return ticket
    
    def send_notification_to_staff(self, ticket: Dict) -> bool:
        """Send email notification to assigned staff member"""
        try:
            smtp = smtplib.SMTP_SSL(self.smtp_server, 587)
            smtp.login(self.email_address, self.app_password)
            
            # Create notification email
            msg = MIMEMultipart()
            msg['From'] = self.email_address
            msg['To'] = ticket['assigned_to']
            msg['Subject'] = f"🎫 [{ticket['priority'].upper()}] New IT Ticket: {ticket['ticket_id']}"
            
            # Create email body with solution suggestions
            solutions = self._get_solution_suggestions(ticket)
            
            email_body = f"""
🎫 NEW IT SUPPORT TICKET ASSIGNED TO YOU

Ticket Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Ticket ID: {ticket['ticket_id']}
🚨 Priority: {ticket['priority'].upper()}
📂 Category: {ticket['category'].upper()}
⏰ Created: {ticket['created_at']}

Employee Request:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 From: {ticket['sender_name']} ({ticket['sender_email']})
📝 Subject: {ticket['subject']}
🔍 Issue Type: {ticket['issue_type']}

📄 Description:
{ticket['description']}

🎯 Why This Priority: {ticket['urgency_reason']}

Recommended Solutions:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{solutions}

📊 Dashboard: http://localhost:8000
💬 Reply to this email to update the employee directly.

🤖 Feature-2 Gmail Ticket System
"""
            
            msg.attach(MIMEText(email_body, 'plain'))
            
            smtp.send_message(msg)
            smtp.quit()
            
            print(f"✅ Notification sent to {ticket['assigned_to']} for ticket {ticket['ticket_id']}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to send notification: {e}")
            return False
    
    def _get_solution_suggestions(self, ticket: Dict) -> str:
        """Generate solution suggestions based on ticket category"""
        solutions = {
            'security': """
1. 🔐 Password Reset:
   - Guide employee through self-service password reset
   - Verify identity before providing new credentials
   - Enable MFA if not already active

2. 🛡️ Security Investigation:
   - Check recent login attempts and locations
   - Scan for suspicious activities
   - Update security protocols if needed

3. 📧 Next Steps:
   - Reply with temporary password if urgent
   - Schedule security training if needed""",
            
            'hardware': """
1. 💻 Hardware Troubleshooting:
   - Remote diagnostics if possible
   - Check warranty and support options
   - Prepare replacement equipment if needed

2. 🔧 Quick Fixes:
   - Restart and driver updates
   - Check connections and cables
   - Test with different user account

3. 📦 Next Steps:
   - Schedule on-site visit if needed
   - Order replacement parts
   - Provide loaner equipment if available""",
            
            'network': """
1. 🌐 Network Diagnostics:
   - Check VPN server status
   - Verify network connectivity
   - Test DNS and firewall settings

2. 🔧 Quick Solutions:
   - Restart network equipment
   - Update VPN client software
   - Check network cables and WiFi

3. 📡 Next Steps:
   - Contact ISP if needed
   - Update network infrastructure
   - Provide mobile hotspot if urgent""",
            
            'software': """
1. 💿 Software Support:
   - Check license availability
   - Verify system requirements
   - Download latest version

2. ⚙️ Installation Help:
   - Remote installation assistance
   - Troubleshoot installation errors
   - Configure software settings

3. 📋 Next Steps:
   - Purchase additional licenses if needed
   - Schedule training session
   - Document configuration for future reference""",
            
            'access': """
1. 👤 Account Management:
   - Create new user accounts
   - Set up email and system access
   - Configure security groups and permissions

2. 🏢 Onboarding Process:
   - Prepare hardware and software
   - Schedule orientation meeting
   - Provide access credentials securely

3. 📝 Documentation:
   - Update employee directory
   - Create IT checklist for manager
   - Schedule follow-up for first week"""
        }
        
        return solutions.get(ticket['category'], """
1. 🎯 General IT Support:
   - Gather more information about the issue
   - Provide step-by-step troubleshooting
   - Schedule follow-up if needed

2. 📞 Next Steps:
   - Contact employee for clarification
   - Escalate to specialist if needed
   - Document solution for knowledge base""")
    
    def fetch_new_emails(self) -> List[Dict]:
        """Fetch new emails from Gmail inbox"""
        if not self.app_password or len(self.app_password) != 16:
            print("❌ Invalid Gmail App Password configuration")
            return []
        
        try:
            mail = imaplib.IMAP4_SSL(self.imap_server)
            mail.login(self.email_address, self.app_password)
            mail.select('inbox')
            
            # Search for recent unread emails
            status, messages = mail.search(None, 'UNSEEN')
            if status != 'OK':
                return []
            
            email_ids = messages[0].split()
            emails = []
            
            print(f"📬 Found {len(email_ids)} unread emails")
            
            for email_id in email_ids[-10:]:  # Process last 10 emails
                try:
                    email_id_str = email_id.decode()
                    if email_id_str in self.processed_email_ids:
                        continue
                    
                    status, msg_data = mail.fetch(email_id, '(RFC822)')
                    if status == 'OK':
                        email_message = email.message_from_bytes(msg_data[0][1])
                        
                        # Extract email content
                        sender = email_message.get('From', '')
                        subject = email_message.get('Subject', '')
                        body = self._get_email_body(email_message)
                        
                        # Filter valid employee emails
                        if self._is_valid_email(sender, subject, body):
                            email_data = {
                                'id': email_id_str,
                                'sender': sender,
                                'subject': subject,
                                'body': body,
                                'timestamp': datetime.now().isoformat()
                            }
                            emails.append(email_data)
                            
                except Exception as e:
                    print(f"❌ Error processing email: {e}")
            
            mail.close()
            mail.logout()
            return emails
            
        except Exception as e:
            print(f"❌ Error fetching emails: {e}")
            return []
    
    def _get_email_body(self, email_message) -> str:
        """Extract email body text"""
        body = ""
        
        if email_message.is_multipart():
            for part in email_message.walk():
                if part.get_content_type() == "text/plain":
                    body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                    break
        else:
            body = email_message.get_payload(decode=True).decode('utf-8', errors='ignore')
        
        return body.strip()
    
    def _is_valid_email(self, sender: str, subject: str, body: str) -> bool:
        """Check if email is valid employee request"""
        # Skip automated emails
        if any(keyword in sender.lower() for keyword in ['noreply', 'no-reply', 'donotreply']):
            return False
        
        # Skip very short emails (likely spam)
        if len(body.strip()) < 20:
            return False
            
        return True
    
    def process_new_emails(self) -> List[Dict]:
        """Process new emails and create tickets"""
        emails = self.fetch_new_emails()
        new_tickets = []
        
        for email_data in emails:
            try:
                print(f"\n📧 Processing: {email_data['subject'][:50]}...")
                print(f"   From: {email_data['sender']}")
                
                # AI analysis
                analysis = self.analyze_email_with_ai(email_data)
                
                # Create ticket
                ticket = self.create_ticket(email_data, analysis)
                
                # Store ticket
                self.tickets.append(ticket)
                new_tickets.append(ticket)
                self.processed_email_ids.add(email_data['id'])
                
                # Send notification to assigned staff
                notification_sent = self.send_notification_to_staff(ticket)
                ticket['notification_sent'] = notification_sent
                
                # Update stats
                self.stats['total_tickets'] += 1
                self.stats[f"{ticket['priority']}_priority"] += 1
                
                print(f"   ✅ Ticket created: {ticket['ticket_id']}")
                print(f"   🎯 Priority: {ticket['priority'].upper()}")
                print(f"   👤 Assigned to: {ticket['assigned_role']}")
                print(f"   📧 Notification: {'Sent' if notification_sent else 'Failed'}")
                
            except Exception as e:
                print(f"   ❌ Error processing email: {e}")
        
        return new_tickets
    
    def get_dashboard_data(self) -> Dict:
        """Get data for dashboard API"""
        return {
            "tickets": self.tickets,
            "stats": self.stats,
            "system_info": {
                "monitored_email": self.email_address,
                "total_processed": len(self.processed_email_ids),
                "uptime": str(datetime.now() - self.stats['start_time']).split('.')[0]
            }
        }
    
    def simulate_employee_email(self, sender: str, subject: str, body: str) -> Dict:
        """Simulate an employee email for testing"""
        email_data = {
            'id': f"sim_{datetime.now().strftime('%H%M%S')}",
            'sender': sender,
            'subject': subject,
            'body': body,
            'timestamp': datetime.now().isoformat()
        }
        
        analysis = self.analyze_email_with_ai(email_data)
        ticket = self.create_ticket(email_data, analysis)
        
        # Send notification for simulated tickets too
        notification_sent = self.send_notification_to_staff(ticket)
        ticket['notification_sent'] = notification_sent
        
        # Store ticket
        self.tickets.append(ticket)
        self.stats['total_tickets'] += 1
        self.stats[f"{ticket['priority']}_priority"] += 1
        
        return ticket
    
    def resolve_ticket(self, ticket_id: str) -> bool:
        """Mark a ticket as resolved"""
        for ticket in self.tickets:
            if ticket['ticket_id'] == ticket_id:
                ticket['status'] = 'resolved'
                ticket['resolved_at'] = datetime.now().isoformat()
                print(f"✅ Ticket {ticket_id} marked as resolved")
                return True
        return False
    
    def escalate_ticket(self, ticket_id: str) -> bool:
        """Escalate a ticket to higher priority"""
        for ticket in self.tickets:
            if ticket['ticket_id'] == ticket_id:
                old_priority = ticket['priority']
                if ticket['priority'] == 'low':
                    ticket['priority'] = 'medium'
                elif ticket['priority'] == 'medium':
                    ticket['priority'] = 'high'
                
                ticket['escalated'] = True
                ticket['escalated_at'] = datetime.now().isoformat()
                print(f"⬆️ Ticket {ticket_id} escalated from {old_priority} to {ticket['priority']}")
                return True
        return False
    
    def clear_all_tickets(self) -> int:
        """Clear all tickets and reset system"""
        count = len(self.tickets)
        self.tickets.clear()
        self.processed_email_ids.clear()
        
        # Reset stats
        self.stats = {
            'total_tickets': 0,
            'high_priority': 0,
            'medium_priority': 0,
            'low_priority': 0,
            'tickets_by_category': {},
            'start_time': datetime.now()
        }
        
        print(f"🗑️ Cleared {count} tickets")
        return count

# Global system instance
gmail_system = None

def initialize_system():
    """Initialize the Gmail ticket system"""
    global gmail_system
    gmail_system = EnhancedGmailTicketSystem()
    return gmail_system

if __name__ == "__main__":
    print("🎯 Feature-2: Enhanced Gmail Ticket System")
    print("=" * 50)
    
    system = initialize_system()
    
    if not system.test_gmail_connection():
        print("\n❌ Cannot connect to Gmail. Please fix configuration first.")
        sys.exit(1)
    
    print(f"\n✅ System ready! Monitoring {system.email_address}")
    print("🎯 Send test emails to see automatic ticket creation")
    print("📊 Use the web dashboard at http://localhost:8000")
    
    try:
        while True:
            print(f"\n🔍 [{datetime.now().strftime('%H:%M:%S')}] Checking for new emails...")
            new_tickets = system.process_new_emails()
            
            if new_tickets:
                print(f"🎫 Created {len(new_tickets)} new tickets!")
            else:
                print("📭 No new emails found")
            
            time.sleep(30)  # Check every 30 seconds
            
    except KeyboardInterrupt:
        print(f"\n🛑 System stopped")
        print(f"📊 Total tickets processed: {system.stats['total_tickets']}")