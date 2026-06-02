'use client';

import React, { useState, useEffect } from 'react';
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
  Loader2,
  Trash2,
  Edit3,
  Pin
} from 'lucide-react';
import Loader from "@/components/ui/Loader";
import { InboxDraggableCard } from './InboxDraggableCard';
import { useUiStore } from '@/stores/ui.store';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { inboxService } from '@/services/inbox.service';
import { personalNoteService, IPersonalNote } from '@/services/personal-note.service';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// Component Card cho Giấy ghi chú cá nhân (NoteCard - Static)
interface NoteCardProps {
  note: IPersonalNote;
  onDelete?: (id: string) => void;
  onEdit?: (note: IPersonalNote) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onDelete, onEdit }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      style={{ backgroundColor: note.color || '#fef08a' }}
      className={cn(
        "group p-5 rounded-[1.5rem] transition-all relative overflow-hidden text-slate-800 select-none",
        "shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.15)]"
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 mb-1 justify-between">
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em] font-sans">
            {new Date(note.createdAt).toLocaleDateString()}
          </span>
          {note.isPinned && (
            <div className="flex items-center gap-1 bg-slate-900/10 px-1.5 py-0.5 rounded text-slate-900 font-extrabold text-[8px] uppercase tracking-wide">
              <Pin className="w-2.5 h-2.5" />
              <span>GHIM</span>
            </div>
          )}
        </div>
        <h3 className="text-sm font-bold font-sans line-clamp-1 leading-snug">
          {note.title}
        </h3>
        {note.description && (
          <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed font-medium">
            {note.description}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(note);
          }}
          className="p-1.5 hover:bg-black/5 rounded-full text-slate-650 hover:text-black transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(note._id);
          }}
          className="p-1.5 hover:bg-black/5 rounded-full text-slate-650 hover:text-rose-700 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Subtle Hover Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.div>
  );
};

