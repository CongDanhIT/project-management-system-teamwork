'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { StatusBadge } from '../shared/StatusBadge';
import { PriorityBadge } from '../shared/PriorityBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar as CalendarIcon, 
  User, 
  UserPlus, 
  Plus, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Save, 
  ChevronLeft, 
  ChevronRight, 
  GitBranch, 
  MessageSquare, 
  Smile, 
  Bold, 
  Italic, 
  List, 
  Link, 
  Layout, 
  Check, 
  X,
  Tag,
  Paperclip,
  FileText,
  ExternalLink,
  Image as ImageIcon,
  MoreHorizontal,
  Download,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SubtaskEditModal } from './SubtaskEditModal';
import { taskService } from '@/services/task.service';
import { tagService } from '@/services/tag.service';
import { Tag as TagType } from '@/types/task';
import { interactionService } from '@/services/interaction.service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import EmojiPicker, { Theme } from 'emoji-picker-react';

import { useSearchParams } from 'next/navigation';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (taskId: string, data: any) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onSubtaskUpdate?: () => void;
  members: any[];
  tasks: Task[];
  isAdminOrOwner?: boolean;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onSubtaskUpdate,
  members,
  tasks,
  isAdminOrOwner = false,
}) => {
  const searchParams = useSearchParams();
  const targetCommentId = searchParams.get('commentId');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODO);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [estimatedHours, setEstimatedHours] = useState<number | ''>('');
  const [loggedHours, setLoggedHours] = useState<number | ''>('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]); // [MULTI-ASSIGNEE]
  const [parentId, setParentId] = useState<string>('none');
  const [isUpdating, setIsUpdating] = useState(false);
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [isLoadingSubtasks, setIsLoadingSubtasks] = useState(false);
  const [subtaskPage, setSubtaskPage] = useState(1);
  const [subtaskTotalPages, setSubtaskTotalPages] = useState(1);
  const [subtaskTotalCount, setSubtaskTotalCount] = useState(0);
  const [selectedSubtask, setSelectedSubtask] = useState<Task | null>(null);
  const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isActivityOpen, setIsActivityOpen] = useState(true);
  const [availableTags, setAvailableTags] = useState<TagType[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [replyToComment, setReplyToComment] = useState<any | null>(null);
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);

  // Tự động mở Activity nếu có commentId
  useEffect(() => {
    if (targetCommentId && isOpen) {
      setIsActivityOpen(true);
    }
  }, [targetCommentId, isOpen]);

  const [attachments, setAttachments] = useState([
    { id: '1', name: 'design_specs.pdf', size: '2.4 MB', type: 'pdf', url: '#' },
    { id: '2', name: 'hero_section.png', size: '1.8 MB', type: 'image', url: '#' },
  ]);

  // --- COMMENTS & ACTIVITIES DATA ---
  const { data: comments = [], isLoading: isLoadingComments } = useQuery<any[]>({
    queryKey: ['task-comments', task?._id],
    queryFn: () => interactionService.getComments(task!._id),
    enabled: !!task?._id && isOpen,
  });

  // Tự động cuộn tới comment mục tiêu
  useEffect(() => {
    if (targetCommentId && comments.length > 0) {
      let retryCount = 0;
      const maxRetries = 5;
      
      const tryScroll = () => {
        const element = document.getElementById(`comment-${targetCommentId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Thêm một hiệu ứng nháy nhẹ để người dùng chú ý
          element.classList.add('ring-2', 'ring-brand-primary', 'ring-offset-2');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-brand-primary', 'ring-offset-2');
          }, 3000);
        } else if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(tryScroll, 300); // Thử lại sau 300ms
        }
      };

      // Đợi một chút để chắc chắn component đã render xong list
      const timer = setTimeout(tryScroll, 500);
      return () => clearTimeout(timer);
    }
  }, [targetCommentId, comments]);

  // Nếu có targetCommentId mà không thấy trong danh sách, hãy refresh
  useEffect(() => {
    if (targetCommentId && comments.length > 0) {
      const exists = comments.some((c: any) => c._id === targetCommentId);
      if (!exists && !isLoadingComments) {
        queryClient.invalidateQueries({ queryKey: ["task-comments", task?._id] });
      }
    }
  }, [targetCommentId, comments, task?._id, queryClient, isLoadingComments]);

  const sendCommentMutation = useMutation({
    mutationFn: (data: { content: string; mentions?: string[]; replyTo?: string }) => 
      interactionService.createComment(task!.workspaceId, task!._id, data),
    onSuccess: () => {
      setCommentText('');
      setReplyToComment(null);
      queryClient.invalidateQueries({ queryKey: ['task-comments', task?._id] });
    }
  });

  const handleSendComment = async () => {
    if (!commentText.trim() || !task) return;
    setIsSendingComment(true);
    try {
      // Logic trích xuất ID người dùng từ văn bản thực tế để đảm bảo tính chính xác
      const finalMentions = mentionedUserIds.filter(id => {
        const user = members.find(m => (m.userId?._id || m.userId?.id) === id)?.userId;
        return user && commentText.includes(`@${user.name}`);
      });

      await sendCommentMutation.mutateAsync({ 
        content: commentText,
        replyTo: replyToComment?._id,
        mentions: finalMentions
      });
      setMentionedUserIds([]);
    } catch (error) {
      toast.error("Không thể gửi bình luận");
    } finally {
      setIsSendingComment(false);
    }
  };

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
      setStartDate(task.startDate ? new Date(task.startDate) : undefined);
      setEstimatedHours(task.estimatedHours || '');
      setLoggedHours(task.loggedHours || '');

      const pId = typeof task.parentId === 'object' ? (task.parentId as any)?._id : task.parentId;
      setParentId(pId || 'none');

      // [MULTI-ASSIGNEE] Khởi tạo mảng assigneeIds từ task.assignedTo
      const ids = Array.isArray(task.assignedTo)
        ? task.assignedTo.map((u: any) => (typeof u === 'object' ? u._id : u)).filter(Boolean)
        : [];
      setAssigneeIds(ids);

      // Khởi tạo Tags
      const tIds = Array.isArray(task.tags)
        ? task.tags.map((t: any) => (typeof t === 'object' ? t._id : t)).filter(Boolean)
        : [];
      setSelectedTagIds(tIds);

      // Seed availableTags từ tags hiện có của task để tránh flash trắng
      if (Array.isArray(task.tags)) {
        const initialTags = task.tags.filter(t => typeof t === 'object') as TagType[];
        setAvailableTags((prev: TagType[]) => {
          const existingIds = new Set(prev.map((item: TagType) => item._id));
          const newItems = initialTags.filter((item: TagType) => !existingIds.has(item._id));
          return [...prev, ...newItems];
        });
      }
    }
  }, [task]);

  // Lấy toàn bộ nhãn có sẵn của workspace
  useEffect(() => {
    const fetchAvailableTags = async () => {
      if (isOpen && task?.workspaceId) {
        try {
          const tags = await tagService.getTags(task.workspaceId);
          setAvailableTags(tags);
        } catch (error) {
          console.error("Failed to fetch available tags", error);
        }
      }
    };
    fetchAvailableTags();
  }, [isOpen, task?.workspaceId]);

  const fetchSubtasks = async (page: number) => {
    if (!task || !isOpen) return;
    setIsLoadingSubtasks(true);
    try {
      const res = await taskService.getSubtasks(task.workspaceId, task._id, page, 4);
      setSubtasks(res.tasks);
      setSubtaskPage(res.currentPage);
      setSubtaskTotalPages(res.totalPages);
      setSubtaskTotalCount(res.totalCount);
    } catch (error) {
      console.error("Failed to fetch subtasks", error);
    } finally {
      setIsLoadingSubtasks(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSubtasks(1);
    }
  }, [task, isOpen]);

  const refreshTaskData = async () => {
    if (!task) return;
    try {
      const pId = typeof task.projectId === 'object' ? (task.projectId as any)?._id : task.projectId;
      const res = await taskService.getTaskById(task.workspaceId, pId, task._id);
      if (res) {
        setEstimatedHours(res.estimatedHours || 0);
        setLoggedHours(res.loggedHours || 0);
        setStatus(res.status);
      }
    } catch (error) {
      console.error("Failed to refresh task data", error);
    }
  };

  const refreshSubtasks = async () => {
    fetchSubtasks(subtaskPage);
  };

  const handleSave = async () => {
    if (!task) return;
    setIsUpdating(true);
    try {
      // Prepare date values: only send null if explicitly intended, 
      // otherwise send the current state or fallback to original task value
      const finalDueDate = dueDate ? dueDate.toISOString() : (task.dueDate || null);
      const finalStartDate = startDate ? startDate.toISOString() : (task.startDate || null);

      await onUpdate(task._id, {
        title,
        description,
        status,
        priority,
        assignedTo: assigneeIds, // [MULTI-ASSIGNEE] Gửi mảng ID
        dueDate: finalDueDate,
        startDate: finalStartDate,
        estimatedHours: estimatedHours === '' ? 0 : Number(estimatedHours),
        loggedHours: loggedHours === '' ? 0 : Number(loggedHours),
        parentId: parentId === 'none' ? null : parentId,
        tags: selectedTagIds,
      });
      // toast.success("Đã cập nhật công việc thành công"); // [REDUNDANT] Xóa vì parent page đã có toast
      onClose();
    } finally {
      setIsUpdating(false);
    }
  };

  // [MULTI-ASSIGNEE] Helper toggle thêm/xóa người thực hiện
  const toggleAssignee = (userId: string) => {
    setAssigneeIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev: string[]) => 
      prev.includes(tagId) ? prev.filter((id: string) => id !== tagId) : [...prev, tagId]
    );
  };

  const currentTags = availableTags.filter((t: TagType) => selectedTagIds.includes(t._id));

  const activeAssignees = Array.isArray(members) 
    ? members.filter(m => {
        const mUserId = m.userId?._id || '';
        return assigneeIds.includes(mUserId);
      })
    : [];

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setCommentText(value);

    // Phát hiện ký tự @ ở cuối hoặc sau dấu cách
    const lastChar = value.slice(-1);
    const words = value.split(/\s/);
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith('@')) {
      setMentionSearch(lastWord.slice(1));
      setShowMentionList(true);
    } else {
      setShowMentionList(false);
    }
  };

  const insertMention = (user: any) => {
    const userId = user._id || user.id;
    if (!userId) return;

    const words = commentText.split(/\s/);
    words.pop(); // Xóa phần "@search"
    const newText = words.join(' ') + (words.length > 0 ? ' ' : '') + `@${user.name} `;
    setCommentText(newText);
    setMentionedUserIds(prev => [...new Set([...prev, userId])]);
    setShowMentionList(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-[1200px] w-[95vw] h-[85vh] p-0 overflow-hidden border-none shadow-2xl rounded-[32px] flex flex-col sm:flex-row bg-modal-bg gap-0 antialiased"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Chi tiết nhiệm vụ</DialogTitle>
        <div className={cn(
          "h-full flex flex-col bg-modal-surface relative overflow-hidden isolate transition-all duration-500 ease-in-out",
          isActivityOpen ? "sm:w-[70%]" : "sm:w-[100%]"
        )} style={{ contain: 'paint' }}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary/20 via-brand-secondary to-brand-primary/20 opacity-30 z-20" />
          
          {/* Unified Header Bars */}
          <div className="h-16 border-b border-modal-border flex items-center justify-between px-8 bg-modal-surface/80 backdrop-blur-md sticky top-0 z-[100] shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-[10px] font-black text-brand-primary uppercase tracking-widest">
                <Layout className="w-3.5 h-3.5" />
                <span>Nhiệm vụ Hệ thống</span>
              </div>
              <div className="w-[1px] h-4 bg-modal-border" />
              <Badge className="bg-brand-primary/10 text-brand-primary border-brand-primary/20 h-6 px-2 text-[10px] font-black rounded-lg">
                {task?.taskCode || 'TASK'}
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              {isAdminOrOwner && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (task) {
                      onDelete(task._id);
                      onClose();
                    }
                  }}
                  className="w-10 h-10 rounded-2xl text-text-dim/60 hover:text-red-500 hover:bg-red-500/10 transition-all duration-300"
                  title="Xóa công việc"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
              
              <div className="w-[1px] h-4 bg-modal-border mx-1" />

              <Button
                variant="ghost" 
                size="icon"
                className={cn(
                  "w-10 h-10 rounded-2xl transition-all duration-300",
                  isActivityOpen ? "bg-brand-primary text-white shadow-lg" : "bg-modal-bg text-text-dim border border-modal-border hover:bg-modal-surface"
                )}
                onClick={() => setIsActivityOpen(!isActivityOpen)}
                title={isActivityOpen ? "Ẩn Activity" : "Hiện Activity"}
              >
                <MessageSquare className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="w-10 h-10 rounded-2xl bg-modal-bg border border-modal-border text-text-dim hover:bg-modal-surface hover:text-foreground transition-all duration-300 ml-1"
                title="Đóng (Esc)"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar bg-modal-surface">
            <div className="p-8 space-y-8 pb-12 w-full max-w-4xl mx-auto">
              <div className="bg-modal-section border border-modal-border rounded-[32px] p-8 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 group cursor-default">
                    <div className="flex items-center gap-2 text-[10px] font-black text-text-dim/60 uppercase tracking-widest">
                      <span>Workspace</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-text-dim/30" />
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-brand-primary uppercase tracking-widest">
                      <Layout className="w-3 h-3" />
                      <span>{task?.projectId?.name || 'Dự án'}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-text-dim/30" />
                    <div className="text-[10px] font-black text-text-dim/40 uppercase tracking-widest">
                      <span>Chi tiết nhiệm vụ</span>
                    </div>
                  </div>
                </div>

                <div className="relative group/title">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-4xl font-black text-foreground border-none p-0 focus-visible:ring-0 shadow-none bg-transparent h-auto max-w-full placeholder:text-text-dim/20 tracking-tight leading-none"
                    placeholder="Tiêu đề công việc..."
                  />
                  <div className="absolute -bottom-2 left-0 w-12 h-1 bg-brand-primary/20 rounded-full scale-x-0 group-focus-within/title:scale-x-100 transition-transform origin-left duration-300" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-10 bg-modal-section p-8 rounded-3xl border border-modal-border shadow-sm text-foreground">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-text-dim uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="w-[2px] h-3 bg-brand-secondary rounded-full" />
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary/80" /> Trạng thái
                  </label>
                  <Select
                    value={status}
                    onValueChange={(val) => setStatus(val as TaskStatus)}
                    open={activeDropdown === 'status'}
                    onOpenChange={(open) => setActiveDropdown(open ? 'status' : null)}
                  >
                    <SelectTrigger className="w-full border border-modal-border bg-input-bg hover:border-brand-primary/20 hover:shadow-md transition-[border-color,box-shadow] duration-200 px-4 h-14 rounded-2xl shadow-sm focus:ring-2 focus:ring-brand-primary/10 group">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={status} />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-modal-border shadow-xl p-2 bg-modal-bg/95 backdrop-blur-xl">
                      <SelectItem value={TaskStatus.TODO} className="rounded-xl py-3 cursor-pointer">Cần làm</SelectItem>
                      <SelectItem value={TaskStatus.IN_PROGRESS} className="rounded-xl py-3 cursor-pointer">Đang thực hiện</SelectItem>
                      <SelectItem value={TaskStatus.INREVIEW} className="rounded-xl py-3 cursor-pointer">Đang duyệt</SelectItem>
                      <SelectItem value={TaskStatus.DONE} className="rounded-xl py-3 cursor-pointer">Hoàn thành</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black text-text-dim uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="w-[2px] h-3 bg-brand-secondary rounded-full" />
                    <AlertCircle className="w-3.5 h-3.5 text-brand-primary/80" /> Ưu tiên
                  </label>
                  <Select
                    value={priority}
                    onValueChange={(val) => setPriority(val as TaskPriority)}
                    open={activeDropdown === 'priority'}
                    onOpenChange={(open) => setActiveDropdown(open ? 'priority' : null)}
                  >
                    <SelectTrigger className="w-full border border-modal-border bg-input-bg hover:border-brand-primary/20 hover:shadow-md transition-[border-color,box-shadow] duration-200 px-4 h-14 rounded-2xl shadow-sm focus:ring-2 focus:ring-brand-primary/10">
                      <PriorityBadge priority={priority} />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-modal-border shadow-xl p-2 bg-modal-bg/95 backdrop-blur-xl">
                      <SelectItem value={TaskPriority.LOW} className="rounded-xl py-3 cursor-pointer">Thấp</SelectItem>
                      <SelectItem value={TaskPriority.MEDIUM} className="rounded-xl py-3 cursor-pointer">Trung bình</SelectItem>
                      <SelectItem value={TaskPriority.HIGH} className="rounded-xl py-3 cursor-pointer">Cao</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* [MULTI-ASSIGNEE] Multi-select Assignee Picker */}
                <div className="space-y-3 col-span-2">
                  <label className="text-[11px] font-black text-text-dim uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="w-[2px] h-3 bg-brand-secondary rounded-full" />
                    <User className="w-3.5 h-3.5 text-brand-primary/80" /> Người thực hiện
                    {assigneeIds.length > 0 && (
                      <span className="ml-auto bg-brand-primary/10 text-brand-primary text-[9px] font-black px-2 py-0.5 rounded-full">
                        {assigneeIds.length} người
                      </span>
                    )}
                  </label>

                  <Popover
                    open={activeDropdown === 'assignee'}
                    onOpenChange={(open) => setActiveDropdown(open ? 'assignee' : null)}
                  >
                    <PopoverTrigger className="w-full group">
                      <div className="w-full border border-modal-border bg-input-bg hover:border-brand-primary/20 hover:shadow-md transition-[border-color,box-shadow] duration-200 px-4 h-14 rounded-2xl shadow-sm focus:ring-2 focus:ring-brand-primary/10 flex items-center justify-between gap-3 text-left cursor-pointer">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {activeAssignees.length > 0 ? (
                            <>
                              <div className="flex -space-x-2 shrink-0">
                                {activeAssignees.slice(0, 3).map(m => (
                                  <Avatar key={m.userId?._id} className="w-8 h-8 border-2 border-modal-bg shadow-sm">
                                    <AvatarImage src={m.userId?.profilePicture} />
                                    <AvatarFallback className="bg-brand-primary text-white text-[10px] font-bold">
                                      {m.userId?.name?.substring(0, 2).toUpperCase() || '??'}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                                {activeAssignees.length > 3 && (
                                  <div className="w-8 h-8 rounded-full bg-modal-surface border-2 border-modal-bg shadow-sm flex items-center justify-center text-[10px] font-bold text-text-dim">
                                    +{activeAssignees.length - 3}
                                  </div>
                                )}
                              </div>
                              <span className="text-sm font-bold text-foreground truncate">
                                {activeAssignees.map(m => m.userId?.name).join(', ')}
                              </span>
                            </>
                          ) : (
                            <div className="flex items-center gap-2 text-text-dim">
                              <div className="w-8 h-8 rounded-full border-2 border-dashed border-modal-border flex items-center justify-center bg-modal-surface group-hover:border-brand-primary/40 group-hover:bg-brand-primary/5 transition-colors">
                                <UserPlus className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-sm font-bold opacity-60 group-hover:opacity-100 transition-opacity">Chưa được gán người thực hiện</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-8 h-8 rounded-xl bg-modal-surface flex items-center justify-center text-text-dim group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-all duration-300">
                            <Plus className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </PopoverTrigger>

                    <PopoverContent className="w-72 p-3 rounded-2xl border-modal-border shadow-2xl bg-modal-bg/95 backdrop-blur-xl" align="start">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between pb-2 border-b border-modal-border">
                          <span className="text-[10px] font-black text-text-dim uppercase tracking-widest">Chọn người thực hiện</span>
                          {assigneeIds.length > 0 && (
                            <button
                              onClick={() => setAssigneeIds([])}
                              className="text-[10px] text-red-400 hover:text-red-600 font-bold flex items-center gap-1 transition-colors"
                            >
                              <X className="w-3 h-3" /> Xóa hết
                            </button>
                          )}
                        </div>

                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {members.map(member => {
                            const mUserId = member.userId?._id || '';
                            const mUserName = member.userId?.name || 'Thành viên';
                            const mUserPic = member.userId?.profilePicture;
                            const isSelected = assigneeIds.includes(mUserId);

                            return (
                              <button
                                key={mUserId}
                                onClick={() => toggleAssignee(mUserId)}
                                className={cn(
                                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left",
                                  isSelected
                                    ? "bg-brand-primary/8 border border-brand-primary/20"
                                    : "hover:bg-modal-surface border border-transparent"
                                )}
                              >
                                <Avatar className="w-8 h-8 border border-modal-border shadow-sm shrink-0">
                                  <AvatarImage src={mUserPic} />
                                  <AvatarFallback className="text-[10px] font-bold bg-modal-surface text-text-dim">
                                    {mUserName?.[0]?.toUpperCase() || '?'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-bold text-foreground text-sm flex-1 truncate">{mUserName}</span>
                                <div className={cn(
                                  "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150 shrink-0",
                                  isSelected
                                    ? "bg-brand-primary border-brand-primary"
                                    : "border-modal-border"
                                )}>
                                  {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Section TAGS (Nhãn) - NEW */}
                <div className="space-y-3 col-span-2">
                  <label className="text-[11px] font-black text-text-dim uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="w-[2px] h-3 bg-brand-secondary rounded-full" />
                    <Tag className="w-3.5 h-3.5 text-brand-primary/80" /> Nhãn (Tags)
                  </label>
                  <div className="flex flex-wrap gap-2 items-center p-4 bg-input-bg border border-modal-border rounded-2xl min-h-[56px] group/tag-container relative">
                    {currentTags.map((tag: TagType) => (
                      <Badge 
                        key={tag._id}
                        style={{ backgroundColor: `${tag.color}15`, color: tag.color, borderColor: `${tag.color}30` }}
                        className="px-3 py-1 text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 rounded-lg group/item cursor-default"
                      >
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
                        {tag.name}
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleTag(tag._id); }}
                          className="hover:scale-125 transition-transform"
                        >
                          <X className="w-3 h-3 ml-1 cursor-pointer opacity-40 group-hover/item:opacity-100 transition-opacity" />
                        </button>
                      </Badge>
                    ))}
                    
                    <Popover
                      open={activeDropdown === 'tags'}
                      onOpenChange={(open) => setActiveDropdown(open ? 'tags' : null)}
                    >
                      <PopoverTrigger className={cn(
                        "h-7 px-2 text-text-dim hover:text-brand-primary rounded-lg text-[10px] font-black uppercase tracking-widest gap-1 flex items-center transition-colors",
                        activeDropdown === 'tags' && "text-brand-primary bg-brand-primary/5"
                      )}>
                        <Plus className="w-3 h-3" /> Thêm nhãn
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3 rounded-2xl border-modal-border shadow-2xl bg-modal-bg/95 backdrop-blur-xl" align="start">
                        <div className="space-y-2">
                          <div className="text-[10px] font-black text-text-dim uppercase tracking-widest pb-1 border-b border-modal-border">
                            Chọn Nhãn Công Việc
                          </div>
                          <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                            {availableTags.map((tag: TagType) => {
                              const isSelected = selectedTagIds.includes(tag._id);
                              return (
                                <button
                                  key={tag._id}
                                  onClick={() => toggleTag(tag._id)}
                                  className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left group/tag-btn",
                                    isSelected ? "bg-brand-primary/5" : "hover:bg-modal-surface"
                                  )}
                                >
                                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                                  <span className="text-[12px] font-bold text-foreground flex-1 truncate">{tag.name}</span>
                                  {isSelected && <Check className="w-3 h-3 text-brand-primary" strokeWidth={3} />}
                                </button>
                              );
                            })}
                            {availableTags.length === 0 && (
                              <p className="text-[10px] text-text-dim/60 italic p-3 text-center">Chưa có nhãn nào trong workspace này</p>
                            )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black text-text-dim uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="w-[2px] h-3 bg-brand-secondary rounded-full" />
                    <CalendarIcon className="w-3.5 h-3.5 text-brand-primary/80" /> Ngày bắt đầu
                  </label>
                  <Popover
                    open={activeDropdown === 'startDate'}
                    onOpenChange={(open) => setActiveDropdown(open ? 'startDate' : null)}
                  >
                    <PopoverTrigger
                      className={cn(
                        "w-full justify-start text-left font-bold text-sm px-4 h-14 border border-modal-border bg-input-bg hover:bg-modal-bg hover:border-brand-primary/20 transition-colors duration-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-brand-primary/10",
                        !startDate && "text-text-dim font-medium opacity-60"
                      )}
                    >
                      {startDate ? format(startDate, "dd/MM/yyyy") : <span>Chọn ngày bắt đầu</span>}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-2xl" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                        className="rounded-2xl"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black text-text-dim uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="w-[2px] h-3 bg-brand-secondary rounded-full" />
                    <Clock className="w-3.5 h-3.5 text-brand-primary/80" /> Hạn chót
                  </label>
                  <Popover
                    open={activeDropdown === 'dueDate'}
                    onOpenChange={(open) => setActiveDropdown(open ? 'dueDate' : null)}
                  >
                    <PopoverTrigger
                      className={cn(
                        "w-full justify-start text-left font-bold text-sm px-4 h-14 border border-modal-border bg-input-bg hover:bg-modal-bg hover:border-brand-primary/20 transition-colors duration-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-brand-primary/10",
                        !dueDate && "text-text-dim font-medium opacity-60"
                      )}
                    >
                      {dueDate ? format(dueDate, "dd/MM/yyyy") : <span>Chọn ngày hạn</span>}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-2xl" align="start">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                        initialFocus
                        className="rounded-2xl"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-3 col-span-2">
                  <label className="text-[11px] font-black text-text-dim uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="w-[2px] h-3 bg-brand-secondary rounded-full" />
                    <GitBranch className="w-3.5 h-3.5 text-brand-primary/80" /> Nhiệm vụ cha
                  </label>
                  <div className="w-full border border-modal-border bg-input-bg px-4 h-14 rounded-2xl transition-colors duration-200 shadow-sm flex items-center gap-3">
                    <GitBranch className="w-4 h-4 text-brand-primary/30" />
                    <span className={cn("text-sm font-bold", !parentId || parentId === 'none' ? "text-text-dim font-medium italic opacity-60" : "text-foreground")}>
                      {tasks?.find(t => t._id === parentId)?.title ||
                        (task?.parentId && typeof task.parentId === 'object' && (task.parentId as any)._id === parentId ? (task.parentId as any).title : "Không có")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-12 gap-y-8 bg-modal-section p-8 rounded-3xl border border-modal-border shadow-sm text-foreground">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                    <div className="w-[2px] h-3 bg-brand-secondary rounded-full" />
                    Ước tính (Giờ)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value ? Number(e.target.value) : '')}
                    className="h-12 border border-modal-border bg-input-bg hover:border-brand-primary/30 focus-visible:ring-2 focus-visible:ring-brand-primary/10 font-bold text-foreground text-lg px-4 rounded-2xl shadow-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-text-dim/40"
                    placeholder="0"
                    disabled={subtasks.length > 0}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                    <div className="w-[2px] h-3 bg-brand-secondary rounded-full" />
                    Đã log (Giờ)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={loggedHours}
                    onChange={(e) => setLoggedHours(e.target.value ? Number(e.target.value) : '')}
                    className="h-12 border border-modal-border bg-input-bg hover:border-brand-primary/30 focus-visible:ring-2 focus-visible:ring-brand-primary/10 font-bold text-foreground text-lg px-4 rounded-2xl shadow-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-text-dim/40"
                    placeholder="0"
                    disabled={subtasks.length > 0}
                  />
                </div>
              </div>

              {/* Editorial Description Area */}
              <div className="space-y-4 group text-foreground">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-foreground">
                    <div className="w-[2px] h-3 bg-brand-secondary rounded-full" />
                    <MessageSquare className="w-3.5 h-3.5 text-brand-primary/80" />
                    <span className="text-[11px] font-black uppercase tracking-[0.25em]">Mô tả nhiệm vụ</span>
                  </div>

                  <div className="flex items-center gap-1 bg-modal-surface border border-modal-border rounded-xl p-1 shadow-sm opacity-60 group-focus-within:opacity-100 transition-opacity duration-200">
                    <Button variant="ghost" size="icon" className="w-7 h-7 text-text-dim hover:text-brand-primary rounded-lg transition-colors">
                      <Bold className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-7 h-7 text-text-dim hover:text-brand-primary rounded-lg transition-colors">
                      <Italic className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-7 h-7 text-text-dim hover:text-brand-primary rounded-lg transition-colors">
                      <List className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-7 h-7 text-text-dim hover:text-brand-primary rounded-lg transition-colors">
                      <Link className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="relative group/editorial-editor">
                  <div className={cn(
                    "min-h-[220px] bg-input-bg border border-modal-border rounded-3xl p-6 shadow-sm transition-[border-color,box-shadow,background-color] duration-300",
                    "group-focus-within/editorial-editor:border-brand-primary/20 group-focus-within/editorial-editor:shadow-depth-2 group-focus-within/editorial-editor:bg-modal-bg"
                  )}>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Thêm mô tả chi tiết cho nhiệm vụ này... (Hỗ trợ Markdown)"
                      className="w-full h-full min-h-[170px] bg-transparent border-none p-0 text-[15px] text-foreground placeholder:text-text-dim/30 focus-visible:ring-0 resize-none leading-relaxed"
                    />
                    <div className="mt-4 flex items-center justify-end border-t border-modal-border pt-3">
                      <span className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest">Markdown Supported</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section ATTACHMENTS (Tệp đính kèm) - NEW */}
              <div className="space-y-4 pt-4 text-foreground">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-foreground">
                    <div className="w-[2px] h-3 bg-brand-secondary rounded-full" />
                    <Paperclip className="w-3.5 h-3.5 text-brand-primary/80" />
                    <span className="text-[11px] font-black uppercase tracking-[0.25em]">Tệp đính kèm ({attachments.length})</span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-[10px] font-black text-brand-primary uppercase tracking-widest hover:bg-brand-primary/5 rounded-xl px-3">
                    Tải lên tệp mới
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {attachments.map(file => (
                    <div key={file.id} className="group relative flex items-center gap-4 p-4 bg-modal-bg border border-modal-border rounded-2xl hover:border-brand-primary/20 hover:shadow-depth-1 transition-all duration-300">
                      <div className="w-12 h-12 rounded-xl bg-modal-surface flex items-center justify-center text-text-dim group-hover:text-brand-primary transition-colors">
                        {file.type === 'image' ? <ImageIcon className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{file.name}</p>
                        <p className="text-[10px] font-bold text-text-dim/60 uppercase">{file.size}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-text-dim hover:text-brand-primary"><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-text-dim hover:text-brand-primary"><Download className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6 pt-10 border-t border-modal-border/20 text-foreground">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-foreground/80 uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                    Nhiệm vụ Con (Subtasks)
                  </label>
                </div>
                {subtasks.length > 0 ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-3">
                      {subtasks.map(st => (
                        <div
                          key={st._id}
                          onClick={() => {
                            setSelectedSubtask(st);
                            setIsSubtaskModalOpen(true);
                          }}
                          className="flex items-center justify-between bg-modal-bg hover:bg-modal-surface hover:shadow-md transition-[background-color,box-shadow,border-color] duration-200 cursor-pointer text-sm p-5 rounded-2xl border border-modal-border shadow-sm group"
                        >
                          <div className="flex items-center gap-4">
                            <StatusBadge status={st.status} />
                            <span className={cn("font-bold text-foreground transition-colors group-hover:text-brand-primary", st.status === 'DONE' && "line-through opacity-40")}>
                              {st.title}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono font-black text-brand-primary/80 bg-brand-primary/5 px-2.5 py-1 rounded-full group-hover:bg-brand-secondary group-hover:text-brand-primary transition-colors">
                            {st.taskCode}
                          </div>
                        </div>
                      ))}
                    </div>

                    {subtaskTotalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-2xl hover:bg-modal-surface disabled:opacity-20"
                          disabled={subtaskPage === 1 || isLoadingSubtasks}
                          onClick={() => fetchSubtasks(subtaskPage - 1)}
                        >
                          <ChevronLeft className="w-5 h-5 text-text-dim" />
                        </Button>

                        <div className="flex items-center gap-2 px-3">
                          {Array.from({ length: subtaskTotalPages }, (_, i) => i + 1).map((p) => (
                            <Button
                              key={p}
                              variant={p === subtaskPage ? "default" : "ghost"}
                              size="sm"
                              className={cn(
                                "h-10 w-10 text-[12px] font-black rounded-2xl p-0 transition-[background-color,color,transform,box-shadow] duration-200",
                                p === subtaskPage
                                  ? "bg-brand-primary text-white shadow-xl shadow-brand-primary/20 scale-110"
                                  : "text-text-dim hover:text-brand-primary hover:bg-brand-primary/5"
                              )}
                              onClick={() => fetchSubtasks(p)}
                              disabled={isLoadingSubtasks}
                            >
                              {p}
                            </Button>
                          ))}
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-2xl hover:bg-modal-surface disabled:opacity-20"
                          disabled={subtaskPage === subtaskTotalPages || isLoadingSubtasks}
                          onClick={() => fetchSubtasks(subtaskPage + 1)}
                        >
                          <ChevronRight className="w-5 h-5 text-text-dim" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : isLoadingSubtasks ? (
                  <div className="flex items-center justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-primary/80" />
                  </div>
                ) : (
                  <div className="text-sm text-text-dim font-medium px-6 py-10 bg-modal-surface rounded-3xl border-2 border-dashed border-modal-border text-center">
                    Giao diện sạch sẽ. Không có công việc con nào.
                  </div>
                )}
              </div>

              {subtaskTotalCount > 0 && (
                <div className="mb-6 p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-center gap-3 transition-colors duration-200 hover:bg-amber-50">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-[11px] font-bold text-amber-800 leading-relaxed">
                    <span className="uppercase tracking-wider opacity-60 mr-2">Lưu ý:</span>
                    Giờ được tự động tổng hợp từ {subtaskTotalCount} công việc con để đảm bảo tính chính xác.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pb-12">
                <div className="flex items-center gap-4 w-full sm:w-1/2">
                  <Button
                    onClick={handleSave}
                    disabled={isUpdating}
                    className="flex-1 bg-brand-primary hover:bg-brand-primary/90 text-white font-black h-14 rounded-2xl shadow-xl shadow-brand-primary/20 transition-[background-color,transform,box-shadow] duration-200 active:scale-95 text-lg"
                  >
                    {isUpdating ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Save className="w-5 h-5 mr-2" />
                    )}
                    Lưu thay đổi
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="h-14 px-8 rounded-2xl border-modal-border text-text-dim font-bold hover:bg-modal-surface hover:text-foreground transition-[background-color,color,border-color] duration-200"
                  >
                    Đóng
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isActivityOpen && (
            <motion.div 
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-full sm:w-[350px] flex flex-col bg-modal-aside/80 backdrop-blur-3xl border-l border-modal-border z-[100] shadow-[-20px_0_50px_rgba(0,0,0,0.2)]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/5 to-transparent pointer-events-none z-0" />

              <div className="flex items-center justify-between p-6 pb-4 relative z-10">
                <h3 className="text-[11px] font-black text-text-dim uppercase tracking-[0.25em] flex items-center gap-3">
                  <div className="w-[2px] h-3 bg-brand-secondary rounded-full" />
                  <MessageSquare className="w-4 h-4 text-brand-primary/80" />
                  Activity Hub
                </h3>
              </div>

              <ScrollArea className="flex-1 min-h-0 relative z-10">
                <div className="px-6 py-4 space-y-6">
                  {/* Activity Input */}
                  <div className="space-y-2">
                    {replyToComment && (
                      <div className="flex items-center justify-between px-4 py-2 bg-brand-primary/5 border border-brand-primary/10 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="w-1 h-4 bg-brand-primary rounded-full shrink-0" />
                          <span className="text-[10px] font-black text-brand-primary uppercase tracking-wider shrink-0">Đang trả lời</span>
                          <span className="text-[11px] text-text-dim/60 truncate italic">
                            "{replyToComment.content.substring(0, 40)}{replyToComment.content.length > 40 ? '...' : ''}"
                          </span>
                        </div>
                        <button 
                          onClick={() => setReplyToComment(null)}
                          className="p-1 hover:bg-brand-primary/10 rounded-lg text-brand-primary transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <div className="relative group">
                      <textarea 
                        value={commentText}
                        onChange={handleCommentChange}
                        placeholder="Ghi lại tiến độ hoặc bình luận... (Gõ @ để nhắc tên)"
                        className="w-full min-h-[100px] bg-modal-bg/50 border border-modal-border rounded-2xl p-4 text-sm text-foreground placeholder:text-text-dim/40 focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary/20 transition-all resize-none leading-relaxed"
                      />
                      
                      {/* Mention Suggestion List - Floating Div (Positioned below textarea) */}
                      {showMentionList && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-modal-bg/95 backdrop-blur-3xl border border-modal-border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-[9999] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="p-3 border-b border-modal-border flex items-center justify-between bg-modal-surface/50">
                            <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Nhắc tên thành viên</span>
                          </div>
                          <ScrollArea className="max-h-48">
                            <div className="p-1">
                              {members
                                .filter(m => m.userId?.name?.toLowerCase().includes(mentionSearch.toLowerCase()))
                                .map(m => (
                                  <button
                                    key={m.userId?._id}
                                    onClick={() => insertMention(m.userId)}
                                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-brand-primary/10 transition-colors text-left"
                                  >
                                    <Avatar className="w-7 h-7 border border-modal-border">
                                      <AvatarImage src={m.userId?.profilePicture} />
                                      <AvatarFallback className="text-[8px] font-bold bg-modal-surface">
                                        {m.userId?.name?.substring(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-[12px] font-bold text-foreground">{m.userId?.name}</span>
                                  </button>
                                ))}
                              {members.filter(m => m.userId?.name?.toLowerCase().includes(mentionSearch.toLowerCase())).length === 0 && (
                                <div className="p-4 text-center text-[10px] text-text-dim font-bold italic">Không tìm thấy thành viên</div>
                              )}
                            </div>
                          </ScrollArea>
                        </div>
                      )}

                      <div className="absolute bottom-3 right-3 flex items-center gap-2">
                        <Popover>
                          <PopoverTrigger className="w-8 h-8 flex items-center justify-center rounded-lg text-text-dim hover:text-brand-primary transition-colors outline-none">
                            <Smile className="w-4 h-4" />
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 rounded-2xl border-modal-border bg-modal-bg/95 backdrop-blur-xl shadow-2xl overflow-hidden" side="top" align="end" sideOffset={8}>
                            <EmojiPicker 
                              onEmojiClick={(emojiData: any) => setCommentText(prev => prev + emojiData.emoji)}
                              theme={Theme.LIGHT}
                              lazyLoadEmojis={true}
                              skinTonesDisabled
                              searchPlaceHolder="Tìm emoji..."
                              width={300}
                              height={400}
                            />
                          </PopoverContent>
                        </Popover>
                        
                        <Button 
                          onClick={handleSendComment}
                          disabled={isSendingComment || !commentText.trim()}
                          className="h-8 px-4 bg-brand-primary hover:bg-brand-primary/90 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-brand-primary/10 disabled:opacity-50"
                        >
                          {isSendingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Gửi"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Activity List */}
                  <div className="space-y-6">
                    {isLoadingComments ? (
                      <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-brand-primary/40" /></div>
                    ) : comments.map((comment: any, idx: number) => {
                      const isSystem = comment.type === 'SYSTEM';
                      const isHighlighted = targetCommentId === comment._id;
                      
                      // [ĐẠI TRUNG TU] Logic trích xuất danh tính: Tin tưởng vào dữ liệu đã nạp từ Server
                      const resolveAuthor = () => {
                        // 1. Nếu authorId là object đầy đủ (Populated)
                        if (typeof comment.authorId === 'object' && comment.authorId !== null) {
                          return comment.authorId;
                        }
                        
                        // 2. Nếu là chính mình (So sánh string ID)
                        const rawId = comment.authorId?.toString();
                        if (rawId === currentUser?.id) return currentUser;
                        
                        // 3. Tra cứu trong danh sách thành viên dự án
                        return members.find(m => {
                          const mId = m.userId?._id?.toString() || m.userId?.id?.toString() || m.userId?.toString();
                          return mId === rawId;
                        })?.userId;
                      };

                      const author = resolveAuthor();
                      const authorName = author?.name || 'Thành viên';
                      const authorAvatar = author?.profilePicture || (author as any)?.avatar;
                      const timeStr = format(new Date(comment.createdAt), 'HH:mm, dd/MM', { locale: vi });

                      // Kiểm tra xem user hiện tại có quyền xóa không (là tác giả)
                      const authorId = author?._id?.toString() || author?.id?.toString();
                      const canDelete = !isSystem && authorId === currentUser?.id;

                      const handleDeleteComment = async (commentId: string) => {
                        try {
                          await interactionService.deleteComment(commentId);
                          toast.success('Đã xóa bình luận');
                          queryClient.invalidateQueries({ queryKey: ["task-comments", task?._id] });
                        } catch (error: any) {
                          toast.error(error.response?.data?.message || 'Không thể xóa bình luận');
                        }
                      };

                      const handleToggleReaction = async (commentId: string, emoji: string) => {
                        try {
                          await interactionService.toggleReaction(commentId, emoji);
                          queryClient.invalidateQueries({ queryKey: ["task-comments", task?._id] });
                        } catch (error: any) {
                          console.error('Failed to toggle reaction', error);
                        }
                      };

                      return (
                        <div 
                          key={comment._id} 
                          id={`comment-${comment._id}`}
                          className={cn(
                            "relative pl-8 group transition-all duration-500 rounded-2xl p-2 -ml-2",
                            isHighlighted && "bg-brand-primary/10 shadow-[0_0_20px_rgba(var(--brand-primary-rgb),0.1)] ring-1 ring-brand-primary/20"
                          )}
                        >
                          {/* Timeline Connector */}
                          {idx !== comments.length - 1 && (
                            <div className="absolute left-[11px] top-6 bottom-[-24px] w-[1px] bg-modal-border group-hover:bg-brand-primary/20 transition-colors" />
                          )}
                          
                          {/* Timeline Point */}
                          <div className={cn(
                            "absolute left-0 top-1.5 w-[22px] h-[22px] rounded-full border-2 border-modal-bg shadow-sm z-10 flex items-center justify-center transition-all duration-300",
                            "bg-modal-surface group-hover:border-brand-primary/40",
                            isHighlighted && "border-brand-primary shadow-glow-sm"
                          )}>
                            <Avatar className="w-full h-full">
                              <AvatarImage src={authorAvatar} />
                              <AvatarFallback className="text-[8px] font-black text-brand-primary bg-brand-primary/5">
                                {authorName?.substring(0, 2).toUpperCase() || '??'}
                              </AvatarFallback>
                            </Avatar>
                          </div>

                          <div className="space-y-1 flex-1">
                            <div className="flex items-center justify-between h-5">
                              <div className="flex items-center gap-2">
                                <span className="text-[12px] font-black text-foreground leading-none">{authorName}</span>
                                <span className="text-[10px] font-bold text-text-dim/40 uppercase tracking-tighter leading-none">{timeStr}</span>
                                {isHighlighted && (
                                  <Badge className="bg-brand-primary text-[8px] h-4 px-1.5 font-black uppercase tracking-widest animate-pulse">Mới</Badge>
                                )}
                              </div>
                              
                              {canDelete && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteComment(comment._id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1.5 text-text-dim/30 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                                  title="Xóa bình luận"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            
                            {isSystem ? (
                              <div className="flex items-center gap-2 text-[11px] text-text-dim/60 italic leading-relaxed">
                                <span>{comment.content}</span>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className={cn(
                                  "bg-modal-bg/40 border border-modal-border/50 p-3 rounded-2xl rounded-tl-none shadow-sm group-hover:bg-modal-bg/60 transition-colors",
                                  isHighlighted && "bg-brand-primary/5 border-brand-primary/20"
                                )}>
                                  {comment.replyTo && (
                                    <div className="mb-2 flex items-center gap-1.5 px-2 py-1 bg-brand-primary/5 rounded-lg border border-brand-primary/10 w-fit">
                                      <GitBranch className="w-2.5 h-2.5 text-brand-primary/60 rotate-180" />
                                      <span className="text-[9px] font-bold text-brand-primary/80 uppercase tracking-tighter">Trả lời</span>
                                      <span className="text-[9px] text-text-dim/40 italic truncate max-w-[150px]">
                                        {(typeof comment.replyTo === 'object' ? (comment.replyTo.authorId?.name || 'Ai đó') : 'bình luận cũ')}
                                      </span>
                                    </div>
                                  )}
                                  <p className="text-[13px] text-text-dim leading-relaxed whitespace-pre-wrap">
                                    {comment.content}
                                  </p>
                                  <div className="mt-2 flex items-center gap-3">
                                    <button 
                                      onClick={() => {
                                        setReplyToComment(comment);
                                        const author = resolveAuthor();
                                        if (author?.name) {
                                          setCommentText(`@${author.name} `);
                                          setMentionedUserIds(prev => [...new Set([...prev, author._id || author.id])]);
                                        }
                                        // Scroll to top of activity input for focus
                                        const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]');
                                        if (scrollArea) scrollArea.scrollTo({ top: 0, behavior: 'smooth' });
                                      }}
                                      className="text-[9px] font-black text-text-dim hover:text-brand-primary uppercase tracking-widest transition-colors"
                                    >
                                      Phản hồi
                                    </button>
                                    
                                    <Popover>
                                      <PopoverTrigger className="flex items-center gap-1 text-[9px] font-black text-text-dim hover:text-brand-primary uppercase tracking-widest transition-colors outline-none">
                                        <Smile className="w-3.5 h-3.5" />
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-1.5 rounded-full border-modal-border bg-modal-bg/95 backdrop-blur-xl shadow-2xl" side="top" align="start" sideOffset={8}>
                                        <div className="flex items-center gap-1">
                                          {['👍', '❤️', '😂', '😮', '😢'].map((emoji) => (
                                            <motion.button
                                              key={emoji}
                                              whileHover={{ scale: 1.3, y: -2 }}
                                              whileTap={{ scale: 0.9 }}
                                              onClick={() => handleToggleReaction(comment._id, emoji)}
                                              className="w-8 h-8 flex items-center justify-center text-xl hover:bg-brand-primary/10 rounded-full transition-colors"
                                            >
                                              {emoji}
                                            </motion.button>
                                          ))}
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                  </div>
                                </div>

                                {/* Hiển thị các reactions đã có */}
                                {comment.reactions && comment.reactions.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 px-1">
                                    {comment.reactions.map((reaction: any) => {
                                      const hasReacted = reaction.userIds.includes(currentUser?.id);
                                      return (
                                        <button
                                          key={reaction.emoji}
                                          onClick={() => handleToggleReaction(comment._id, reaction.emoji)}
                                          className={cn(
                                            "flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-bold transition-all duration-200",
                                            hasReacted 
                                              ? "bg-brand-primary/10 border-brand-primary/30 text-brand-primary shadow-sm scale-105" 
                                              : "bg-modal-surface border-modal-border text-text-dim hover:border-brand-primary/20"
                                          )}
                                        >
                                          <span>{reaction.emoji}</span>
                                          <span>{reaction.userIds.length}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </ScrollArea>
              
              <div className="p-6 pt-4 border-t border-modal-border bg-modal-surface/30 backdrop-blur-sm relative z-10">
                <div className="flex items-center justify-between text-[10px] font-black text-text-dim/40 uppercase tracking-[0.2em]">
                  <span>Viewing All History</span>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-[9px] font-black text-brand-primary border border-brand-primary/20 rounded-lg hover:bg-brand-primary/5 transition-colors">
                    Export Log
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isOpen && (
          <SubtaskEditModal
            isOpen={isSubtaskModalOpen}
            onClose={() => setIsSubtaskModalOpen(false)}
            subtask={selectedSubtask}
            onUpdate={refreshSubtasks}
            members={members}
            onActivityUpdate={refreshTaskData}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
