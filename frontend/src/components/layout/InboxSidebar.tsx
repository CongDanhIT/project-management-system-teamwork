'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { 
  X, 
  Inbox, 
  Plus, 
  ChevronRight, 
  Search, 
  Filter,
  Clock,
  Layout,
  MoreVertical,
  Hash,
  Sparkles,
  Loader2
} from 'lucide-react';
import Loader from "@/components/ui/Loader";
import { InboxDraggableCard } from './InboxDraggableCard';
import { useUiStore } from '@/stores/ui.store';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { projectService } from '@/services/project.service';
import { taskService } from '@/services/task.service';
import { inboxService } from '@/services/inbox.service';
import { toast } from 'sonner';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function InboxSidebar() {
  const dragControls = useDragControls();
  const { currentWorkspaceId } = useWorkspaceStore();
  const { isInboxSidebarOpen, toggleInboxSidebar } = useUiStore();
  const queryClient = useQueryClient();
  const [taskTitle, setTaskTitle] = useState('');
  // Fetch drafts for the inbox list
  const { data: drafts = [], isLoading: isLoadingDrafts } = useQuery({
    queryKey: ['personal-inbox-drafts'],
    queryFn: () => inboxService.getMyDrafts(),
    enabled: isInboxSidebarOpen,
  });
  
  const createDraftMutation = useMutation({
    mutationFn: (data: { title: string }) => inboxService.createDraft(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-inbox-drafts'] });
      toast.success('Ghi chú đã được lưu vào Inbox!');
      setTaskTitle('');
    },
    onError: () => {
      toast.error('Lỗi khi tạo ghi chú');
    }
  });

  const deleteDraftMutation = useMutation({
    mutationFn: (id: string) => inboxService.deleteDraft(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-inbox-drafts'] });
      toast.success('Đã xóa ghi chú');
    },
    onError: () => {
      toast.error('Lỗi khi xóa ghi chú');
    }
  });

  const updateDraftMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title?: string; description?: string } }) => 
      inboxService.updateDraft(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-inbox-drafts'] });
      toast.success('Đã cập nhật ghi chú');
      setIsEditDialogOpen(false);
      setEditingDraft(null);
    },
    onError: () => {
      toast.error('Lỗi khi cập nhật ghi chú');
    }
  });

  const [editingDraft, setEditingDraft] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const handleEditClick = (draft: any) => {
    setEditingDraft(draft);
    setEditTitle(draft.title);
    setEditDescription(draft.description || '');
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editTitle.trim()) {
      toast.error('Tiêu đề không được để trống');
      return;
    }
    updateDraftMutation.mutate({
      id: editingDraft._id,
      data: { title: editTitle, description: editDescription }
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa ghi chú này không?')) {
      deleteDraftMutation.mutate(id);
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    createDraftMutation.mutate({ title: taskTitle });
  };

  return (
    <>
    <AnimatePresence>
      {isInboxSidebarOpen && (
        <motion.aside
          drag
          dragControls={dragControls}
          dragListener={false}
          dragMomentum={false}
          dragElastic={0.05}
          initial={{ x: '110%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '110%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 150 }}
          className="fixed top-[1.5rem] right-[1.5rem] bottom-[1.5rem] w-[380px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl z-50 flex flex-col shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/20 dark:border-white/5 rounded-[3rem] overflow-hidden touch-none"
        >
          {/* Drag Handle Area */}
          <div 
            onPointerDown={(e) => dragControls.start(e)}
            className="h-6 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-slate-500/5 transition-colors group"
          >
            <div className="w-12 h-1 bg-slate-400/20 dark:bg-slate-500/20 rounded-full group-hover:bg-brand-secondary/40 transition-colors" />
          </div>

          {/* Header */}
          <div className="px-8 pt-2 pb-4 flex items-center justify-between">
            <div className="flex flex-col">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-emerald-50 font-sans">Inbox</h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-1.5 h-1.5 bg-brand-secondary rounded-full animate-pulse shadow-[0_0_8px_rgba(199,249,100,0.5)]" />
                <span className="text-[10px] font-bold text-slate-400 dark:text-emerald-500/50 uppercase tracking-[0.15em]">Personal Space</span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleInboxSidebar}
              className="rounded-full h-10 w-10 hover:bg-white dark:hover:bg-white/5 transition-all active:scale-90"
            >
              <X className="w-4 h-4 text-slate-400" />
            </Button>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            {/* Quick Add Section (Ghost Area) */}
            <div className="px-8 py-6">
              <form onSubmit={handleQuickAdd} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary/20 to-brand-secondary/20 rounded-[2.5rem] blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-white dark:bg-white/5 rounded-[2.5rem] shadow-depth-1 dark:shadow-none border border-white/50 dark:border-white/5 overflow-hidden transition-all duration-300">
                  <Input 
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Có ý tưởng gì mới không?..."
                    className="h-14 bg-transparent border-none focus-visible:ring-0 px-6 py-4 text-sm font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-0"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {taskTitle.trim() ? (
                      <Button 
                        type="submit"
                        disabled={createDraftMutation.isPending}
                        size="icon"
                        className="h-8 w-8 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-full transition-all scale-100"
                      >
                        {createDraftMutation.isPending ? <Loader size="xs" /> : <ChevronRight className="w-4 h-4" />}
                      </Button>
                    ) : (
                      <Sparkles className="w-4 h-4 text-brand-secondary animate-pulse mr-2" />
                    )}
                  </div>
                </div>
              </form>
            </div>

            {/* View Tabs (Editorial Style) */}
            <div className="px-10 flex items-center gap-8 mb-4">
               <button className="relative py-1 group">
                 <span className="text-xs font-bold font-sans text-slate-900 dark:text-white uppercase tracking-wider">Tất cả</span>
                 <motion.div layoutId="activeTab" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-brand-secondary rounded-full" />
               </button>
               <button className="py-1 group focus:outline-none">
                 <span className="text-xs font-semibold font-sans text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 uppercase tracking-wider transition-colors">Của tôi</span>
               </button>
               <button className="py-1 group focus:outline-none">
                 <span className="text-xs font-semibold font-sans text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 uppercase tracking-wider transition-colors">AI Insights</span>
               </button>
            </div>

            {/* Inbox Content Area */}
            <div className="flex-1 overflow-y-auto px-8 py-2 custom-scrollbar">
               {/* Task List */}
               <div className="space-y-4">
                  {drafts.map((draft) => (
                    <InboxDraggableCard 
                       key={draft._id} 
                       draft={draft} 
                       onDelete={handleDelete}
                       onEdit={handleEditClick}
                     />
                  ))}

                  {(!isLoadingDrafts && drafts.length === 0) && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="relative mb-6">
                        <div className="absolute inset-0 bg-brand-secondary/10 blur-3xl rounded-full animate-pulse" />
                        <div className="w-20 h-20 bg-white dark:bg-brand-primary/5 rounded-[2.5rem] flex items-center justify-center relative z-10 shadow-depth-1 dark:shadow-none">
                          <Inbox className="w-8 h-8 text-brand-secondary" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-sans uppercase tracking-widest">Không gian trống</h3>
                        <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">Lên ý tưởng cho bước tiến tiếp theo</p>
                      </div>
                    </div>
                  )}
               </div>
            </div>
          </div>

          {/* Minimalist Footer */}
          <div className="p-10 mt-auto">
             <div className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity">
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">Your ideas. Organized.</p>
               <div className="w-4 h-0.5 bg-brand-secondary rounded-full" />
             </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
    
    {/* Edit Dialog */}
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 border-none rounded-[2rem] shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold font-sans">Chỉnh sửa ghi chú</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tiêu đề</Label>
            <Input
              id="title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="bg-slate-50 dark:bg-white/5 border-none rounded-2xl h-12"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nội dung</Label>
            <Textarea
              id="description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="bg-slate-50 dark:bg-white/5 border-none rounded-2xl min-h-[120px] resize-none p-4"
              placeholder="Thêm chi tiết cho ghi chú này..."
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="ghost" 
            onClick={() => setIsEditDialogOpen(false)}
            className="rounded-full h-12 px-6"
          >
            Hủy
          </Button>
          <Button 
            onClick={handleUpdate}
            disabled={updateDraftMutation.isPending}
            className="bg-brand-primary hover:bg-brand-primary/90 text-white rounded-full h-12 px-8"
          >
            {updateDraftMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cập nhật'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
