'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, Sparkles } from 'lucide-react';
import { sendAiChatMessage, ChatMessage, ProjectAiContext } from '@/services/ai.service';

interface AiChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  context?: ProjectAiContext;
}

export const AiChatSidebar: React.FC<AiChatSidebarProps> = ({ isOpen, onClose, context = {} }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
      if (messages.length === 0) {
        setMessages([{
          role: 'assistant',
          content: `Xin chào! Tôi là **AI Assistant** của TeamFlow ✨\n\nTôi có thể giúp bạn:\n- Trả lời câu hỏi về dự án & tiến độ\n- Tư vấn quản lý công việc\n- Gợi ý cách phân chia task hiệu quả\n\nBạn muốn hỏi gì không?`,
        }]);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const userMessage = input.trim();
    if (!userMessage || isLoading) return;

    const newUserMsg: ChatMessage = { role: 'user', content: userMessage };
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      console.log("[AI-Chat] Gửi tin nhắn:", { userMessage, context });
      // Lấy history KHÔNG bao gồm message welcome ban đầu
      const historyForApi = updatedMessages.slice(1);
      const reply = await sendAiChatMessage(userMessage, historyForApi, context);
      console.log("[AI-Chat] Phản hồi từ AI:", reply);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (error: any) {
      console.error("[AI-Chat] Lỗi khi gọi AI:", error.response?.data || error.message);
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Parse markdown bold (**text**) và xuống dòng
  const renderMessage = (content: string) => {
    return content.split('\n').map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <span key={i}>
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
          )}
          {i < content.split('\n').length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px]"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-[400px] z-50 flex flex-col
          bg-white/95 backdrop-blur-xl border-l border-slate-200/60 shadow-2xl
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gradient-to-r from-indigo-600 to-violet-600">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">AI Assistant</h3>
              <p className="text-indigo-200 text-xs">Powered by Groq</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Context Badge */}
        {context.projectName && (
          <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100">
            <p className="text-xs text-indigo-600 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Đang xem: <span className="font-bold">{context.projectName}</span>
              {context.totalTasks !== undefined && (
                <span className="ml-1 text-indigo-400">({context.totalTasks} tasks)</span>
              )}
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md shadow-indigo-100'
                    : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                }`}
              >
                {renderMessage(msg.content)}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-tl-sm">
                <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-2 bg-slate-50 rounded-2xl border border-slate-200 px-4 py-2 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Hỏi AI về dự án của bạn..."
              disabled={isLoading}
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="w-8 h-8 bg-indigo-600 disabled:bg-slate-300 rounded-xl flex items-center justify-center transition-colors hover:bg-indigo-700"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
          <p className="text-center text-xs text-slate-400 mt-2">Enter để gửi • AI có thể mắc lỗi</p>
        </div>
      </div>
    </>
  );
};
