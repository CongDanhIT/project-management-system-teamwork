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
      {/* Bỏ backdrop để widget thực sự lơ lửng tách rời */}

      {/* Floating Widget Container */}
      <div
        className={`fixed bottom-[100px] right-6 w-[420px] h-[calc(100vh-160px)] max-h-[700px] z-50 flex flex-col
          bg-white/90 backdrop-blur-2xl border border-white/40 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] 
          rounded-[2.5rem] overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
          ${isOpen 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 translate-y-12 scale-95 pointer-events-none'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-br from-brand-primary to-brand-primary/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm tracking-tight">AI Assistant</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-brand-secondary rounded-full animate-pulse" />
                <p className="text-white/60 text-[10px] uppercase tracking-[0.05em] font-semibold">Ready to help</p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:rotate-90"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Context Badge */}
        {context.projectName && (
          <div className="px-4 py-2 bg-brand-primary/10 border-b border-brand-primary/10">
            <p className="text-xs text-brand-primary font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Đang xem: <span className="font-bold">{context.projectName}</span>
              {context.totalTasks !== undefined && (
                <span className="ml-1 text-brand-secondary/80">({context.totalTasks} tasks)</span>
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
                <div className="w-7 h-7 bg-brand-primary rounded-full flex items-center justify-center mr-2 mt-1 flex-shrink-0 shadow-sm">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-brand-primary text-white rounded-tr-sm shadow-md shadow-brand-primary/10'
                    : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                }`}
              >
                {renderMessage(msg.content)}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 bg-brand-primary rounded-full flex items-center justify-center mr-2 flex-shrink-0 shadow-sm">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-tl-sm">
                <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-6 bg-white/50 backdrop-blur-md border-t border-slate-100/50">
          <div className="flex items-center gap-2 bg-slate-100/80 rounded-[1.5rem] border border-slate-200/50 px-5 py-3 focus-within:bg-white focus-within:border-brand-primary/30 focus-within:ring-4 focus-within:ring-brand-primary/5 transition-all shadow-inner">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask AI anything..."
              disabled={isLoading}
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none font-medium"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 bg-brand-primary disabled:bg-slate-300 rounded-[1rem] flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg shadow-brand-primary/20"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-3 font-medium uppercase tracking-wider opacity-60">
            Press Enter to send • AI can make mistakes
          </p>
        </div>
      </div>
    </>
  );
};
