import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TaskStatus } from '@/types/task';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

const statusConfig: Record<TaskStatus, { label: string, className: string }> = {
  [TaskStatus.TODO]: { label: 'Cần làm', className: 'bg-slate-100 text-slate-500 hover:bg-slate-100/80' },
  [TaskStatus.BACKLOG]: { label: 'Tồn đọng', className: 'bg-slate-100 text-slate-400 hover:bg-slate-100/80' },
  [TaskStatus.IN_PROGRESS]: { label: 'Đang làm', className: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-50/80' },
  [TaskStatus.INREVIEW]: { label: 'Đang duyệt', className: 'bg-sky-50 text-sky-600 hover:bg-sky-50/80' },
  [TaskStatus.DONE]: { label: 'Hoàn thành', className: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-50/80' },
  [TaskStatus.COMPLETED]: { label: 'Đã xong', className: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-50/80' },
  [TaskStatus.CANCELLED]: { label: 'Đã hủy', className: 'bg-red-50 text-red-600 hover:bg-red-50/80' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config = statusConfig[status] || statusConfig[TaskStatus.TODO];
  
  return (
    <Badge variant="secondary" className={cn("px-2 py-0.5 rounded-sm font-semibold text-[10px] uppercase tracking-wider border-none shadow-none", config.className, className)}>
      {config.label}
    </Badge>
  );
};
