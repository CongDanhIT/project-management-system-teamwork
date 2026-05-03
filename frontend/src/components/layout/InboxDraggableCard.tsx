'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { IInboxDraft } from '@/services/inbox.service';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Trash2, Edit3, Mail, MessageSquare, Plus } from 'lucide-react';

interface InboxDraggableCardProps {
  draft: IInboxDraft;
  onDelete?: (id: string) => void;
  onEdit?: (draft: IInboxDraft) => void;
}

export const InboxDraggableCard: React.FC<InboxDraggableCardProps> = ({ draft, onDelete, onEdit }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: draft._id,
    data: {
      type: 'InboxTask',
      draft,
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <motion.div 
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        "group p-5 bg-white dark:bg-white/5 rounded-[1.5rem] transition-all cursor-grab active:cursor-grabbing relative overflow-hidden touch-none",
        "shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.1)]",
        "dark:shadow-none dark:hover:bg-white/[0.08]",
        isDragging && "opacity-40 scale-95 shadow-none"
      )}
    >
      {/* Detached Shadow V6 simulation - Light Mode only */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4/5 h-1 bg-black/5 blur-md rounded-full group-hover:opacity-100 opacity-0 transition-opacity dark:hidden" />
      
      {/* Accent Point */}
      <div className={cn(
        "absolute top-5 right-5 w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(199,249,100,0.8)]",
        draft.sourceType === 'EMAIL' ? "bg-blue-400" :
        draft.sourceType === 'SLACK' ? "bg-purple-400" :
        "bg-brand-secondary"
      )} />

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 mb-1">
          <div className={cn(
            "flex items-center justify-center w-4 h-4 rounded-md",
            draft.sourceType === 'EMAIL' ? "bg-blue-50 text-blue-500 dark:bg-blue-500/10" :
            draft.sourceType === 'SLACK' ? "bg-purple-50 text-purple-500 dark:bg-purple-500/10" :
            "bg-slate-50 text-slate-400 dark:bg-white/5"
          )}>
            {draft.sourceType === 'EMAIL' ? <Mail className="w-2.5 h-2.5" /> : 
             draft.sourceType === 'SLACK' ? <MessageSquare className="w-2.5 h-2.5" /> : 
             <Plus className="w-2.5 h-2.5" />}
          </div>
          <span className="text-[8px] font-bold text-slate-300 dark:text-slate-500 uppercase tracking-[0.2em] font-sans">
            {new Date(draft.createdAt).toLocaleDateString()}
          </span>
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-sans line-clamp-1 group-hover:text-brand-primary dark:group-hover:text-brand-secondary transition-colors">
          {draft.title}
        </h3>
        {draft.description && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {draft.description}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="absolute top-4 right-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(draft);
          }}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-slate-400 hover:text-brand-primary transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(draft._id);
          }}
          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-full text-slate-400 hover:text-rose-500 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Subtle Hover Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.div>
  );
};
