import React from 'react';
import { TaskPriority } from '@/types/task';
import { cn } from '@/lib/utils';
import { AlertCircle, ArrowDown, ArrowUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

const priorityConfig: Record<TaskPriority, { label: string, color: string, bg: string, icon: any }> = {
  [TaskPriority.LOW]: { label: 'Thấp', color: 'text-emerald-500', bg: 'bg-emerald-50', icon: ArrowDown },
  [TaskPriority.MEDIUM]: { label: 'Trung bình', color: 'text-amber-500', bg: 'bg-amber-50', icon: AlertCircle },
  [TaskPriority.HIGH]: { label: 'Cao', color: 'text-red-500', bg: 'bg-red-50', icon: ArrowUp },
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className }) => {
  const config = priorityConfig[priority] || priorityConfig[TaskPriority.MEDIUM];
  const Icon = config.icon;

  return (
    <Badge variant="secondary" className={cn("px-2 py-0.5 rounded-sm font-semibold text-[10px] uppercase tracking-wider border-none shadow-none gap-1.5", config.color, config.bg, className)}>
      <Icon className="w-3 h-3 stroke-[3px]" />
      <span>{config.label}</span>
    </Badge>
  );
};
