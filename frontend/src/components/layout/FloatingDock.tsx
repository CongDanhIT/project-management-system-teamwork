'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelLeftClose, PanelLeft, FileText, PenTool, X, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useWorkspaceRole } from '@/hooks/useWorkspaceRole';
import { WorkspaceMemberPanel } from '@/components/workspace/WorkspaceMemberPanel';
import { useUiStore } from '@/stores/ui.store';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function FloatingDock() {
  const {
    isLeftSidebarOpen,
    toggleLeftSidebar,
    isInboxSidebarOpen,
    toggleInboxSidebar,
    isDocPanelOpen,
    toggleDocPanel,
    isDrawingMode,
    toggleDrawingMode,
  } = useUiStore();

  const [isDockHidden, setIsDockHidden] = useState(false);
  const [isMemberPanelOpen, setIsMemberPanelOpen] = useState(false);

  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const { isAdminOrOwner } = useWorkspaceRole();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bỏ qua nếu đang gõ trong form input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      if (e.altKey && e.key === '1') { e.preventDefault(); toggleLeftSidebar(); }
      if (e.altKey && e.key === '2') { e.preventDefault(); toggleDocPanel(); }
      if (e.altKey && e.key === '3') { e.preventDefault(); toggleDrawingMode(); }
      if (isAdminOrOwner && workspaceId && e.altKey && e.key === '4') { e.preventDefault(); setIsMemberPanelOpen(prev => !prev); }
      if (e.altKey && e.key === '5') { e.preventDefault(); toggleInboxSidebar(); }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleLeftSidebar, toggleDocPanel, toggleDrawingMode, toggleInboxSidebar, isAdminOrOwner, workspaceId]);

  const dockItems = [
    {
      id: 'left-sidebar',
      label: isLeftSidebarOpen ? 'Đóng Menu (Alt+1)' : 'Mở Menu (Alt+1)',
      icon: isLeftSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />,
      isActive: isLeftSidebarOpen,
      onClick: toggleLeftSidebar,
      color: 'text-brand-primary dark:text-brand-secondary',
      bgColor: 'bg-brand-primary/10 dark:bg-brand-secondary/10',
    },
    {
      id: 'document',
      label: 'Tài liệu chung (Alt+2)',
      icon: <FileText className="w-5 h-5" />,
      isActive: isDocPanelOpen,
      onClick: toggleDocPanel,
      color: 'text-brand-primary dark:text-brand-secondary',
      bgColor: 'bg-brand-primary/10 dark:bg-brand-secondary/10',
    },
    {
      id: 'drawing',
      label: isDrawingMode ? 'Tắt chế độ vẽ (Alt+3)' : 'Bật chế độ vẽ (Alt+3)',
      icon: isDrawingMode ? <X className="w-5 h-5" /> : <PenTool className="w-5 h-5" />,
      isActive: isDrawingMode,
      onClick: toggleDrawingMode,
      color: 'text-brand-primary dark:text-brand-secondary',
      bgColor: 'bg-brand-primary/10 dark:bg-brand-secondary/10',
    },
  ];

  if (isAdminOrOwner && workspaceId) {
    dockItems.push({
      id: 'members',
      label: isMemberPanelOpen ? 'Đóng Panel Thành viên (Alt+4)' : 'Mở Panel Thành viên (Alt+4)',
      icon: <Users className="w-5 h-5" />,
      isActive: isMemberPanelOpen,
      onClick: () => setIsMemberPanelOpen(!isMemberPanelOpen),
      color: 'text-brand-primary dark:text-brand-secondary',
      bgColor: 'bg-brand-primary/10 dark:bg-brand-secondary/10',
    });
  }

  dockItems.push({
    id: 'inbox-sidebar',
    label: isInboxSidebarOpen ? 'Đóng Inbox (Alt+5)' : 'Mở Inbox (Alt+5)',
    icon: isInboxSidebarOpen ? <PanelLeftClose className="w-5 h-5 rotate-180" /> : <PanelLeft className="w-5 h-5 rotate-180" />,
    isActive: isInboxSidebarOpen,
    onClick: toggleInboxSidebar,
    color: 'text-brand-primary dark:text-brand-secondary',
    bgColor: 'bg-brand-primary/10 dark:bg-brand-secondary/10',
  });

  return (
    <>
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: isDockHidden ? 150 : 0, opacity: isDockHidden ? 0 : 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="flex items-center gap-1.5 p-2 rounded-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_32px_-8px_rgba(199,249,100,0.05)]"
        >
          <TooltipProvider delayDuration={200}>
            {/* Lấy item đầu tiên (Left Sidebar) */}
            {renderDockItem(dockItems[0])}

            <div className="w-px h-5 bg-slate-200/50 dark:bg-white/5 mx-0.5" />

            {/* Lấy các tools ở giữa */}
            {dockItems.slice(1, dockItems.length - 1).map(renderDockItem)}

            <div className="w-px h-5 bg-slate-200/50 dark:bg-white/5 mx-0.5" />

            {/* Lấy item cuối cùng (Inbox Sidebar) */}
            {renderDockItem(dockItems[dockItems.length - 1])}

            {/* Nút Ẩn Dock */}
            <div className="w-px h-5 bg-slate-200/50 dark:bg-white/5 mx-0.5" />
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsDockHidden(true)}
                  className="relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ease-out text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-800"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={16} className="text-xs font-medium px-3 py-1.5 rounded-lg border-white/10 shadow-lg bg-slate-800 text-white dark:bg-white dark:text-slate-900">
                Ẩn thanh Dock
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </motion.div>
      </div>

      {/* Handle to pull up dock */}
      <AnimatePresence>
        {isDockHidden && (
          <motion.button
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            onClick={() => setIsDockHidden(false)}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[100] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 border-b-0 rounded-t-xl px-6 py-1.5 text-slate-500 hover:text-brand-primary dark:hover:text-brand-secondary shadow-[0_-4px_16px_rgba(0,0,0,0.1)] dark:shadow-none hover:bg-slate-50 dark:hover:bg-slate-800 transition-all pointer-events-auto"
            title="Hiện lại thanh Dock"
          >
            <ChevronUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {workspaceId && isAdminOrOwner && (
        <WorkspaceMemberPanel
          workspaceId={workspaceId}
          isOpen={isMemberPanelOpen}
          onClose={() => setIsMemberPanelOpen(false)}
        />
      )}
    </>
  );

  function renderDockItem(item: any) {
    return (
      <Tooltip key={item.id}>
        <TooltipTrigger asChild>
          <button
            onClick={item.onClick}
            className={cn(
              "relative flex items-center justify-center h-10 rounded-full transition-all duration-300 ease-out group overflow-hidden",
              item.isActive 
                ? `px-4 ${item.bgColor} ${item.color}` 
                : "w-10 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
            )}
          >
            <motion.div
              whileHover={{ scale: item.isActive ? 1 : 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="flex-shrink-0"
            >
              {item.icon}
            </motion.div>
            
            <AnimatePresence>
              {item.isActive && (
                <motion.span
                  initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                  animate={{ width: 'auto', opacity: 1, marginLeft: 8 }}
                  exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                  className="text-[13px] font-bold whitespace-nowrap overflow-hidden"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>

            {/* Indicator dot */}
            <AnimatePresence>
              {item.isActive && (
                <motion.div
                  layoutId="active-indicator"
                  className={cn("absolute -bottom-1 w-1 h-1 rounded-full", item.color.replace('text-', 'bg-').split(' ')[0])}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                />
              )}
            </AnimatePresence>
          </button>
        </TooltipTrigger>
        {!item.isActive && (
          <TooltipContent side="top" sideOffset={16} className="text-xs font-medium px-3 py-1.5 rounded-lg border-white/10 shadow-lg bg-slate-800 text-white dark:bg-white dark:text-slate-900">
            {item.label}
          </TooltipContent>
        )}
      </Tooltip>
    );
  }
}
