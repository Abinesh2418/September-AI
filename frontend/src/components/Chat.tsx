import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { chatAPI } from '../services/api';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputMessage.trim();
    setInputMessage('');
    setLoading(true);

    // Create abort controller for this request
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const response = await chatAPI.sendEnhancedMessage(messageToSend, controller.signal);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response.response || response.output || 'Sorry, I could not process your request.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Request was cancelled by user - do nothing
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: 'Sorry, there was an error processing your message. Please try again.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  };

  const handleStopThinking = () => {
    if (abortController) {
      abortController.abort();
    }
    setLoading(false);
    setAbortController(null);
  };

  const handleSendOrStop = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) {
      handleStopThinking();
    } else {
      handleSendMessage(e);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputMessage(question);
  };

  return (
    <div className="dashboard">
      <div className="container">
        <div className="chat-container">
          <div className="chat-header">
            <div className="chat-header-title">
              <h2>💬 AI Assistant</h2>
            </div>
            <div className="chat-header-actions">
              <button 
                className="btn btn-sm btn-outline"
                onClick={() => {/* TODO: Implement history */}}
              >
                📜 History
              </button>
              <button 
                className="btn btn-sm btn-outline"
                onClick={() => setMessages([])}
              >
                🗑️ Clear
              </button>
            </div>
          </div>
          
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="empty-state">
                <p>👋 Hi! I'm your IT Assistant. How can I help you today?</p>
                <p>Try asking me about:</p>
                <ul style={{ textAlign: 'left', maxWidth: '300px', margin: '10px auto' }}>
                  <li>Creating support tickets</li>
                  <li>Requesting system access</li>
                  <li>Employee onboarding</li>
                  <li>IT policies and procedures</li>
                </ul>
              </div>
            ) : (
              messages.map(message => (
                <div key={message.id} className={`message ${message.type}`}>
                  <div className="message-avatar">
                    {message.type === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className="message-content">
                    {message.content}
                  </div>
                </div>
              ))
            )}
            
            {loading && (
              <div className="message bot">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <em>Thinking...</em>
                </div>
              </div>
            )}
          </div>
          
          <div className="suggested-questions">
            <h4>💡 Try asking:</h4>
            <div className="suggestion-chips">
              <button 
                className="suggestion-chip"
                onClick={() => handleSuggestedQuestion("How many tickets are available?")}
              >
                🎫 How many tickets are available?
              </button>
              <button 
                className="suggestion-chip"
                onClick={() => handleSuggestedQuestion("Show me open tickets")}
              >
                📋 Show me open tickets
              </button>
              <button 
                className="suggestion-chip"
                onClick={() => handleSuggestedQuestion("List access requests")}
              >
                🔑 List access requests
              </button>
              <button 
                className="suggestion-chip"
                onClick={() => handleSuggestedQuestion("Show me pending onboarding")}
              >
                👥 Show me pending onboarding
              </button>
              <button 
                className="suggestion-chip"
                onClick={() => handleSuggestedQuestion("How many people are being onboarded?")}
              >
                📊 How many people are being onboarded?
              </button>
              <button 
                className="suggestion-chip"
                onClick={() => handleSuggestedQuestion("What needs my attention?")}
              >
                ⚠️ What needs my attention?
              </button>
            </div>
          </div>
          
          <div className="chat-input">
            <form onSubmit={handleSendOrStop} className="chat-input-horizontal">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message here..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendOrStop(e);
                  }
                }}
                disabled={loading}
                className="chat-text-input"
              />
              <button 
                type={loading ? "button" : "submit"}
                className={`chat-send-btn ${loading ? 'stop-btn' : ''}`}
                onClick={loading ? (e) => { e.preventDefault(); handleStopThinking(); } : undefined}
                disabled={loading && !abortController}
                title={loading ? 'Stop thinking' : 'Send message'}
              >
                {loading ? '⏹️' : '📤'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;