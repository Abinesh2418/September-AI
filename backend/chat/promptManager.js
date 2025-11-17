class PromptManager {
  constructor() {
    // templates for different scenarios
    this.templates = {
      ticket: `You are an IT support assistant. User request:

{message}

Please produce: 1) a short summary, 2) priority (low/med/high), 3) suggested action steps, 4) ticket JSON payload with fields: title, description, priority, assignee, tags.`,
      onboarding: `You are an HR automation assistant. Create an onboarding checklist and resource list for the new employee.

Employee info:
{message}

Return: 1) one-paragraph welcome, 2) a checklist array, 3) list of systems to provision.`,
      access: `You are an IT Access Coordinator. The user requests access change:

{message}

Return: 1) access summary, 2) required approvals, 3) resource links and command snippets.`,
      data_query: `You are an IT Workflow Assistant with access to real-time data. Based on the user's query and the current system data, provide a helpful, accurate response.

CURRENT SYSTEM DATA:
{dataContext}

USER QUERY: {message}

INSTRUCTIONS:
- Use the provided data to answer questions about tickets, access requests, or onboarding
- For count/statistics queries (e.g., "How many tickets?"), provide exact numbers with emojis
- For listing queries (e.g., "Show tickets"), provide formatted lists with relevant details
- If no data exists for a category, mention it clearly
- Use emojis for visual appeal: 📊 for stats, 🎫 for tickets, 🔐 for access, 👥 for onboarding
- Format responses like these examples:

For "How many tickets are available?":
📊 **Ticket Statistics:**
• Total tickets: X
• Open tickets: Y  
• Closed tickets: Z

For "Show me open tickets":
📋 **Found X open ticket(s):**

🎫 **#1**: [Title]
   Priority: [priority] | Status: [status]
   Created: [date]

For "List access requests":
🔑 **Found X access request(s):**

🔐 **[System]** ([access type] access)
   Reason: [reason]
   Status: [status]

For "How many onboarding requests?" or "Show onboarding status":
👥 **Onboarding Statistics:**
• Total requests: X
• Pending: Y
• Completed: Z

For "Show me pending onboarding" or "List onboarding requests":
📋 **Found X onboarding request(s):**

👤 **[Employee Name]** ([Role])
   Status: [status]
   Systems to provision: [systems]
   Created: [date]

For "Show completed onboarding":
✅ **Found X completed onboarding(s):**

👤 **[Employee Name]** ([Role])
   Completed: [date]
   Systems provisioned: [systems]

Be conversational, helpful, and use the exact data provided.`,
      generic: `You are a helpful IT Workflow Assistant. User query:

{message}

Provide a helpful, professional response. If the user is asking about IT systems, workflows, or needs assistance with technical issues, provide relevant guidance and suggestions.`
    };
  }

  render({ scenario, message, dataContext }) {
    const t = this.templates[scenario] || this.templates.generic;
    let rendered = t.replace('{message}', message || '');
    if (dataContext) {
      rendered = rendered.replace('{dataContext}', dataContext);
    }
    return rendered;
  }

  // Generate data context for AI queries
  async generateDataContext() {
    let context = '';

    // Tickets context
    const tickets = await new Promise((resolve) => {
      const ticketService = require('../tickets/ticketService');
      ticketService.getAllTickets((err, tickets) => {
        resolve(err ? [] : tickets);
      });
    });

    const openTicketCount = tickets.filter(ticket => ticket.status === 'open').length;
    const closedTicketCount = tickets.filter(ticket => ticket.status === 'closed').length;

    context += `TICKETS:\n`;
    context += `- Total tickets: ${tickets.length}\n`;
    context += `- Open tickets: ${openTicketCount}\n`;
    context += `- Closed tickets: ${closedTicketCount}\n`;
    
    if (tickets.length > 0) {
      context += `\nRecent tickets:\n`;
      tickets.slice(0, 3).forEach(ticket => {
        context += `• #${ticket.id}: ${ticket.title} - ${ticket.priority} priority - ${ticket.status} - ${new Date(ticket.created_at).toLocaleDateString()}\n`;
      });
    }

    // Access requests context
    const accessRequests = await new Promise((resolve) => {
      const accessRequestService = require('../access/accessRequestService');
      accessRequestService.getAllAccessRequests((err, requests) => {
        resolve(err ? [] : requests);
      });
    });

    const pendingAccessCount = accessRequests.filter(req => req.status === 'pending').length;
    const approvedAccessCount = accessRequests.filter(req => req.status === 'approved').length;

    context += `\nACCESS REQUESTS:\n`;
    context += `- Total access requests: ${accessRequests.length}\n`;
    context += `- Pending requests: ${pendingAccessCount}\n`;
    context += `- Approved requests: ${approvedAccessCount}\n`;
    
    if (accessRequests.length > 0) {
      context += `\nRecent access requests:\n`;
      accessRequests.slice(0, 3).forEach(req => {
        context += `• ${req.resource_name} (${req.access_type} access) - ${req.status} - ${req.justification}\n`;
      });
    }

    // Onboarding context
    const onboardingRequests = await new Promise((resolve) => {
      const onboardingService = require('../onboarding/onboardingService');
      onboardingService.getAllOnboardingRequests((err, requests) => {
        resolve(err ? [] : requests);
      });
    });

    const pendingOnboardingCount = onboardingRequests.filter(req => req.status === 'pending').length;
    const completedOnboardingCount = onboardingRequests.filter(req => req.status === 'completed').length;

    context += `\nONBOARDING:\n`;
    context += `- Total onboarding requests: ${onboardingRequests.length}\n`;
    context += `- Pending onboarding: ${pendingOnboardingCount}\n`;
    context += `- Completed onboarding: ${completedOnboardingCount}\n`;
    
    if (onboardingRequests.length > 0) {
      context += `\nRecent onboarding requests:\n`;
      onboardingRequests.slice(0, 3).forEach(req => {
        const createdDate = new Date(req.created_at).toLocaleDateString();
        context += `• ${req.employee_name} (${req.role}) - ${req.status} - Created: ${createdDate}\n`;
        if (req.systems_to_provision) {
          context += `  Systems to provision: ${req.systems_to_provision}\n`;
        }
      });
    }

    return context;
  }
}

module.exports = { PromptManager };
