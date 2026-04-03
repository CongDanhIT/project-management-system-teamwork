'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, MoreHorizontal, Clock } from 'lucide-react';
import { Task, TaskPriority } from '@/types/task';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TaskCardProps {
  task: Task;
  subTasks?: Task[];
  onClick?: () => void;
}

const priorityColors = {
  [TaskPriority.LOW]: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  [TaskPriority.MEDIUM]: 'bg-amber-50 text-amber-600 border-amber-100',
  [TaskPriority.HIGH]: 'bg-red-50 text-red-600 border-red-100',
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, subTasks = [], onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-30 bg-slate-100 border-2 border-dashed border-indigo-300 rounded-xl h-[120px]"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'group glass border-ghost p-5 rounded-2xl shadow-sm hover:shadow-ambient transition-all cursor-grab active:cursor-grabbing transform hover:-translate-y-1',
        'hover:shadow-glow'
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <span className="text-[10px] font-mono font-bold text-slate-400 bg-secondary/50 px-2 py-0.5 rounded-full">
          {task.taskCode}
        </span>
        <button className="text-slate-400 hover:text-brand-primary transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      <h4 className="text-sm font-semibold text-slate-800 line-clamp-2 mb-4 group-hover:text-brand-primary transition-colors leading-relaxed">
        {task.title}
      </h4>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn('text-[10px] px-2 py-0.5 uppercase font-bold border-none rounded-full', priorityColors[task.priority])}
          >
            {task.priority}
          </Badge>
          {task.dueDate && (
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-secondary/30 px-2 py-0.5 rounded-full">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(task.dueDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</span>
            </div>
          )}
        </div>

        {task.assignedTo && (
          <Avatar className="w-7 h-7 border-2 border-white shadow-sm ring-1 ring-slate-100">
            <AvatarImage src={task.assignedTo.profilePicture} alt={task.assignedTo.name} />
            <AvatarFallback className="text-[10px] bg-brand-secondary text-brand-primary font-bold">
              {task.assignedTo.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {subTasks.length > 0 && (
        <div className="mt-5 pt-4 border-t border-divider/40">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Tiến độ con ({subTasks.filter(st => st.status === 'DONE').length}/{subTasks.length})
            </span>
            <div className="flex -space-x-1.5">
               {subTasks.map((st, i) => (
                 <div 
                   key={st._id} 
                   className={cn(
                     "w-2 h-2 rounded-full ring-2 ring-white",
                     st.status === 'DONE' ? "bg-success shadow-glow" : "bg-slate-200"
                   )} 
                   title={st.title}
                 />
               ))}
            </div>
          </div>
          <div className="space-y-1.5">
            {subTasks.slice(0, 2).map(st => (
              <div key={st._id} className="flex items-center gap-2 text-[10px] text-slate-500 truncate">
                 <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", st.status === 'DONE' ? "bg-success" : "bg-accent-workspace/60")} />
                 <span className={cn("truncate", st.status === 'DONE' && "line-through opacity-40")}>{st.title}</span>
              </div>
            ))}
            {subTasks.length > 2 && (
              <div className="text-[9px] text-slate-400 font-bold pl-3.5 italic">
                + {subTasks.length - 2} nhiệm vụ khác
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
