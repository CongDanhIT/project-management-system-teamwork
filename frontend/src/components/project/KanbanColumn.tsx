'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Task, TaskStatus } from '@/types/task';
import { TaskCard } from './TaskCard';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  allTasks: Task[];
  onTaskClick?: (task: Task) => void;
  onAddTaskClick?: (status: TaskStatus) => void;
  isAdminOrOwner?: boolean;
}

const statusColorMap: Record<TaskStatus, string> = {
  [TaskStatus.BACKLOG]: 'text-slate-500',
  [TaskStatus.TODO]: 'text-slate-600',
  [TaskStatus.IN_PROGRESS]: 'text-brand-primary',
  [TaskStatus.INREVIEW]: 'text-brand-primary',
  [TaskStatus.DONE]: 'text-emerald-600',
  [TaskStatus.COMPLETED]: 'text-emerald-600',
  [TaskStatus.CANCELLED]: 'text-rose-500',
};

const statusBgMap: Record<TaskStatus, string> = {
  [TaskStatus.BACKLOG]: 'bg-slate-100/40 dark:bg-slate-900/20',
  [TaskStatus.TODO]: 'bg-slate-100/40 dark:bg-slate-900/20',
  [TaskStatus.IN_PROGRESS]: 'bg-brand-primary/5 dark:bg-brand-primary/5',
  [TaskStatus.INREVIEW]: 'bg-brand-primary/5 dark:bg-brand-primary/5',
  [TaskStatus.DONE]: 'bg-emerald-50/40 dark:bg-emerald-900/10',
  [TaskStatus.COMPLETED]: 'bg-emerald-50/40 dark:bg-emerald-900/10',
  [TaskStatus.CANCELLED]: 'bg-rose-50/40 dark:bg-rose-900/10',
};

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, title, tasks, allTasks, onTaskClick, onAddTaskClick, isAdminOrOwner }) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'Column',
      columnId: id,
    },
  });

  return (
    <div 
      ref={setNodeRef}
      className="flex flex-col w-[310px] h-full group shrink-0"
    >
      <div className="flex items-center justify-between mb-4 px-3">
        <div className="flex items-center gap-2">
          <div className={cn("w-1.5 h-4 rounded-full", statusColorMap[id].replace('text-', 'bg-'))} />
          <h3 className={cn('text-[13px] font-bold uppercase tracking-widest opacity-80', statusColorMap[id])}>
            {title}
          </h3>
          <span className="bg-white/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm border border-slate-100 dark:border-slate-700">
            {tasks.length}
          </span>
        </div>
        {isAdminOrOwner && (
          <button 
            className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all text-slate-400 hover:text-brand-primary shadow-sm opacity-0 group-hover:opacity-100 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            onClick={() => onAddTaskClick?.(id)}
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      <div
        className={cn(
          'flex-1 flex flex-col gap-3 p-3 rounded-[32px] transition-all duration-300 min-h-[500px] backdrop-blur-md relative',
          'border-2 border-dashed',
          isOver 
            ? 'border-brand-primary/50 bg-brand-primary/10 shadow-[0_0_40px_rgba(13,148,136,0.15)] scale-[1.02]' 
            : 'border-transparent bg-slate-100/40 dark:bg-white/5',
          'dark:border-white/5',
          'shadow-[inset_0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_4px_24px_rgba(0,0,0,0.3)]',
          statusBgMap[id]
        )}
      >
        <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => {
            const subTasks = allTasks.filter(t => t.parentId === task._id);
            return (
              <TaskCard 
                key={task._id} 
                task={task} 
                subTasks={subTasks}
                onClick={() => onTaskClick?.(task)} 
              />
            );
          })}
        </SortableContext>
        
        {tasks.length === 0 && (
          <div className="flex-1 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[24px] flex items-center justify-center p-8 opacity-40 bg-slate-50/50 dark:bg-white/5 pointer-events-none">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest pointer-events-none">
              Kéo thả task vào đây
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
