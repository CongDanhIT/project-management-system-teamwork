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
import { toast } from 'sonner';

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

  // MOCK DATA for tags and attachments
  const [taskTags, setTaskTags] = useState([
    { id: '1', name: 'Giao diện', color: '#00d2d3' },
    { id: '2', name: 'Ưu tiên cao', color: '#ff4d4d' },
  ]);

  const [attachments, setAttachments] = useState([
    { id: '1', name: 'design_specs.pdf', size: '2.4 MB', type: 'pdf', url: '#' },
    { id: '2', name: 'hero_section.png', size: '1.8 MB', type: 'image', url: '#' },
  ]);

  const MOCK_ACTIVITIES = [
    { id: '1', user: 'Hoàng Nam', action: 'đã thay đổi trạng thái thành', target: 'Đang thực hiện', time: '5 phút trước', avatar: '' },
    { id: '2', user: 'Linh Chi', action: 'đã thêm bình luận', target: 'Cần kiểm tra kỹ phần responsive trên mobile nhé.', time: '15 phút trước', avatar: '' },
    { id: '3', user: 'Bùi Công Danh', action: 'đã đính kèm tệp', target: 'workflow_v2.fig', time: '1 giờ trước', avatar: '' },
  ];

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
    }
  }, [task]);

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

  const activeAssignees = Array.isArray(members) 
    ? members.filter(m => {
        const mUserId = m.userId?._id || '';
        return assigneeIds.includes(mUserId);
      })
    : [];

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
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary/40" /> Trạng thái
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
                    <AlertCircle className="w-3.5 h-3.5 text-brand-primary/40" /> Ưu tiên
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
                    <User className="w-3.5 h-3.5 text-brand-primary/40" /> Người thực hiện
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
                    <Tag className="w-3.5 h-3.5 text-brand-primary/40" /> Nhãn (Tags)
                  </label>
                  <div className="flex flex-wrap gap-2 items-center p-4 bg-input-bg border border-modal-border rounded-2xl min-h-[56px]">
                    {taskTags.map(tag => (
                      <Badge 
                        key={tag.id}
                        style={{ backgroundColor: `${tag.color}15`, color: tag.color, borderColor: `${tag.color}30` }}
                        className="px-3 py-1 text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 rounded-lg group cursor-default"
                      >
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
                        {tag.name}
                        <X className="w-3 h-3 ml-1 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Badge>
                    ))}
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-text-dim hover:text-brand-primary rounded-lg text-[10px] font-black uppercase tracking-widest gap-1">
                      <Plus className="w-3 h-3" /> Thêm nhãn
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black text-text-dim uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="w-[2px] h-3 bg-brand-secondary rounded-full" />
                    <CalendarIcon className="w-3.5 h-3.5 text-brand-primary/40" /> Ngày bắt đầu
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
                    <Clock className="w-3.5 h-3.5 text-brand-primary/40" /> Hạn chót
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
                    <GitBranch className="w-3.5 h-3.5 text-brand-primary/40" /> Nhiệm vụ cha
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
                    <MessageSquare className="w-3.5 h-3.5 text-brand-primary/40" />
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
                    <Paperclip className="w-3.5 h-3.5 text-brand-primary/40" />
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
                          <div className="text-[10px] font-mono font-black text-brand-primary/40 bg-brand-primary/5 px-2.5 py-1 rounded-full group-hover:bg-brand-secondary group-hover:text-brand-primary transition-colors">
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
                    <Loader2 className="w-8 h-8 animate-spin text-brand-primary/40" />
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
                  <MessageSquare className="w-4 h-4 text-brand-primary/40" />
                  Activity Hub
                </h3>
              </div>

              <ScrollArea className="flex-1 min-h-0 relative z-10">
                <div className="px-6 py-4 space-y-6">
                  {/* Activity Input */}
                  <div className="relative group">
                    <textarea 
                      placeholder="Ghi lại tiến độ hoặc bình luận..."
                      className="w-full min-h-[100px] bg-modal-bg/50 border border-modal-border rounded-2xl p-4 text-sm text-foreground placeholder:text-text-dim/40 focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary/20 transition-all resize-none leading-relaxed"
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                       <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-text-dim hover:text-brand-primary transition-colors">
                        <Smile className="w-4 h-4" />
                      </Button>
                      <Button className="h-8 px-4 bg-brand-primary hover:bg-brand-primary/90 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-brand-primary/10">
                        Gửi
                      </Button>
                    </div>
                  </div>

                  {/* Activity List */}
                  <div className="space-y-6">
                    {MOCK_ACTIVITIES.map((activity, idx) => (
                      <div key={activity.id} className="relative pl-8 group">
                        {/* Timeline Connector */}
                        {idx !== MOCK_ACTIVITIES.length - 1 && (
                          <div className="absolute left-[11px] top-6 bottom-[-24px] w-[1px] bg-modal-border group-hover:bg-brand-primary/20 transition-colors" />
                        )}
                        
                        {/* Timeline Point */}
                        <div className="absolute left-0 top-1.5 w-[22px] h-[22px] rounded-full border-2 border-modal-bg bg-modal-surface shadow-sm z-10 flex items-center justify-center group-hover:border-brand-primary/40 transition-colors">
                          <Avatar className="w-full h-full">
                            <AvatarImage src={activity.avatar} />
                            <AvatarFallback className="text-[8px] font-black text-brand-primary">
                              {activity.user.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-black text-foreground">{activity.user}</span>
                            <span className="text-[10px] font-bold text-text-dim/40 uppercase tracking-tighter">{activity.time}</span>
                          </div>
                          <p className="text-[13px] text-text-dim leading-relaxed">
                            {activity.action} <span className="text-foreground font-bold">{activity.target}</span>
                          </p>
                        </div>
                      </div>
                    ))}
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
