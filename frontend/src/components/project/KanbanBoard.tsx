'use client';

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
  closestCorners,
  useDndMonitor,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import { Task, TaskStatus } from '@/types/task';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { taskService } from '@/services/task.service';
import { toast } from "sonner";
import { Loader2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface KanbanBoardProps {
  workspaceId: string;
  projectId: string;
  phaseId?: string;
  onTaskClick?: (task: Task) => void;
  onAddTaskClick?: (status: TaskStatus) => void;
  isAdminOrOwner?: boolean;
  isProjectCompleted?: boolean;
}

const defaultColumns: { id: TaskStatus; title: string }[] = [
  { id: TaskStatus.TODO, title: 'Cần làm' },
  { id: TaskStatus.IN_PROGRESS, title: 'Đang làm' },
  { id: TaskStatus.INREVIEW, title: 'Đang duyệt' },
  { id: TaskStatus.DONE, title: 'Hoàn thành' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  workspaceId, 
  projectId, 
  phaseId,
  onTaskClick, 
  onAddTaskClick, 
  isAdminOrOwner, 
  isProjectCompleted 
}) => {
  const queryClient = useQueryClient();
  const { data: fetchedTasks, isLoading: loading } = useQuery({
    queryKey: ['project-tasks', workspaceId, projectId, phaseId],
    queryFn: () => taskService.getProjectTasks(workspaceId, projectId, { pageSize: 1000, phaseId }),
    enabled: !!workspaceId && !!projectId,
  });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  useDndMonitor({
    onDragStart: (event: DragStartEvent) => {
      if (isProjectCompleted) return;
      if (event.active.data.current?.type === 'Task') {
        setActiveTask(event.active.data.current.task);
      }
    },
    onDragOver: (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id;
      const overId = over.id;

      if (activeId === overId) return;

      const isActiveATask = active.data.current?.type === 'Task';
      if (!isActiveATask) return;

      const isOverATask = over.data.current?.type === 'Task';
      const isOverAColumn = over.data.current?.type === 'Column';

      // Determine the destination status
      let newStatus: TaskStatus | null = null;
      if (isOverAColumn) {
        newStatus = overId as TaskStatus;
      } else if (isOverATask) {
        newStatus = over.data.current?.task?.status as TaskStatus;
      } else if (Object.values(TaskStatus).includes(overId as any)) {
        // Fallback for direct status ID hits
        newStatus = overId as TaskStatus;
      }

      if (!newStatus) return;

      setTasks((prevTasks) => {
        const activeIndex = prevTasks.findIndex((t) => t._id === activeId);
        if (activeIndex === -1) return prevTasks;

        const updatedTasks = [...prevTasks];
        const currentTask = updatedTasks[activeIndex];

        // Update status if it changed
        if (currentTask.status !== newStatus) {
          updatedTasks[activeIndex] = {
            ...currentTask,
            status: newStatus,
          };
        }

        // Reorder tasks if hovering over another task
        if (isOverATask) {
          const overIndex = updatedTasks.findIndex((t) => t._id === overId);
          if (overIndex !== -1 && activeIndex !== overIndex) {
            return arrayMove(updatedTasks, activeIndex, overIndex);
          }
        }

        return updatedTasks;
      });
    },
    onDragEnd: async (event: DragEndEvent) => {
      const { active, over } = event;
      const dragStartedTaskSnapshot = activeTask;
      setActiveTask(null);

      if (!over || active.data.current?.type !== 'Task') return;

      const taskId = active.id as string;
      const task = tasks.find(t => t._id === taskId);
      
      if (task && dragStartedTaskSnapshot) {
        const originalStatus = dragStartedTaskSnapshot.status;
        const targetStatus = task.status;

        if (originalStatus === targetStatus) return;

        try {
          const updatedTaskFromApi = await taskService.updateTaskStatus(workspaceId, projectId, taskId, targetStatus);
          
          // 1. Cập nhật cache cho Project Tasks (Dùng cho Board hiện tại)
          queryClient.setQueryData(['project-tasks', workspaceId, projectId], (oldData: any) => {
            if (!oldData || !oldData.tasks) return oldData;
            return {
              ...oldData,
              tasks: oldData.tasks.map((t: any) => t._id === taskId ? { ...t, ...updatedTaskFromApi } : t)
            };
          });

          // 2. Cập nhật cache Kanban chung (nếu có - workspace-tasks)
          queryClient.setQueryData(['workspace-tasks', workspaceId], (oldData: any) => {
            if (!oldData || !oldData.tasks) return oldData;
            return {
              ...oldData,
              tasks: oldData.tasks.map((t: any) => t._id === taskId ? { ...t, ...updatedTaskFromApi } : t)
            };
          });

          // 3. Cập nhật cache Task List (workspace-tasks-list)
          queryClient.setQueriesData({ queryKey: ['workspace-tasks-list', workspaceId] }, (oldData: any) => {
            if (!oldData || !oldData.tasks) return oldData;
            return {
              ...oldData,
              tasks: oldData.tasks.map((t: any) => t._id === taskId ? { ...t, ...updatedTaskFromApi } : t)
            };
          });

          // 4. Invalidate analytics & synchronized views
          queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] });
          queryClient.invalidateQueries({ queryKey: ['workspace-analytics-history', workspaceId] });
          queryClient.invalidateQueries({ queryKey: ['projectAnalytics', workspaceId, projectId] });
          queryClient.invalidateQueries({ queryKey: ['projectAnalyticsHistory', workspaceId, projectId] });
          
          // 5. Invalidate Table View specifically
          queryClient.invalidateQueries({ queryKey: ['project-root-tasks', workspaceId, projectId] }); 
          queryClient.invalidateQueries({ queryKey: ['project-all-subtasks', workspaceId, projectId] });
          
          queryClient.invalidateQueries({ queryKey: ['project-tasks', workspaceId, projectId] }); // Ensure absolute sync

        } catch (error: any) {
          const errorMessage = error.response?.data?.message || "Không thể cập nhật trạng thái công việc.";
          toast.error(errorMessage);
          
          setTasks(prev => {
            const reverted = [...prev];
            const idx = reverted.findIndex(t => t._id === taskId);
            if (idx !== -1) reverted[idx].status = originalStatus;
            return reverted;
          });
        }
      }
    },
  });

  useEffect(() => {
    if (fetchedTasks?.tasks) {
      setTasks(fetchedTasks.tasks);
    }
  }, [fetchedTasks]);

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '1',
        },
      },
    }),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary/80" />
      </div>
    );
  }

  return (
    <div className="flex gap-6 overflow-x-auto pb-8 min-h-[calc(100vh-200px)] custom-scrollbar">
        <div className="flex gap-6">
          {defaultColumns.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              tasks={tasks.filter((t) => t.status === col.id && !t.parentId)}
              allTasks={tasks}
              onTaskClick={onTaskClick}
              onAddTaskClick={onAddTaskClick}
              isAdminOrOwner={isAdminOrOwner}
              isProjectCompleted={isProjectCompleted}
              phaseId={phaseId}
            />
          ))}
        </div>

        {createPortal(
            <DragOverlay dropAnimation={dropAnimation}>
              {activeTask ? (
                <div className="w-[300px]">
                  <TaskCard task={activeTask} />
                </div>
              ) : null}
            </DragOverlay>,
            document.body
        )}
    </div>
  );
};
