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
  [TaskStatus.IN_PROGRESS]: 'text-indigo-600',
  [TaskStatus.INREVIEW]: 'text-sky-600',
  [TaskStatus.DONE]: 'text-emerald-600',
  [TaskStatus.COMPLETED]: 'text-emerald-600',
  [TaskStatus.CANCELLED]: 'text-rose-500',
};

const statusBgMap: Record<TaskStatus, string> = {
  [TaskStatus.BACKLOG]: 'bg-slate-100/50',
  [TaskStatus.TODO]: 'bg-slate-100/50',
  [TaskStatus.IN_PROGRESS]: 'bg-indigo-50/50',
  [TaskStatus.INREVIEW]: 'bg-sky-50/50',
  [TaskStatus.DONE]: 'bg-emerald-50/50',
  [TaskStatus.COMPLETED]: 'bg-emerald-50/50',
  [TaskStatus.CANCELLED]: 'bg-rose-50/50',
};

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, title, tasks, allTasks, onTaskClick, onAddTaskClick, isAdminOrOwner }) => {
  const { setNodeRef } = useDroppable({
    id,
    data: {
      type: 'Column',
      columnId: id,
    },
  });

  return (
    <div className="flex flex-col w-[300px] h-full">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <h3 className={cn('text-sm font-bold uppercase tracking-wider', statusColorMap[id])}>
            {title}
          </h3>
          <span className="bg-slate-200/50 text-slate-500 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
            {tasks.length}
          </span>
        </div>
        {isAdminOrOwner && (
          <button 
            className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-400 hover:text-indigo-600"
            onClick={() => onAddTaskClick?.(id)}
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 flex flex-col gap-3 p-3 rounded-2xl transition-colors min-h-[500px]',
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
          <div className="flex-1 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center p-8 opacity-40">
            <span className="text-xs text-slate-400 font-medium">Kéo thả task vào đây</span>
          </div>
        )}
      </div>
    </div>
  );
};
