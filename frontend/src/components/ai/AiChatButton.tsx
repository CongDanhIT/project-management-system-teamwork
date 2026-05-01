'use client';

import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { AiChatSidebar } from './AiChatSidebar';
import { ProjectAiContext } from '@/services/ai.service';

interface AiChatButtonProps {
  context?: ProjectAiContext;
}

export const AiChatButton: React.FC<AiChatButtonProps> = ({ context }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button - TeamFlow Integrated Edition */}
      <div className="fixed bottom-8 right-8 z-50 group">
        {/* Subtle Ambient Glow */}
        {!isOpen && (
          <div className="absolute inset-0 bg-brand-primary rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
        )}
        
        {/* Main Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          title="AI Assistant"
          className={`
            relative w-14 h-14 rounded-2xl shadow-xl
            flex items-center justify-center
            transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
            border border-slate-200 dark:border-white/10
            ${isOpen
              ? 'bg-slate-800 dark:bg-slate-950 rotate-90 scale-90 text-white'
              : 'bg-white dark:bg-slate-900 hover:scale-110 active:scale-95'
            }
          `}
        >
          {/* Subtle Satin effect for white mode */}
          {!isOpen && (
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-slate-50 to-transparent dark:from-white/5 pointer-events-none" />
          )}

          <div className="relative z-10">
            {isOpen ? (
              <X className="w-6 h-6 text-white transition-all" />
            ) : (
              <div className="flex items-center justify-center">
                <Sparkles 
                  className="w-6 h-6 text-brand-primary dark:text-brand-secondary fill-brand-primary/10 dark:fill-brand-secondary/10 transition-all duration-500" 
                />
              </div>
            )}
          </div>
        </button>

        {/* Hover Label - Sleek Minimalist Tooltip */}
        {!isOpen && (
          <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-brand-primary text-brand-secondary text-[10px] font-bold uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 pointer-events-none whitespace-nowrap border border-brand-secondary/20 shadow-xl">
            Ask AI Assistant
          </div>
        )}
      </div>

      {/* Chat Sidebar */}
      <AiChatSidebar
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        context={context}
      />
    </>
  );
};
