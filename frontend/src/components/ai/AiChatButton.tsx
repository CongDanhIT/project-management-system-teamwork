'use client';

import React, { useState } from 'react';
import { Bot, X } from 'lucide-react';
import { AiChatSidebar } from './AiChatSidebar';
import { ProjectAiContext } from '@/services/ai.service';

interface AiChatButtonProps {
  context?: ProjectAiContext;
}

export const AiChatButton: React.FC<AiChatButtonProps> = ({ context }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="AI Assistant"
        className={`
          fixed bottom-6 right-6 z-50
          w-14 h-14 rounded-2xl shadow-xl
          flex items-center justify-center
          transition-all duration-300 ease-in-out
          ${isOpen
            ? 'bg-slate-700 hover:bg-slate-800 rotate-0 scale-95'
            : 'bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 hover:scale-110 hover:shadow-indigo-200 hover:shadow-2xl'
          }
        `}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white transition-all" />
        ) : (
          <Bot className="w-6 h-6 text-white transition-all" />
        )}

        {/* Pulse animation khi đóng */}
        {!isOpen && (
          <span className="absolute inline-flex w-full h-full rounded-2xl bg-indigo-400 opacity-30 animate-ping" />
        )}
      </button>

      {/* Chat Sidebar */}
      <AiChatSidebar
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        context={context}
      />
    </>
  );
};
