'use client';

import React, { useEffect, useRef } from 'react';
import { X, Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import { toast } from 'sonner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface AiChatSidebarV2Props {
  isOpen: boolean;
  onClose: () => void;
  context?: {
    workspaceId?: string;
    projectId?: string;
  };
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
        content: `Xin chào! Tôi là **AI Agent V2** ⚡\n\nTôi có khả năng tương tác trực tiếp với dự án của bạn:\n- 📂 Liệt kê dự án & giai đoạn\n- 👥 Quản lý thành viên\n- 📝 Tạo & Cập nhật task trực tiếp\n\nBạn muốn tôi thực hiện tác vụ nào?`,
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
    <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-[#1a1a1a] shadow-2xl z-50 flex flex-col border-l border-gray-200 dark:border-gray-800 transition-all duration-300 transform animate-in slide-in-from-right">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-[#252525] dark:to-[#1e1e1e]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-200 dark:shadow-none">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">AI Agent V2</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Online</span>
            </div>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
        {messages.map((message) => {
          // Ẩn các tin nhắn trống của AI (thường là các bước trung gian khi gọi Tool)
          if (message.role === 'assistant' && !message.content && message.id !== 'welcome') {
            return null;
          }

          return (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
            >
              <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                  message.role === 'user' 
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300' 
                    : 'bg-blue-600 text-white'
                }`}>
                  {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-gray-100 dark:bg-[#252525] text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200/50 dark:border-gray-700/50'
                }`}>
                  <div className="whitespace-pre-wrap break-words prose dark:prose-invert prose-sm max-w-none">
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
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-100 dark:bg-[#252525] p-3 rounded-2xl rounded-tl-none flex items-center gap-2 border border-gray-200/50 dark:border-gray-700/50">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-xs text-gray-500">AI đang suy nghĩ...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1a1a1a]">
        <div className="relative group">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Hỏi AI bất cứ điều gì..."
            className="w-full bg-white dark:bg-[#252525] text-gray-900 dark:text-white pl-4 pr-12 py-3 rounded-xl border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm group-hover:border-gray-300 dark:group-hover:border-gray-700"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all shadow-md active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-2 text-[10px] text-center text-gray-400">
          AI Agent có thể thực thi các lệnh trực tiếp trên dự án của bạn
        </p>
      </form>
    </div>
  );
};
