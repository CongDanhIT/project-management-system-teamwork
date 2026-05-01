'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, MoreHorizontal, Clock, User, MessageCircle } from 'lucide-react';
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
  [TaskPriority.LOW]: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  [TaskPriority.MEDIUM]: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  [TaskPriority.HIGH]: 'bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, subTasks = [], onClick }) => {
  const [isHovered, setIsHovered] = React.useState(false);
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
    transition: isDragging ? transition : 'transform 200ms cubic-bezier(0.2, 0, 0, 1)',
    transform: isDragging
      ? CSS.Translate.toString(transform)
      : `${CSS.Translate.toString(transform) || 'translate(0,0)'} ${isHovered ? 'translateY(-4px)' : 'translateY(0)'}`,
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-30 bg-slate-100 border-2 border-dashed border-brand-secondary/50 rounded-xl h-[120px]"
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'group bg-white dark:bg-surface-primary backdrop-blur-xl border border-border-subtle p-5 rounded-2xl cursor-pointer transition-all duration-200 shadow-depth-1',
        'shadow-glow-combined hover:shadow-glow-combined-strong'
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <span className="text-[10px] font-mono font-bold text-slate-400 bg-secondary/50 px-2 py-0.5 rounded-full">
          {task.taskCode}
        </span>
        <button className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 mb-3 leading-relaxed">
        {task.title}
      </h4>

      {/* Tags Row */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {task.tags.map((tag) => (
            <span
              key={tag._id}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border border-divider/10"
              style={{
                backgroundColor: `${tag.color}10`,
                color: tag.color,
                borderColor: `${tag.color}25`,
              }}
            >
              <span 
                className="w-1.5 h-1.5 rounded-full shadow-sm" 
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
            </span>
          ))}
        </div>
      )}

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
          {task.userCommentCount != null && task.userCommentCount > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-brand-primary/70 bg-brand-primary/5 px-2 py-0.5 rounded-full" title={`${task.userCommentCount} bình luận`}>
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="font-semibold">{task.userCommentCount}</span>
            </div>
          )}
        </div>

        {/* [MULTI-ASSIGNEE] Avatar Stack or Placeholder */}
        <div className="flex -space-x-2">
          {task.assignedTo && task.assignedTo.length > 0 ? (
            <>
              {task.assignedTo.slice(0, 3).map((user) => (
                <Avatar key={user._id} className="w-7 h-7 border-2 border-white shadow-sm ring-1 ring-slate-100">
                  <AvatarImage src={user.profilePicture} alt={user.name} />
                  <AvatarFallback className="text-[10px] bg-brand-primary/10 text-brand-primary font-bold">
                    {user.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {task.assignedTo.length > 3 && (
                <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-[9px] font-bold text-slate-500">
                  +{task.assignedTo.length - 3}
                </div>
              )}
            </>
          ) : (
            <div className="w-7 h-7 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 group-hover:border-brand-primary/30 group-hover:text-brand-primary/50 transition-colors duration-300">
              <User className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>

      {subTasks.length > 0 && (
        <div className="mt-5 pt-4 border-t border-divider/40">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Tiến độ con ({subTasks.filter(st => st.status === 'DONE').length}/{subTasks.length})
            </span>
            <div className="flex -space-x-1.5">
              {subTasks.map((st, i) => (
                <div
                  key={st._id}
                  className={cn(
                    "w-2 h-2 rounded-full ring-2 ring-white dark:ring-slate-900",
                    st.status === 'DONE' ? "bg-success shadow-glow" : "bg-slate-200 dark:bg-slate-800"
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
