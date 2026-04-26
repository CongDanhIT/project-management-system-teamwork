'use client';

import React from 'react';
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import InboxSidebar from "@/components/layout/InboxSidebar";
import { AiChatButton } from '@/components/ai/AiChatButton';
import { useUiStore } from '@/stores/ui.store';
import { cn } from '@/lib/utils';
import { DndRootProvider } from '@/providers/DndRootProvider';
import { DragEndEvent, DragStartEvent, DragOverlay, defaultDropAnimationSideEffects } from '@dnd-kit/core';
import { inboxService, IInboxDraft } from '@/services/inbox.service';
import { useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { TaskStatus } from '@/types/task';
import { createPortal } from 'react-dom';
import { useWorkspaceSync } from '@/hooks/useWorkspaceSync';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isInboxSidebarOpen } = useUiStore();
  const params = useParams();
  const queryClient = useQueryClient();
  const [activeDraft, setActiveDraft] = React.useState<IInboxDraft | null>(null);

  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;

  // Tự động đồng bộ currentWorkspaceId khi URL thay đổi
  useWorkspaceSync();

  React.useEffect(() => {
    console.log(`[MainLayout] Mounted at: ${window.location.pathname}`);
    return () => console.log(`[MainLayout] Unmounted from: ${window.location.pathname}`);
  }, []);

  console.log(`[MainLayout] Rendering... workspaceId: ${workspaceId}, projectId: ${projectId}`);

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'InboxTask') {
      setActiveDraft(event.active.data.current.draft);
    }
  };

  const handleGlobalDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDraft(null);
    
    if (!over) return;

    // Logic xử lý Promote từ Inbox
    if (active.data.current?.type === 'InboxTask') {
      const draftId = active.id as string;
      const targetColumnId = over.id as TaskStatus;
      const isOverColumn = over.data.current?.type === 'Column';

      if (isOverColumn && workspaceId && projectId) {
        try {
          toast.promise(
            inboxService.promoteToTask(draftId, workspaceId, projectId, targetColumnId),
            {
              loading: 'Đang chuyển đổi thành công việc...',
              success: () => {
                queryClient.invalidateQueries({ queryKey: ['personal-inbox-drafts'] });
                queryClient.invalidateQueries({ queryKey: ['workspace-tasks', 'project', workspaceId, projectId] });
                return 'Đã thêm vào dự án thành công!';
              },
              error: 'Không thể chuyển đổi công việc. Vui lòng thử lại.',
            }
          );
        } catch (error) {
          console.error('Promotion error:', error);
        }
      } else if (!workspaceId || !projectId) {
        toast.error('Vui lòng chọn một dự án để thả vào.');
      }
    }
  };

  return (
    <DndRootProvider onDragEnd={handleGlobalDragEnd} onDragStart={handleDragStart}>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
        <Sidebar />
        <div className={cn(
          "pl-64 flex flex-col min-h-screen transition-all duration-500 ease-in-out"
        )}>
          <Header />
          <main className="flex-1 p-8 lg:p-12 overflow-x-hidden">
            <div className="max-w-[1600px] mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
        <InboxSidebar />
        {/* AI Chat Floating Button - hiển thị trên tất cả các trang */}
        <AiChatButton />
      </div>

      {typeof document !== 'undefined' && createPortal(
        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.4',
              },
            },
          }),
        }}>
          {activeDraft ? (
            <div className="w-[320px] p-4 bg-white dark:bg-slate-900 border-2 border-brand-primary rounded-2xl shadow-glow rotate-3 scale-105 transition-transform">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[8px] font-black uppercase tracking-widest text-brand-primary">
                  Drafting...
                </span>
                <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
              </div>
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200">{activeDraft.title}</h3>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{activeDraft.description}</p>
            </div>
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndRootProvider>
  );
}
