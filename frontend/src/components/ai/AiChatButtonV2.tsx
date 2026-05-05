'use client';

import React, { useState } from 'react';
import { Bot, Sparkles, X } from 'lucide-react';
import { AiChatSidebarV2 } from './AiChatSidebarV2';
import { AiAgentContext } from '@/services/ai.service';

interface AiChatButtonV2Props {
  context?: AiAgentContext;
}

export const AiChatButtonV2: React.FC<AiChatButtonV2Props> = ({ context }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button V2 - AI Agent Edition */}
      <div className="fixed bottom-28 right-8 z-50 group">
        {/* Intense Pulsing Glow for V2 */}
        {!isOpen && (
          <div className="absolute inset-0 bg-brand-primary rounded-2xl blur-2xl opacity-30 group-hover:opacity-60 animate-pulse transition-opacity duration-500" />
        )}
        
        {/* Main Button V2 */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          title="AI Agent V2"
          className={`
            relative w-14 h-14 rounded-2xl shadow-2xl
            flex items-center justify-center
            transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
            border-2 border-white/20 dark:border-white/10
            ${isOpen
              ? 'bg-black rotate-90 scale-90 text-white'
              : 'bg-gradient-to-br from-brand-primary via-brand-primary to-purple-600 hover:scale-110 active:scale-95'
            }
          `}
        >
          {/* Shine effect */}
          {!isOpen && (
            <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-50 pointer-events-none overflow-hidden">
               <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/30 to-transparent rotate-45 animate-[shine_3s_infinite]" />
            </div>
          )}

          <div className="relative z-10">
            {isOpen ? (
              <X className="w-6 h-6 text-white transition-all" />
            ) : (
              <div className="flex flex-col items-center justify-center">
                <Sparkles className="w-6 h-6 text-white fill-white/20 animate-pulse" />
                <span className="text-[7px] font-black text-brand-secondary absolute -bottom-2">AGENT</span>
              </div>
            )}
          </div>
        </button>

        {/* Hover Label */}
        {!isOpen && (
          <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 pointer-events-none whitespace-nowrap border border-white/10 shadow-2xl">
            Launch AI Agent V2
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shine {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(100%) rotate(45deg); }
        }
      `}</style>

      {/* Chat Sidebar V2 */}
      <AiChatSidebarV2
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        context={context}
      />
    </>
  );
};
