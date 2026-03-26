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
  onTaskClick?: (task: Task) => void;
  onAddTaskClick?: (status: TaskStatus) => void;
  isAdminOrOwner?: boolean;
}

const defaultColumns: { id: TaskStatus; title: string }[] = [
  { id: TaskStatus.TODO, title: 'Cần làm' },
  { id: TaskStatus.IN_PROGRESS, title: 'Đang làm' },
  { id: TaskStatus.INREVIEW, title: 'Đang duyệt' },
  { id: TaskStatus.DONE, title: 'Hoàn thành' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ workspaceId, projectId, onTaskClick, onAddTaskClick, isAdminOrOwner }) => {
  const queryClient = useQueryClient();
  const { data: fetchedTasks, isLoading: loading } = useQuery({
    queryKey: ['project-tasks', workspaceId, projectId],
    queryFn: () => taskService.getProjectTasks(workspaceId, projectId),
    enabled: !!workspaceId && !!projectId,
  });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    if (fetchedTasks) {
      setTasks(fetchedTasks);
    }
  }, [fetchedTasks]);

  const onDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'Task') {
      setActiveTask(event.active.data.current.task);
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === 'Task';
    const isOverATask = over.data.current?.type === 'Task';
    const isOverAColumn = over.data.current?.type === 'Column';

    if (!isActiveATask) return;

    // Immutably clear active item from current column and add to new column
    if (isActiveATask && isOverATask) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t._id === activeId);
        const overIndex = tasks.findIndex((t) => t._id === overId);

        if (tasks[activeIndex].status !== tasks[overIndex].status) {
          const updatedTasks = [...tasks];
          updatedTasks[activeIndex] = {
            ...updatedTasks[activeIndex],
            status: tasks[overIndex].status,
          };
          return arrayMove(updatedTasks, activeIndex, overIndex);
        }

        return arrayMove(tasks, activeIndex, overIndex);
      });
    }

    if (isActiveATask && isOverAColumn) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t._id === activeId);
        const updatedTasks = [...tasks];
        updatedTasks[activeIndex] = {
          ...updatedTasks[activeIndex],
          status: overId as TaskStatus,
        };
        return arrayMove(updatedTasks, activeIndex, activeIndex);
      });
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const dragStartedTaskSnapshot = activeTask; // Dùng snapshot từ trước khi drag over sửa status
    setActiveTask(null);
    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find(t => t._id === taskId);
    
    if (task && dragStartedTaskSnapshot) {
      const originalStatus = dragStartedTaskSnapshot.status;
      const targetStatus = task.status;

      // Nếu không thay đổi trạng thái thì không làm gì
      if (originalStatus === targetStatus) return;

      try {
        await taskService.updateTaskStatus(workspaceId, projectId, taskId, targetStatus);
        // Invalidate all relevant queries to keep other pages fresh
        queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['workspace-tasks-list', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['workspace-projects', workspaceId] });
      } catch (error: any) {
        // Lấy message từ backend nếu có, không thì dùng mặc định
        const errorMessage = error.response?.data?.message || "Không thể cập nhật trạng thái công việc.";
        toast.error(errorMessage);
        
        // Hoàn tác UI local state
        setTasks(prev => {
          const reverted = [...prev];
          const idx = reverted.findIndex(t => t._id === taskId);
          if (idx !== -1) reverted[idx].status = originalStatus;
          return reverted;
        });
      }
    }
  };

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex gap-6 overflow-x-auto pb-8 min-h-[calc(100vh-200px)] custom-scrollbar">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
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
            />
          ))}
        </div>

        {typeof document !== 'undefined' &&
          createPortal(
            <DragOverlay dropAnimation={dropAnimation}>
              {activeTask ? (
                <div className="w-[300px]">
                  <TaskCard task={activeTask} />
                </div>
              ) : null}
            </DragOverlay>,
            document.body
          )}
      </DndContext>
    </div>
  );
};
