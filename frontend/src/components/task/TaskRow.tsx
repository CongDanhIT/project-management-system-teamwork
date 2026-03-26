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
      className="group flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer border-b border-transparent hover:border-slate-100"
    >
      {/* Checkbox placeholder / Status Dot */}
      <div className="w-4 h-4 rounded-full border-2 border-slate-200 group-hover:border-indigo-400 transition-colors flex items-center justify-center">
        <div className={cn(
          "w-1.5 h-1.5 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 bg-indigo-500",
          task.status === 'DONE' && 'opacity-100 bg-emerald-500'
        )} />
      </div>

      {/* Code */}
      <span className="text-xs font-mono font-bold text-slate-400 group-hover:text-indigo-600 transition-colors w-20">
        {task.taskCode}
      </span>

      {/* Title & Project */}
      <div className="flex-1 min-w-0 flex flex-col">
        <span className={cn(
          "text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors",
          task.status === 'DONE' && "line-through text-slate-400"
        )}>
          {task.title}
        </span>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-slate-100/50 border border-slate-200/40 group-hover:bg-white group-hover:border-indigo-100 transition-all">
            <span className="text-[10px] grayscale group-hover:grayscale-0 transition-all">{task.projectId?.emoji || '🎯'}</span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider truncate max-w-[120px]">
              {task.projectId?.name || 'Dự án'}
            </span>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-6 w-[450px] justify-end">
        <StatusBadge status={task.status} />
        
        <div className="w-32 flex justify-start">
          <PriorityBadge priority={task.priority} />
        </div>

        {/* Due Date */}
        <div className="flex items-center gap-2 w-32 text-slate-400 italic">
          <Calendar className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold uppercase tracking-wider">
            {task.dueDate ? format(new Date(task.dueDate), 'dd MMM', { locale: vi }) : '--'}
          </span>
        </div>

        {/* Assignee */}
        <div className="w-8 flex justify-end">
          {task.assignedTo ? (
            <Avatar className="w-7 h-7 border-2 border-white shadow-sm ring-1 ring-slate-200">
              <AvatarImage src={task.assignedTo.profilePicture} />
              <AvatarFallback className="bg-indigo-50 text-indigo-600 text-[10px] font-bold">
                {task.assignedTo.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-7 h-7 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                <span className="text-[10px]">?</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
