import React from 'react';
import { TaskPriority } from '@/types/task';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface PriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

const priorityConfig: Record<TaskPriority, { label: string, dotClass: string }> = {
  [TaskPriority.LOW]: { label: 'THẤP', dotClass: 'bg-emerald-500' },
  [TaskPriority.MEDIUM]: { label: 'TRUNG BÌNH', dotClass: 'bg-amber-500' },
  [TaskPriority.HIGH]: { label: 'CAO', dotClass: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' },
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className }) => {
  const config = priorityConfig[priority] || priorityConfig[TaskPriority.MEDIUM];
 
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dotClass)} />
      <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tighter whitespace-nowrap">
        {config.label}
      </span>
    </div>
  );
};
