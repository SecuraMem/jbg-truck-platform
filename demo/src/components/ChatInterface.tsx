import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Loader2,
  MessageSquare,
  Bot,
  User,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import type { ChatMessage, Truck, Load } from '../types';
import { sendChatMessage } from '../services/api';

interface ChatInterfaceProps {
  trucks: Truck[];
  loads: Load[];
  chatHistory: ChatMessage[];
  onNewMessage: (message: ChatMessage) => void;
}

const SUGGESTED_QUESTIONS = [
  "Which trucks need the most help this week?",
  "What if Truck T-001 is unavailable tomorrow?",
  "How can we improve the fairness score?",
  "Show me trucks in Kingston area",
  "What's the best truck for a 15-ton load to Montego Bay?",
];

export function ChatInterface({
  trucks,
  loads,
  chatHistory,
  onNewMessage
}: ChatInterfaceProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSend = async (text?: string) => {
    const messageText = text || message.trim();
    if (!messageText || isLoading) return;

    setMessage('');
    setError(null);

    // Add user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };
    onNewMessage(userMessage);

    setIsLoading(true);

    try {
      const response = await sendChatMessage(
        messageText,
        trucks,
        loads,
        chatHistory
      );

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };
      onNewMessage(assistantMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get response');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-jbg-primary to-jbg-secondary">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Bot className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">JBG Scheduling Assistant</h2>
            <p className="text-sm text-blue-100">Powered by Claude AI</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="p-4 bg-jbg-light rounded-full mb-4">
              <Sparkles className="text-jbg-primary" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              How can I help you today?
            </h3>
            <p className="text-gray-600 mb-6 max-w-md">
              Ask me about truck schedules, fairness metrics, "what if" scenarios,
              or get explanations about scheduling decisions.
            </p>

            {/* Suggested Questions */}
            <div className="space-y-2 w-full max-w-md">
              <p className="text-sm text-gray-500 font-medium">Try asking:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTED_QUESTIONS.slice(0, 3).map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="px-3 py-2 bg-gray-100 hover:bg-jbg-light text-gray-700 text-sm rounded-lg transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`
                  flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                  ${msg.role === 'user' ? 'bg-jbg-primary' : 'bg-gray-200'}
                `}>
                  {msg.role === 'user' ? (
                    <User className="text-white" size={16} />
                  ) : (
                    <Bot className="text-gray-600" size={16} />
                  )}
                </div>

                {/* Message Bubble */}
                <div className={`
                  max-w-[80%] px-4 py-3 rounded-2xl
                  ${msg.role === 'user'
                    ? 'bg-jbg-primary text-white rounded-tr-sm'
                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                  }
                `}>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {msg.content}
                  </p>
                  <p className={`
                    text-xs mt-1
                    ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-500'}
                  `}>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <Bot className="text-gray-600" size={16} />
                </div>
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="animate-spin" size={16} />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mb-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="text-red-500 flex-shrink-0" size={16} />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Quick Actions (when there's conversation) */}
      {chatHistory.length > 0 && !isLoading && (
        <div className="px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {SUGGESTED_QUESTIONS.slice(0, 3).map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="flex-shrink-0 px-3 py-1.5 bg-gray-100 hover:bg-jbg-light text-gray-600 text-xs rounded-full transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <MessageSquare
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about scheduling, fairness, or what-if scenarios..."
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-jbg-primary focus:border-transparent disabled:bg-gray-100"
            />
          </div>
          <button
            onClick={() => handleSend()}
            disabled={!message.trim() || isLoading}
            className={`
              px-4 rounded-xl transition-colors flex items-center gap-2
              ${message.trim() && !isLoading
                ? 'bg-jbg-primary text-white hover:bg-jbg-dark'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
