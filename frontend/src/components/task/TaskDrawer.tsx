'use client';

import React, { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { StatusBadge } from '../shared/StatusBadge';
import { PriorityBadge } from '../shared/PriorityBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, User, Trash2, Clock, CheckCircle2, AlertCircle, Loader2, Save, Plus, ChevronLeft, ChevronRight, GitBranch, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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

interface TaskDrawerProps {
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

export const TaskDrawer: React.FC<TaskDrawerProps> = ({
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

      // [MULTI-ASSIGNEE] Khởi tạo assigneeIds
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
    fetchSubtasks(1);
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
      await onUpdate(task._id, {
        title,
        description,
        status,
        priority,
        assignedTo: assigneeIds, // [MULTI-ASSIGNEE]
        dueDate: dueDate?.toISOString() || null,
        startDate: startDate?.toISOString() || null,
        estimatedHours: estimatedHours === '' ? 0 : Number(estimatedHours),
        loggedHours: loggedHours === '' ? 0 : Number(loggedHours),
        parentId: parentId === 'none' ? null : parentId,
      });
      toast.success("Đã cập nhật công việc thành công");
      onClose();
    } finally {
      setIsUpdating(false);
    }
  };

  // [MULTI-ASSIGNEE] Toggle
  const toggleAssignee = (userId: string) => {
    setAssigneeIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const activeAssignees = members.filter(m => assigneeIds.includes(m.userId?._id || ''));

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-[540px] p-0 border-l border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-2xl">
        <div className="h-full overflow-y-auto scroll-smooth custom-scrollbar bg-modal-surface">
          <div className="p-6 sm:p-8 space-y-8">
            <div className="bg-modal-section border border-modal-border rounded-[24px] p-6 shadow-sm space-y-4">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] bg-brand-primary/10 px-2.5 py-1 rounded-lg">
                    {task?.taskCode}
                  </span>
                  <div className="flex items-center gap-1">
                    {isAdminOrOwner && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => task && onDelete(task._id)}
                        className="w-8 h-8 text-text-dim/40 hover:text-red-500 hover:bg-red-50/50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={onClose}
                      className="w-8 h-8 text-text-dim/40 hover:text-foreground hover:bg-modal-surface rounded-lg transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
               </div>

               <div className="relative group/title">
                  <Input 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-2xl font-black text-foreground border-none p-0 focus-visible:ring-0 shadow-none bg-transparent h-auto max-w-full placeholder:text-text-dim/20 tracking-tight leading-tight"
                    placeholder="Tiêu đề công việc..."
                  />
                  <div className="absolute -bottom-2 left-0 w-8 h-0.5 bg-brand-primary/20 rounded-full scale-x-0 group-focus-within/title:scale-x-100 transition-transform origin-left duration-300" />
               </div>
            </div>

            <div className="space-y-8">
              {/* Info Matrix */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-8 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3" /> Trạng thái
                  </label>
                  <Select value={status} onValueChange={(val) => {
                    const newStatus = val as TaskStatus;
                    setStatus(newStatus);
                  }}>
                    <SelectTrigger className="w-full border border-slate-200/60 bg-slate-50/50 hover:bg-white transition-all px-3 h-10 rounded-xl shadow-inner shadow-slate-200/50 focus:ring-1 focus:ring-brand-primary/80">
                      <div className="flex items-center gap-2">
                         <StatusBadge status={status} />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TaskStatus.TODO}>Cần làm</SelectItem>
                      <SelectItem value={TaskStatus.IN_PROGRESS}>Đang thực hiện</SelectItem>
                      <SelectItem value={TaskStatus.INREVIEW}>Đang duyệt</SelectItem>
                      <SelectItem value={TaskStatus.DONE}>Hoàn thành</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3" /> Ưu tiên
                  </label>
                  <Select value={priority} onValueChange={(val) => {
                    const newPriority = val as TaskPriority;
                    setPriority(newPriority);
                  }}>
                    <SelectTrigger className="w-full border border-slate-200/60 bg-slate-50/50 hover:bg-white transition-all px-3 h-10 rounded-xl shadow-inner shadow-slate-200/50 focus:ring-1 focus:ring-brand-primary/80">
                      <PriorityBadge priority={priority} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TaskPriority.LOW}>Thấp</SelectItem>
                      <SelectItem value={TaskPriority.MEDIUM}>Trung bình</SelectItem>
                      <SelectItem value={TaskPriority.HIGH}>Cao</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* [MULTI-ASSIGNEE] Multi-select Assignee Picker */}
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <User className="w-3 h-3" /> Người thực hiện
                    {assigneeIds.length > 0 && (
                      <span className="ml-auto bg-brand-primary/10 text-brand-primary text-[9px] font-bold px-2 py-0.5 rounded-full">
                        {assigneeIds.length}
                      </span>
                    )}
                  </label>
                  <Popover>
                    <PopoverTrigger>
                      <div className="w-full border border-slate-200/60 bg-slate-50/50 hover:bg-white transition-all px-3 h-10 rounded-xl shadow-inner shadow-slate-200/50 focus:ring-1 focus:ring-brand-primary/80 flex items-center gap-2 text-left cursor-pointer">
                        {activeAssignees.length > 0 ? (
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="flex -space-x-1.5 shrink-0">
                              {activeAssignees.slice(0, 2).map(m => (
                                <Avatar key={m.userId?._id} className="w-6 h-6 border-2 border-white shadow-sm">
                                  <AvatarImage src={m.userId?.profilePicture} />
                                  <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-[8px] font-bold">
                                    {m.userId?.name?.substring(0, 2).toUpperCase() || '??'}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {activeAssignees.length > 2 && (
                                <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-500">
                                  +{activeAssignees.length - 2}
                                </div>
                              )}
                            </div>
                            <span className="text-sm font-bold text-slate-700 truncate">
                              {activeAssignees.map(m => m.userId?.name).join(', ')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm font-medium text-slate-400 px-1">Chưa được gán</span>
                        )}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3 rounded-2xl border-slate-100 shadow-xl" align="start">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chọn thành viên</span>
                          {assigneeIds.length > 0 && (
                            <button onClick={() => setAssigneeIds([])} className="text-[10px] text-red-400 hover:text-red-600 font-bold flex items-center gap-1">
                              <X className="w-3 h-3" /> Xóa hết
                            </button>
                          )}
                        </div>
                        <div className="space-y-0.5 max-h-40 overflow-y-auto">
                          {members.map(member => {
                            const mUserId = member.userId?._id || '';
                            const mUserName = member.userId?.name || 'Thành viên';
                            const isSelected = assigneeIds.includes(mUserId);
                            return (
                              <button
                                key={mUserId}
                                onClick={() => toggleAssignee(mUserId)}
                                className={cn(
                                  "w-full flex items-center gap-2.5 px-2 py-2 rounded-lg transition-all text-left",
                                  isSelected ? "bg-brand-primary/8 border border-brand-primary/20" : "hover:bg-slate-50 border border-transparent"
                                )}
                              >
                                <Avatar className="w-7 h-7 border border-slate-100 shrink-0">
                                  <AvatarImage src={member.userId?.profilePicture} />
                                  <AvatarFallback className="text-[10px]">{mUserName?.[0]}</AvatarFallback>
                                </Avatar>
                                <span className="font-bold text-slate-700 text-xs flex-1 truncate">{mUserName}</span>
                                <div className={cn(
                                  "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0",
                                  isSelected ? "bg-brand-primary border-brand-primary" : "border-slate-200"
                                )}>
                                  {isSelected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <CalendarIcon className="w-3 h-3" /> Ngày bắt đầu
                  </label>
                  <Popover>
                    <PopoverTrigger
                      className={cn(
                        "w-full justify-start text-left font-bold text-sm px-3 h-10 border border-slate-200/60 bg-slate-50/50 hover:bg-white rounded-xl shadow-inner shadow-slate-200/50 transition-all focus:ring-1 focus:ring-brand-primary/80",
                        !startDate && "text-slate-400"
                      )}
                    >
                      {startDate ? (
                        format(startDate, "dd/MM/yyyy")
                      ) : (
                        <span>Chọn ngày bắt đầu</span>
                      )}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          setStartDate(date);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> Hạn chót
                  </label>
                  <Popover>
                    <PopoverTrigger
                      className={cn(
                        "w-full justify-start text-left font-bold text-sm px-3 h-10 border border-slate-200/60 bg-slate-50/50 hover:bg-white rounded-xl shadow-inner shadow-slate-200/50 transition-all focus:ring-1 focus:ring-brand-primary/80",
                        !dueDate && "text-slate-400"
                      )}
                    >
                      {dueDate ? (
                        format(dueDate, "dd/MM/yyyy")
                      ) : (
                        <span>Chọn ngày hạn</span>
                      )}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={(date) => {
                          setDueDate(date);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2 col-span-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <GitBranch className="w-3 h-3" /> Nhiệm vụ cha
                  </label>
                  <div className="w-full border border-slate-200/60 bg-slate-50/50 px-3 h-10 rounded-xl shadow-inner shadow-slate-200/50 flex items-center gap-2">
                    <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                    <span className={cn("text-sm font-bold", !parentId || parentId === 'none' ? "text-slate-400 font-medium" : "text-slate-700")}>
                      {tasks?.find(t => t._id === parentId)?.title || 
                       (task?.parentId && typeof task.parentId === 'object' && (task.parentId as any)._id === parentId ? (task.parentId as any).title : "Không có")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Time Tracking */}
              <div className="grid grid-cols-2 gap-x-12 gap-y-8 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50">
                 <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Ước tính (Giờ)
                  </label>
                  <Input 
                    type="number"
                    min="0"
                    step="any"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value ? Number(e.target.value) : '')}
                    className="h-10 border border-slate-200/60 bg-slate-50/50 hover:bg-white focus-visible:ring-1 focus-visible:ring-brand-primary/80 font-bold px-3 rounded-xl shadow-inner shadow-slate-200/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-slate-200 placeholder:font-normal"
                    placeholder="VD: 8"
                    disabled={subtasks.length > 0}
                  />
                 </div>
                 <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Đã log (Giờ)
                  </label>
                  <Input 
                    type="number"
                    min="0"
                    step="any"
                    value={loggedHours}
                    onChange={(e) => setLoggedHours(e.target.value ? Number(e.target.value) : '')}
                    className="h-10 border border-slate-200/60 bg-slate-50/50 hover:bg-white focus-visible:ring-1 focus-visible:ring-brand-primary/80 font-bold px-3 rounded-xl shadow-inner shadow-slate-200/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-slate-200 placeholder:font-normal"
                    placeholder="VD: 4.5"
                    disabled={subtasks.length > 0}
                  />
                 </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Mô tả công việc
                </label>
                <Textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Thêm mô tả chi tiết cho công việc này..."
                  className="min-h-[200px] border-slate-200/60 bg-white/50 focus:ring-brand-primary/80 rounded-xl resize-none py-4"
                />
              </div>

              {/* Subtasks */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Nhiệm vụ Con (Subtasks)
                  </label>
                </div>
                {subtasks.length > 0 ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {subtasks.map(st => (
                        <div 
                          key={st._id} 
                          onClick={() => {
                            setSelectedSubtask(st);
                            setIsSubtaskModalOpen(true);
                          }}
                          className="flex items-center justify-between bg-white hover:bg-slate-50 hover:border-brand-primary/10 transition-all cursor-pointer text-sm p-3 rounded-xl border border-slate-200 shadow-sm group"
                        >
                           <div className="flex items-center gap-3">
                             <StatusBadge status={st.status} />
                             <span className={cn("font-bold text-slate-700 group-hover:text-brand-primary transition-colors", st.status === 'DONE' && "line-through opacity-50")}>
                               {st.title}
                             </span>
                           </div>
                           <div className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                             {st.taskCode}
                           </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination UI */}
                    {subtaskTotalPages > 1 && (
                      <div className="flex items-center justify-center gap-1.5 pt-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-xl hover:bg-slate-100 disabled:opacity-30"
                          disabled={subtaskPage === 1 || isLoadingSubtasks}
                          onClick={() => fetchSubtasks(subtaskPage - 1)}
                        >
                          <ChevronLeft className="w-4 h-4 text-slate-600" />
                        </Button>
                        
                        <div className="flex items-center gap-1.5 px-2">
                          {Array.from({ length: subtaskTotalPages }, (_, i) => i + 1).map((p) => (
                            <Button
                              key={p}
                              variant={p === subtaskPage ? "default" : "ghost"}
                              size="sm"
                              className={cn(
                                "h-8 w-8 text-[11px] font-bold rounded-xl p-0 transition-all",
                                p === subtaskPage 
                                  ? "bg-brand-primary text-white shadow-md shadow-brand-primary/10" 
                                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
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
                          className="h-8 w-8 rounded-xl hover:bg-slate-100 disabled:opacity-30"
                          disabled={subtaskPage === subtaskTotalPages || isLoadingSubtasks}
                          onClick={() => fetchSubtasks(subtaskPage + 1)}
                        >
                          <ChevronRight className="w-4 h-4 text-slate-600" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : isLoadingSubtasks ? (
                  <div className="flex items-center justify-center p-8">
                     <Loader2 className="w-6 h-6 animate-spin text-brand-primary/80" />
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic px-2 py-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-center">
                    Không có công việc con nào.
                  </div>
                )}
              </div>

              {/* Update Button */}
              <div className="pt-4 flex items-center gap-3">
                <Button 
                  onClick={handleSave} 
                  disabled={isUpdating}
                  className="flex-1 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold h-12 rounded-xl shadow-lg shadow-brand-primary/20 transition-all active:scale-95"
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Cập nhật thay đổi
                </Button>
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="h-12 px-6 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Hủy
                </Button>
              </div>

              {/* Timeline Info */}
              <div className="pt-8 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                 <div className="flex flex-col">
                    <span>Được tạo vào</span>
                    <span className="text-slate-900 mt-1">{task && format(new Date(task.createdAt), 'PPp', { locale: vi })}</span>
                 </div>
                 <div className="flex flex-col text-right">
                    <span>Cập nhật lần cuối</span>
                    <span className="text-slate-900 mt-1">{task && format(new Date(task.updatedAt), 'PPp', { locale: vi })}</span>
                 </div>
              </div>
              {subtaskTotalCount > 0 && (
                <div className="text-[10px] text-brand-primary/80 font-bold px-4 -mt-4 mb-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Giờ được tự động tính từ {subtaskTotalCount} công việc con
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Subtask Dialog */}
        <SubtaskEditModal 
          isOpen={isSubtaskModalOpen}
          subtask={selectedSubtask}
          onClose={() => setIsSubtaskModalOpen(false)}
          onUpdate={() => {
            refreshSubtasks();
            refreshTaskData();
            onSubtaskUpdate?.();
          }}
          members={members}
        />
      </SheetContent>
    </Sheet>
  );
};
