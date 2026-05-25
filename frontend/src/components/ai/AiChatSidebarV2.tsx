'use client';

import React, { useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Loader2,
  FolderKanban,
  Milestone,
  Users,
  ClipboardList,
  PlusCircle,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import { toast } from 'sonner';
import { AiAgentContext } from '@/services/ai.service';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const TOOL_NAME_MAP: Record<string, string> = {
  getWorkspaceProjects: 'Tra cứu danh sách dự án',
  getProjectPhases: 'Lấy thông tin các giai đoạn',
  getWorkspaceMembers: 'Truy vấn danh sách thành viên',
  getTasksList: 'Tải danh sách công việc',
  createTask: 'Tạo công việc mới',
  updateTask: 'Cập nhật công việc',
};

interface AiChatSidebarV2Props {
  isOpen: boolean;
  onClose: () => void;
  context?: AiAgentContext;
}

export const AiChatSidebarV2: React.FC<AiChatSidebarV2Props> = ({ isOpen, onClose, context = {} }) => {
  const [selectedModel, setSelectedModel] = React.useState('llama-3.3-70b-versatile');

  const MODELS = [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3', provider: 'Groq' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', provider: 'Groq' },
    { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3', provider: 'Together' },
  ];

  const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
    api: `${API_BASE_URL}/ai/v2/chat`,
    credentials: 'include',
    body: {
      context: {
        workspaceId: context?.workspaceId,
        projectId: context?.projectId,
      },
      modelId: selectedModel
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

  const QUICK_ACTIONS = [
    {
      label: 'Tiến độ',
      prompt: 'Hãy kiểm tra và hiển thị tiến độ chi tiết của dự án hiện tại.',
      icon: <TrendingUp className="w-3.5 h-3.5" />,
    },
    {
      label: 'Dự án',
      prompt: 'Hãy liệt kê các dự án hiện có trong Workspace của tôi.',
      icon: <FolderKanban className="w-3.5 h-3.5" />,
    },
    {
      label: 'Giai đoạn',
      prompt: 'Cho tôi xem danh sách các giai đoạn (phases) của dự án này.',
      icon: <Milestone className="w-3.5 h-3.5" />,
    },
    {
      label: 'Thành viên',
      prompt: 'Liệt kê các thành viên trong Workspace để tôi gán công việc.',
      icon: <Users className="w-3.5 h-3.5" />,
    },
    {
      label: 'Xem Tasks',
      prompt: 'Hiển thị danh sách các công việc gần đây của dự án.',
      icon: <ClipboardList className="w-3.5 h-3.5" />,
    },
    {
      label: 'Tạo Task mới',
      prompt: 'Tôi muốn tạo một công việc mới. Hãy hướng dẫn tôi cung cấp thông tin hoặc tạo luôn nếu đủ thông tin.',
      icon: <PlusCircle className="w-3.5 h-3.5" />,
    },
    {
      label: 'Sửa Task',
      prompt: 'Tôi muốn cập nhật trạng thái hoặc thông tin của một công việc. Hãy liệt kê các công việc gần đây của tôi để tôi chọn.',
      icon: <RefreshCw className="w-3.5 h-3.5" />,
    },
  ];

  const handleQuickAction = (prompt: string) => {
    if (isLoading) return;
    append({
      role: 'user',
      content: prompt,
    });
  };

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
    <div className="fixed right-4 bottom-4 top-4 w-[420px] bg-white/85 dark:bg-[#0f0f10]/85 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)] z-50 flex flex-col border border-gray-200/40 dark:border-white/10 rounded-[28px] overflow-hidden transition-all duration-300 transform animate-in slide-in-from-right-12">
      {/* Header - Minimalist Premium Style */}
      <div className="p-5 border-b border-gray-200/30 dark:border-white/5 flex items-center justify-between bg-white/40 dark:bg-black/10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-brand-primary to-teal-500 rounded-xl shadow-md border border-white/20">
            <Sparkles className="w-4.5 h-4.5 text-white fill-white/10" />
          </div>
          <div>
            <h3 className="font-bold text-sm bg-gradient-to-r from-teal-600 to-indigo-600 dark:from-teal-400 dark:to-indigo-400 bg-clip-text text-transparent tracking-tight">AI Agent V2</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-500" />
              <span className="text-[9px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-extrabold">Active Agent</span>
            </div>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all duration-200 hover:rotate-90 group cursor-pointer border border-transparent hover:border-gray-200/50 dark:hover:border-white/5"
        >
          <X className="w-4 h-4 text-gray-400 group-hover:text-gray-800 dark:group-hover:text-white" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-800">
        {messages.map((message) => {
          if (message.role === 'assistant' && !message.content && (!message.toolInvocations || message.toolInvocations.length === 0) && message.id !== 'welcome') {
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
                    ? 'bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary border border-brand-primary/15' 
                    : 'bg-brand-primary text-white shadow shadow-brand-primary/20'
                }`}>
                  {message.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5 fill-white/20" />}
                </div>
                <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-brand-primary to-brand-primary/80 dark:from-teal-600 dark:to-brand-primary text-white rounded-tr-none shadow-brand-primary/5'
                    : 'bg-gray-100/70 dark:bg-white/5 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200/30 dark:border-white/5'
                }`}>
                  {message.content && (
                    <div className="whitespace-pre-wrap break-words prose dark:prose-invert prose-sm max-w-none prose-p:leading-relaxed">
                      {message.content}
                    </div>
                  )}

                  {/* Hiển thị Tool Invocations đang chạy hoặc đã xong */}
                  {message.toolInvocations && message.toolInvocations.length > 0 && (
                    <div className={`space-y-1.5 ${message.content ? 'mt-3 border-t border-gray-200/30 dark:border-white/5 pt-2' : ''}`}>
                      {message.toolInvocations.map((toolInvocation) => {
                        const { toolName, toolCallId, state } = toolInvocation;
                        const friendlyName = TOOL_NAME_MAP[toolName] || toolName;

                        return (
                          <div
                            key={toolCallId}
                            className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-white/5 px-2.5 py-1.5 rounded-xl border border-gray-200/20 dark:border-white/5 shadow-inner"
                          >
                            {state === 'call' ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin text-brand-primary" />
                                <span>Đang chạy: <strong>{friendlyName}</strong></span>
                              </>
                            ) : (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                <span>Đã hoàn thành: <strong>{friendlyName}</strong></span>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex justify-start animate-in fade-in">
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center flex-shrink-0 shadow shadow-brand-primary/20">
                <Sparkles className="w-3.5 h-3.5 text-white fill-white/20" />
              </div>
              <div className="bg-gray-100/70 dark:bg-white/5 p-3 rounded-2xl rounded-tl-none flex items-center gap-2 border border-gray-200/30 dark:border-white/5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-primary" />
                <span className="text-xs text-gray-500 font-medium">Agent đang xử lý...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Model Selector - Segmented Control */}
      <div className="px-5 py-2 flex border-t border-gray-100 dark:border-white/5 bg-white/40 dark:bg-[#121212]/20 backdrop-blur-md">
        <div className="w-full flex p-1 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200/40 dark:border-white/5">
          {MODELS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedModel(m.id)}
              className={`flex-1 py-1.5 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer text-center tracking-wide uppercase ${
                selectedModel === m.id
                  ? 'bg-white dark:bg-white/10 text-brand-primary dark:text-white shadow-sm border border-gray-200/20 dark:border-white/5'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              {m.name.replace("Llama ", "")} <span className="opacity-60 font-semibold text-[8px]">({m.provider})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input & Quick Actions */}
      <form onSubmit={handleSubmit} className="p-5 border-t border-gray-200 dark:border-white/5 bg-white/40 dark:bg-[#121212]/40 backdrop-blur-md flex flex-col gap-3.5">
        {/* Quick Actions / Horizontal Carousel */}
        <div 
          className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => handleQuickAction(action.prompt)}
              disabled={isLoading}
              className="snap-start flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white/70 dark:bg-white/5 hover:bg-brand-primary/10 dark:hover:bg-brand-primary/20 hover:text-brand-primary dark:hover:text-brand-tertiary text-gray-600 dark:text-gray-300 border border-gray-200/30 dark:border-white/5 rounded-xl text-[11px] font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-sm hover:shadow"
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          ))}
        </div>

        <div className="relative group bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-1 focus-within:ring-4 focus-within:ring-brand-primary/10 focus-within:border-brand-primary/30 transition-all shadow-inner">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Bạn muốn tôi thực hiện tác vụ nào?"
            className="w-full bg-transparent text-gray-900 dark:text-white pl-3.5 pr-12 py-2.5 focus:outline-none text-sm font-medium placeholder-gray-400 dark:placeholder-gray-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 disabled:opacity-30 disabled:pointer-events-none transition-all shadow shadow-brand-primary/20 active:scale-95 flex items-center justify-center cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest opacity-60">
          AI Agent V2 • Đa năng & Bảo mật
        </p>
      </form>
    </div>
  );
};
