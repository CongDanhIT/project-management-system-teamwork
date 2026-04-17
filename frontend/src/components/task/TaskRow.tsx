import React from 'react';
import { Task } from '@/types/task';
import { StatusBadge } from '../shared/StatusBadge';
import { PriorityBadge } from '../shared/PriorityBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface TaskRowProps {
  task: Task;
  onClick: (task: Task) => void;
}

export const TaskRow: React.FC<TaskRowProps> = ({ task, onClick }) => {
  return (
    <div 
      onClick={() => onClick(task)}
      className="group grid grid-cols-[40px_100px_1fr_140px_140px_140px_80px] items-center gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer border-b border-transparent hover:border-slate-100 dark:hover:border-white/5"
    >
      <div className="flex justify-center items-center">
        <div className="w-4 h-4 rounded-full border-2 border-slate-200 group-hover:border-brand-primary transition-colors flex items-center justify-center">
          <div className={cn(
            "w-1.5 h-1.5 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 bg-brand-primary/100",
            task.status === 'DONE' && 'opacity-100 bg-emerald-500'
          )} />
        </div>
      </div>

      {/* Code */}
      <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 group-hover:text-brand-primary transition-colors">
        {task.taskCode}
      </span>

      {/* Title & Project */}
      <div className="flex-1 min-w-0 flex flex-col">
        <span className={cn(
          "text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-brand-primary transition-colors",
          task.status === 'DONE' && "line-through text-slate-400 dark:text-slate-600"
        )}>
          {task.title}
        </span>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-white/5 group-hover:bg-white dark:group-hover:bg-slate-800 group-hover:border-brand-primary/10 transition-all">
            <span className="text-[10px] grayscale group-hover:grayscale-0 transition-all">{task.projectId?.emoji || '🎯'}</span>
            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate max-w-[120px]">
              {task.projectId?.name || 'Dự án'}
            </span>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="flex justify-center">
        <StatusBadge status={task.status} />
      </div>
      
      {/* Priority */}
      <div className="flex justify-center">
        <PriorityBadge priority={task.priority} />
      </div>

      {/* Due Date */}
      <div className="flex items-center justify-center gap-2 text-slate-400 italic">
        <Calendar className="w-3.5 h-3.5" />
        <span className="text-[11px] font-bold uppercase tracking-wider">
          {task.dueDate ? format(new Date(task.dueDate), 'dd MMM', { locale: vi }) : '--'}
        </span>
      </div>

      {/* [MULTI-ASSIGNEE] Assignee Avatar Stack */}
      <div className="flex justify-end pr-4">
        {task.assignedTo && task.assignedTo.length > 0 ? (
          <div className="flex -space-x-1.5">
            {task.assignedTo.slice(0, 2).map((user) => (
              <Avatar key={user._id} className="w-7 h-7 border-2 border-white dark:border-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-white/5">
                <AvatarImage src={user.profilePicture} />
                <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-[10px] font-bold">
                  {user.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
            {task.assignedTo.length > 2 && (
              <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-800 shadow-sm flex items-center justify-center text-[9px] font-bold text-slate-500 dark:text-slate-400">
                +{task.assignedTo.length - 2}
              </div>
            )}
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300">
              <span className="text-[10px]">?</span>
          </div>
        )}
      </div>
    </div>
  );
};
