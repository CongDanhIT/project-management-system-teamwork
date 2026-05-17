'use client';

import React, { useEffect, useRef } from 'react';
import { X, Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import { toast } from 'sonner';
import { AiAgentContext } from '@/services/ai.service';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface AiChatSidebarV2Props {
  isOpen: boolean;
  onClose: () => void;
  context?: AiAgentContext;
}

export const AiChatSidebarV2: React.FC<AiChatSidebarV2Props> = ({ isOpen, onClose, context = {} }) => {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: `${API_BASE_URL}/ai/v2/chat`,
    credentials: 'include',
    body: {
      context: {
        workspaceId: context?.workspaceId,
        projectId: context?.projectId,
      }
    },
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: `Xin chào! Tôi là **AI Agent V2** ⚡\n\nTôi đã sẵn sàng hỗ trợ bạn quản lý dòng chảy công việc với các tính năng:\n- 📂 **Dự án & Lộ trình**: Liệt kê dự án và các giai đoạn (Phases).\n- 👥 **Thành viên**: Tra cứu và gán việc cho đồng nghiệp.\n- 🔍 **Tra cứu thông minh**: Liệt kê công việc theo trạng thái hoặc **từng thành viên**.\n- 📝 **Thao tác trực tiếp**: Tạo mới và Cập nhật Task ngay tại đây.\n\nTôi có thể giúp gì cho bạn ngay bây giờ?`,
      }
    ],
    onResponse: (response) => {
      if (!response.ok) {
        console.error('[AiChatV2] Server responded with error:', response.status, response.statusText);
        toast.error('Lỗi kết nối máy chủ AI');
      } else {
        console.log('[AiChatV2] Bắt đầu nhận stream phản hồi...');
      }
    },
    onError: (error) => {
      console.group('[AiChatV2] Lỗi AI Stream');
      console.error('Message:', error.message);
      console.error('Error Object:', error);
      console.groupEnd();
      toast.error('Đã xảy ra lỗi trong quá trình xử lý tin nhắn. Vui lòng kiểm tra console.');
    },
    onFinish: (message) => {
      console.log('[AiChatV2] Hoàn tất phản hồi:', message.id);
    }
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[400px] bg-white/95 dark:bg-[#121212]/95 backdrop-blur-xl shadow-2xl z-50 flex flex-col border-l border-gray-200/50 dark:border-white/5 transition-all duration-300 transform animate-in slide-in-from-right">
      {/* Header - V1 Premium Style */}
      <div className="p-6 border-b border-gray-200/50 dark:border-white/5 flex items-center justify-between bg-gradient-to-br from-brand-primary to-brand-primary/90 dark:from-slate-900 dark:to-brand-primary/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-xl shadow-inner border border-white/30 dark:border-white/10">
            <Sparkles className="w-5 h-5 text-white fill-white/20" />
          </div>
          <div>
            <h3 className="font-bold text-white tracking-tight">AI Agent V2</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-brand-secondary rounded-full animate-pulse" />
              <span className="text-[10px] text-white/70 uppercase tracking-widest font-bold">Agentic Mode</span>
            </div>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition-all hover:rotate-90 group"
        >
          <X className="w-5 h-5 text-white/70 group-hover:text-white" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-800">
        {messages.map((message) => {
          if (message.role === 'assistant' && !message.content && message.id !== 'welcome') {
            return null;
          }

          return (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-3`}
            >
              <div className={`flex gap-3 max-w-[88%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                  message.role === 'user' 
                    ? 'bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary' 
                    : 'bg-brand-primary text-white'
                }`}>
                  {message.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4 fill-white/20" />}
                </div>
                <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  message.role === 'user'
                    ? 'bg-brand-primary text-white rounded-tr-none shadow-brand-primary/10'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200/50 dark:border-white/5'
                }`}>
                  <div className="whitespace-pre-wrap break-words prose dark:prose-invert prose-sm max-w-none prose-p:leading-relaxed">
                    {message.content}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex justify-start animate-in fade-in">
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white fill-white/20" />
              </div>
              <div className="bg-gray-100 dark:bg-white/5 p-3 rounded-2xl rounded-tl-none flex items-center gap-2 border border-gray-200/50 dark:border-white/5">
                <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
                <span className="text-xs text-gray-500 font-medium">Agent đang xử lý...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - V1 Style */}
      <form onSubmit={handleSubmit} className="p-6 border-t border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-black/20">
        <div className="relative group bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 p-1.5 focus-within:ring-4 focus-within:ring-brand-primary/10 transition-all shadow-inner">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Bạn muốn tôi thực hiện tác vụ nào?"
            className="w-full bg-transparent text-gray-900 dark:text-white pl-3 pr-12 py-2.5 focus:outline-none text-sm font-medium"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 bg-brand-primary text-white rounded-xl hover:bg-brand-primary/90 disabled:opacity-30 transition-all shadow-lg shadow-brand-primary/20 active:scale-95 flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-3 text-[10px] text-center text-gray-400 font-medium uppercase tracking-widest opacity-60">
          AI Agent V2 • Đa năng & Bảo mật
        </p>
      </form>
    </div>
  );
};
