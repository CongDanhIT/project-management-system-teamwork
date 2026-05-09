import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TaskStatus } from '@/types/task';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

const statusConfig: Record<TaskStatus, { label: string, className: string }> = {
  [TaskStatus.TODO]: { label: 'Cần làm', className: 'bg-slate-100 text-slate-500 hover:bg-slate-200' },
  [TaskStatus.BACKLOG]: { label: 'Chưa xử lý', className: 'bg-slate-50 text-slate-400 hover:bg-slate-100' },
  [TaskStatus.IN_PROGRESS]: { label: 'Đang làm', className: 'bg-brand-primary/10 text-[#035D5B] hover:bg-brand-primary/20' },
  [TaskStatus.INREVIEW]: { label: 'Đang kiểm tra', className: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' },
  [TaskStatus.DONE]: { label: 'Hoàn thành', className: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
  [TaskStatus.COMPLETED]: { label: 'Hoàn thành', className: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
  [TaskStatus.CANCELLED]: { label: 'Đã hủy', className: 'bg-red-50 text-red-700 hover:bg-red-100' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config = statusConfig[status] || statusConfig[TaskStatus.TODO];
  
  return (
    <Badge variant="secondary" className={cn("px-2.5 py-0.5 rounded-sm font-black text-[9px] uppercase tracking-widest border-none shadow-none whitespace-nowrap", config.className, className)}>
      {config.label}
    </Badge>
  );
};
