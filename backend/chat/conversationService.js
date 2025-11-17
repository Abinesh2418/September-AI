const fs = require('fs');
const path = require('path');

class ConversationService {
  constructor() {
    this.conversationsFile = path.join(__dirname, '..', 'data', 'conversations.json');
    this.ensureConversationsFile();
  }

  ensureConversationsFile() {
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    if (!fs.existsSync(this.conversationsFile)) {
      fs.writeFileSync(this.conversationsFile, JSON.stringify([], null, 2));
    }
  }

  readConversations() {
    try {
      const data = fs.readFileSync(this.conversationsFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading conversations file:', error);
      return [];
    }
  }

  writeConversations(conversations) {
    try {
      fs.writeFileSync(this.conversationsFile, JSON.stringify(conversations, null, 2));
    } catch (error) {
      console.error('Error writing conversations file:', error);
      throw error;
    }
  }

  // Store a conversation message
  saveMessage(userId, message, role, metadata = {}) {
    const conversations = this.readConversations();
    const newMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      message: message,
      role: role,
      metadata: metadata,
      created_at: new Date().toISOString()
    };
    
    conversations.push(newMessage);
    this.writeConversations(conversations);
    return newMessage.id;
  }

  // Get conversation history for a user
  getConversationHistory(userId, limit = 50) {
    const conversations = this.readConversations();
    const userConversations = conversations
      .filter(conv => conv.user_id === userId || conv.user_id === String(userId))
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .slice(-limit);
    
    return userConversations;
  }

  // Get recent conversation context (last N messages)
  getRecentContext(userId, limit = 5) {
    const history = this.getConversationHistory(userId, limit);
    return history.map(h => `${h.role}: ${h.message}`).join('\n');
  }

  // Clear conversation history for a user
  clearHistory(userId) {
    const conversations = this.readConversations();
    const filteredConversations = conversations.filter(conv => 
      conv.user_id !== userId && conv.user_id !== String(userId)
    );
    this.writeConversations(filteredConversations);
    return { changes: conversations.length - filteredConversations.length };
  }

  // Get conversation statistics
  getStats(userId) {
    const conversations = this.readConversations();
    const userConversations = conversations.filter(conv => 
      conv.user_id === userId || conv.user_id === String(userId)
    );
    
    if (userConversations.length === 0) {
      return {
        total_messages: 0,
        days_active: 0,
        last_message: null
      };
    }

    const dates = new Set();
    let lastMessage = userConversations[0].created_at;
    
    userConversations.forEach(conv => {
      const date = conv.created_at.split('T')[0];
      dates.add(date);
      if (new Date(conv.created_at) > new Date(lastMessage)) {
        lastMessage = conv.created_at;
      }
    });

    return {
      total_messages: userConversations.length,
      days_active: dates.size,
      last_message: lastMessage
    };
  }
}

module.exports = new ConversationService();