export default function InboxSidebar() {
  const dragControls = useDragControls();
  const { currentWorkspaceId } = useWorkspaceStore();
  const { isInboxSidebarOpen, toggleInboxSidebar } = useUiStore();
  const queryClient = useQueryClient();
  const [taskTitle, setTaskTitle] = useState('');
  
  // Tab state: 'all' (Tất cả Inbox drafts) | 'notes' (Giấy ghi chú cá nhân) | 'ai' (AI Insights)
  const [activeTab, setActiveTab] = useState<'all' | 'notes' | 'ai'>('all');
  
  // Reset tab về 'all' khi đóng/mở sidebar
  useEffect(() => {
    if (!isInboxSidebarOpen) {
      setActiveTab('all');
    }
  }, [isInboxSidebarOpen]);

  // Fetch drafts for the inbox list
  const { data: drafts = [], isLoading: isLoadingDrafts } = useQuery({
    queryKey: ['personal-inbox-drafts'],
    queryFn: () => inboxService.getMyDrafts(),
    enabled: isInboxSidebarOpen && activeTab === 'all',
  });

  // Fetch personal notes for the current workspace
  const { data: notes = [], isLoading: isLoadingNotes } = useQuery({
    queryKey: ['personal-notes', currentWorkspaceId],
    queryFn: () => personalNoteService.getNotesByWorkspace(currentWorkspaceId || ''),
    enabled: isInboxSidebarOpen && !!currentWorkspaceId && activeTab === 'notes',
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

  const createNoteMutation = useMutation({
    mutationFn: (data: { workspaceId: string; title: string }) => personalNoteService.createNote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-notes', currentWorkspaceId] });
      toast.success('Giấy ghi chú đã được tạo!');
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

  const deleteNoteMutation = useMutation({
    mutationFn: (id: string) => personalNoteService.deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-notes', currentWorkspaceId] });
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

  const updateNoteMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title?: string; description?: string; color?: string; isPinned?: boolean } }) => 
      personalNoteService.updateNote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-notes', currentWorkspaceId] });
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
  const [editColor, setEditColor] = useState('#fef08a');
  const [editIsPinned, setEditIsPinned] = useState(false);
  const [editMode, setEditMode] = useState<'draft' | 'note'>('draft');

  const handleEditClick = (item: any) => {
    setEditingDraft(item);
    setEditTitle(item.title);
    setEditDescription(item.description || '');
    setEditColor(item.color || '#fef08a');
    setEditIsPinned(item.isPinned || false);
    setEditMode(activeTab === 'notes' ? 'note' : 'draft');
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editTitle.trim()) {
      toast.error('Tiêu đề không được để trống');
      return;
    }
    if (editMode === 'note') {
      updateNoteMutation.mutate({
        id: editingDraft._id,
        data: { 
          title: editTitle, 
          description: editDescription, 
          color: editColor, 
          isPinned: editIsPinned 
        }
      });
    } else {
      updateDraftMutation.mutate({
        id: editingDraft._id,
        data: { title: editTitle, description: editDescription }
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa ghi chú này không?')) {
      if (activeTab === 'notes') {
        deleteNoteMutation.mutate(id);
      } else {
        deleteDraftMutation.mutate(id);
      }
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    
    if (activeTab === 'notes') {
      if (!currentWorkspaceId) {
        toast.error('Không tìm thấy Không gian làm việc hiện tại');
        return;
      }
      createNoteMutation.mutate({ workspaceId: currentWorkspaceId, title: taskTitle });
    } else {
      createDraftMutation.mutate({ title: taskTitle });
    }
  };

  const isLoading = (activeTab === 'all' && isLoadingDrafts) || (activeTab === 'notes' && isLoadingNotes);
  const showCreatePending = createDraftMutation.isPending || createNoteMutation.isPending;

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
                    placeholder={activeTab === 'notes' ? "Viết ghi chú mới..." : "Có ý tưởng gì mới không?..."}
                    className="h-14 bg-transparent border-none focus-visible:ring-0 px-6 py-4 text-sm font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-0"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {taskTitle.trim() ? (
                      <Button 
                        type="submit"
                        disabled={showCreatePending}
                        size="icon"
                        className="h-8 w-8 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-full transition-all scale-100"
                      >
                        {showCreatePending ? <Loader size="xs" /> : <ChevronRight className="w-4 h-4" />}
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
               <button 
                 onClick={() => setActiveTab('all')}
                 className="relative py-1 group focus:outline-none"
               >
                 <span className={cn(
                   "text-xs font-sans uppercase tracking-wider transition-colors",
                   activeTab === 'all' ? "text-slate-900 dark:text-white font-bold" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                 )}>Hộp thư đến</span>
                 {activeTab === 'all' && (
                   <motion.div layoutId="activeTab" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-brand-secondary rounded-full" />
                 )}
               </button>
               <button 
                 onClick={() => setActiveTab('notes')}
                 className="relative py-1 group focus:outline-none"
               >
                 <span className={cn(
                   "text-xs font-sans uppercase tracking-wider transition-colors",
                   activeTab === 'notes' ? "text-slate-900 dark:text-white font-bold" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                 )}>Ghi chú</span>
                 {activeTab === 'notes' && (
                   <motion.div layoutId="activeTab" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-brand-secondary rounded-full" />
                 )}
               </button>
               <button 
                 onClick={() => setActiveTab('ai')}
                 className="relative py-1 group focus:outline-none"
               >
                 <span className={cn(
                   "text-xs font-sans uppercase tracking-wider transition-colors",
                   activeTab === 'ai' ? "text-slate-900 dark:text-white font-bold" : "text-slate-400 dark:text-slate-500 hover:text-slate-650"
                 )}>AI Insights</span>
                 {activeTab === 'ai' && (
                   <motion.div layoutId="activeTab" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-brand-secondary rounded-full" />
                 )}
               </button>
            </div>

            {/* Inbox Content Area */}
            <div className="flex-1 overflow-y-auto px-8 py-2 custom-scrollbar">
               {/* Task/Note List */}
               <div className="space-y-4">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <Loader size="md" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Đang nạp ghi chép...</p>
                    </div>
                  ) : (
                    <>
                      {/* Tab 1: Inbox Drafts */}
                      {activeTab === 'all' && drafts.map((draft) => (
                        <InboxDraggableCard 
                           key={draft._id} 
                           draft={draft} 
                           onDelete={handleDelete}
                           onEdit={handleEditClick}
                         />
                      ))}

                      {/* Tab 2: Personal Notes */}
                      {activeTab === 'notes' && notes.map((note) => (
                        <NoteCard 
                           key={note._id} 
                           note={note} 
                           onDelete={handleDelete}
                           onEdit={handleEditClick}
                         />
                      ))}

                      {/* Empty State */}
                      {((activeTab === 'all' && drafts.length === 0) || 
                        (activeTab === 'notes' && notes.length === 0)) && (
                        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-300">
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

                      {/* Tab 3: AI Insights (Static Placeholder) */}
                      {activeTab === 'ai' && (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                          <Sparkles className="w-8 h-8 text-brand-secondary mb-4 animate-bounce" />
                          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-sans uppercase tracking-widest">AI Insights</h3>
                          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] max-w-[200px] mt-2 leading-relaxed">
                            Trợ lý AI đang phân tích dữ liệu của bạn để đưa ra những phân tích đột phá.
                          </p>
                        </div>
                      )}
                    </>
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
          <DialogTitle className="text-xl font-bold font-sans">
            {editMode === 'note' ? 'Chỉnh sửa giấy ghi chú' : 'Chỉnh sửa ghi chú Inbox'}
          </DialogTitle>
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

          {/* Cấu hình màu sắc và ghim note (Chỉ hiện khi ở EditMode Note) */}
          {editMode === 'note' && (
            <>
              <div className="grid gap-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Màu sắc</Label>
                <div className="flex items-center gap-3">
                  {[
                    { hex: '#fef08a', name: 'Vàng' },
                    { hex: '#bbf7d0', name: 'Xanh lá' },
                    { hex: '#bfdbfe', name: 'Xanh dương' },
                    { hex: '#fbcfe8', name: 'Hồng' },
                    { hex: '#fed7aa', name: 'Cam' },
                    { hex: '#e9d5ff', name: 'Tím' }
                  ].map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setEditColor(c.hex)}
                      className={cn(
                        "w-8 h-8 rounded-full border transition-all scale-100 hover:scale-110 shadow-sm",
                        editColor === c.hex ? "ring-2 ring-brand-primary dark:ring-brand-secondary" : "border-slate-200 dark:border-slate-800"
                      )}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between bg-slate-50 dark:bg-white/5 p-4 rounded-2xl">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Ghim lên đầu</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Hiển thị ghi chú này ở vị trí đầu tiên</span>
                </div>
                <input
                  type="checkbox"
                  checked={editIsPinned}
                  onChange={(e) => setEditIsPinned(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-primary border-slate-350 dark:border-slate-700 bg-transparent focus:ring-brand-primary focus:ring-offset-0"
                />
              </div>
            </>
          )}
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
            disabled={updateDraftMutation.isPending || updateNoteMutation.isPending}
            className="bg-brand-primary hover:bg-brand-primary/90 text-white rounded-full h-12 px-8"
          >
            {(updateDraftMutation.isPending || updateNoteMutation.isPending) ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Cập nhật'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
