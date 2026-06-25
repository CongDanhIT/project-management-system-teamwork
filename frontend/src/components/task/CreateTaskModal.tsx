'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { Project } from '@/services/project.service';
import { taskService } from '@/services/task.service';
import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { 
  Calendar as CalendarIcon, 
  Sparkles, 
  Loader2, 
  Plus, 
  ChevronRight, 
  Layout, 
  GitBranch 
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from '@/lib/utils';
import { suggestTaskDescription, suggestSubtasks } from '@/services/ai.service';
import { tagService } from '@/services/tag.service';
import { workspaceService } from '@/services/workspace.service';
import { Tag as TagType } from '@/types/task';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tag as TagIcon, Check, X, Users, Clock } from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onSubmit: (projectId: string, data: any) => Promise<void>;
  parentId?: string;
  initialStatus?: TaskStatus;
  workspaceId?: string; // Dùng để fetch tasks và members
  phaseId?: string; // [FIX] Liên kết task với Phase hiện tại
  defaultProjectId?: string; // [FIX] Liên kết task với Dự án hiện tại
  projectName?: string; // [NEW] Hiển thị trong breadcrumb
  phaseName?: string; // [NEW] Hiển thị trong breadcrumb
  isAdminOrOwner?: boolean; // [NEW] Phân quyền cho option phê duyệt
  defaultAssigneeId?: string; // [NEW] Gán sẵn người thực hiện
}

const getInitials = (name: string) => {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 
    'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 
    'bg-orange-500', 'bg-indigo-500'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  projects,
  onSubmit,
  parentId,
  initialStatus = TaskStatus.TODO,
  workspaceId,
  phaseId,
  defaultProjectId,
  projectName,
  phaseName,
  isAdminOrOwner = false,
  defaultAssigneeId,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState<string>(defaultProjectId || '');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [estimatedHours, setEstimatedHours] = useState<number | ''>('');
  const [loggedHours, setLoggedHours] = useState<number | ''>('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [hasDueTime, setHasDueTime] = useState(false);
  const [dueTime, setDueTime] = useState('23:59');
  const [selectedParentId, setSelectedParentId] = useState<string>(parentId || 'none');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>(defaultAssigneeId ? [defaultAssigneeId] : []);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // === AI States ===
  const [isAiDescLoading, setIsAiDescLoading] = useState(false);
  const [isAiSubtasksLoading, setIsAiSubtasksLoading] = useState(false);
  const [aiSubtaskSuggestions, setAiSubtaskSuggestions] = useState<string[]>([]);
  const [selectedSubtasks, setSelectedSubtasks] = useState<string[]>([]);

  const handleAiSuggestDescription = async () => {
    if (!title.trim()) {
      toast.warning('Vui lòng nhập tiêu đề trước khi dùng AI gợi ý');
      return;
    }
    setIsAiDescLoading(true);
    try {
      const suggested = await suggestTaskDescription(title);
      setDescription(suggested);
      toast.success('AI đã gợi ý mô tả thành công!');
    } catch {
      toast.error('Không thể kết nối AI, thử lại sau.');
    } finally {
      setIsAiDescLoading(false);
    }
  };

  const handleAiSuggestSubtasks = async () => {
    if (!title.trim()) {
      toast.warning('Vui lòng nhập tiêu đề trước khi dùng AI gợi ý');
      return;
    }
    setIsAiSubtasksLoading(true);
    try {
      const subtasks = await suggestSubtasks(title);
      setAiSubtaskSuggestions(subtasks);
    } catch {
      toast.error('Không thể kết nối AI, thử lại sau.');
    } finally {
      setIsAiSubtasksLoading(false);
    }
  };

  // Fetch parent tasks
  const { data: parentTasksData } = useQuery({
    queryKey: ['workspace-tasks', 'project', workspaceId, projectId],
    queryFn: () => taskService.getProjectTasks(workspaceId!, projectId, { pageSize: 1000 }), // Lấy nhiều để chọn parent
    enabled: !!workspaceId && !!projectId,
  });
  const availableParentTasks = (parentTasksData?.tasks || []).filter(t => !t.parentId);

  // Fetch available tags
  const { data: availableTags = [] } = useQuery({
    queryKey: ['workspace-tags', workspaceId],
    queryFn: () => tagService.getTags(workspaceId!, 'TASK'),
    enabled: !!workspaceId,
  });

  // Fetch workspace members
  const { data: membersData } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => workspaceService.getMembers(workspaceId!),
    enabled: !!workspaceId,
  });
  const availableMembers = membersData?.members || [];

  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const toggleAssignee = (memberId: string) => {
    setSelectedAssigneeIds(prev =>
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  const currentTags = availableTags.filter(tag => selectedTagIds.includes(tag._id));
  const currentAssignees = availableMembers.filter((m: any) => selectedAssigneeIds.includes(m.userId?._id || m.userId?.id));

  // Set default project when list changes
  React.useEffect(() => {
    if (isOpen) {
      if (defaultProjectId) {
        setProjectId(defaultProjectId);
      } else if (projects.length > 0 && !projectId) {
        setProjectId(projects[0]._id);
      }
    }
  }, [isOpen, defaultProjectId, projects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề");
      return;
    }

    if (!projectId) {
      toast.error("Vui lòng chọn dự án");
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(projectId, {
        title,
        description,
        priority,
        status: initialStatus,
        estimatedHours: estimatedHours === '' ? 0 : Number(estimatedHours),
        loggedHours: loggedHours === '' ? 0 : Number(loggedHours),
        startDate: startDate ? (() => {
          const d = new Date(startDate);
          d.setHours(0, 0, 0, 0);
          return d.toISOString();
        })() : undefined,
        dueDate: selectedParentId === 'none' ? (dueDate ? (() => {
          const d = new Date(dueDate);
          if (hasDueTime) {
            const [hours, minutes] = dueTime.split(':').map(Number);
            d.setHours(hours, minutes, 0, 0);
          } else {
            d.setHours(23, 59, 59, 999);
          }
          return d.toISOString();
        })() : undefined) : null,
        parentId: selectedParentId === 'none' ? undefined : selectedParentId,
        subtasks: selectedSubtasks, // Truyền danh sách subtask đã chọn
        tags: selectedTagIds,
        assignedTo: selectedAssigneeIds,
        phaseId: phaseId, // [FIX] Gửi phaseId lên backend
        requiresApproval: requiresApproval, // [NEW] Quy trình phê duyệt
      });
      setTitle('');
      setDescription('');
      setPriority(TaskPriority.MEDIUM);
      setEstimatedHours('');
      setLoggedHours('');
      setStartDate(undefined);
      setDueDate(undefined);
      setHasDueTime(false);
      setDueTime('23:59');
      setSelectedParentId('none');
      setSelectedSubtasks([]);
      setAiSubtaskSuggestions([]);
      setSelectedTagIds([]);
      setSelectedAssigneeIds(defaultAssigneeId ? [defaultAssigneeId] : []);
      setRequiresApproval(false);
      onClose();
    } catch (error) {
      toast.error("Lỗi khi tạo công việc");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[92vh] p-0 overflow-hidden bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border border-white/50 dark:border-white/10 shadow-depth-3 rounded-[2.5rem] flex flex-col transition-all duration-500">
        <div className="p-8 pb-4 relative">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-brand-primary/5 to-transparent pointer-events-none" />
          <DialogHeader>
            <div className="flex items-center gap-2 mb-6 group cursor-default">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                <span>Workspace</span>
              </div>
              <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-700" />
              <div className="flex items-center gap-1.5 text-[10px] font-black text-brand-primary uppercase tracking-widest">
                <Layout className="w-3 h-3" />
                <span>{projectName || 'Dự án'}</span>
              </div>
              {phaseName && (
                <>
                  <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-700" />
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-brand-secondary uppercase tracking-widest">
                    <GitBranch className="w-3 h-3" />
                    <span>{phaseName}</span>
                  </div>
                </>
              )}
              <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-700" />
              <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                <span>{parentId ? 'Nhiệm vụ con mới' : 'Nhiệm vụ mới'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-brand-primary/10 rounded-2xl flex items-center justify-center">
                <Plus className="text-brand-primary w-6 h-6" />
              </div>
              <DialogTitle className="text-3xl font-black text-brand-primary dark:text-white tracking-tight">
                {parentId ? 'Nhiệm vụ con' : 'Nhiệm vụ mới'}
              </DialogTitle>
            </div>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-8 space-y-8 py-4 custom-scrollbar">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                <div className="w-1 h-1 bg-brand-primary rounded-full" />
                Tiêu đề
              </label>
              <Input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề công việc..."
                className="h-14 border-white/50 dark:border-white/10 bg-white/40 dark:bg-white/5 focus:ring-brand-primary/30 focus:bg-white dark:focus:bg-slate-900 rounded-2xl font-bold text-lg placeholder:text-slate-300 dark:placeholder:text-slate-600 placeholder:font-medium shadow-sm transition-all"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <div className="w-1 h-1 bg-brand-primary rounded-full" />
                  Mô tả
                </label>
                <button
                  type="button"
                  onClick={handleAiSuggestDescription}
                  disabled={isAiDescLoading || !title.trim()}
                  className="group flex items-center gap-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-brand-primary bg-brand-primary/10 hover:bg-brand-primary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-full transition-all shadow-sm active:scale-95"
                >
                  {isAiDescLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 group-hover:animate-pulse" />
                  )}
                  Tư vấn AI
                </button>
              </div>
              <Textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Thêm mô tả chi tiết để AI hiểu rõ hơn..."
                className="min-h-[140px] border-white/50 dark:border-white/10 bg-white/40 dark:bg-white/5 focus:ring-brand-primary/30 focus:bg-white dark:focus:bg-slate-900 rounded-2xl resize-none shadow-sm font-medium leading-relaxed transition-all"
              />
            </div>

            {/* AI Gợi ý Subtasks */}
            {selectedParentId === 'none' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="w-1 h-1 bg-accent-workspace rounded-full" />
                    Kế hoạch hành động AI
                  </label>
                  <button
                    type="button"
                    onClick={handleAiSuggestSubtasks}
                    disabled={isAiSubtasksLoading || !title.trim()}
                    className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-accent-workspace bg-accent-workspace/10 hover:bg-accent-workspace hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-full transition-all shadow-sm active:scale-95"
                  >
                    {isAiSubtasksLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    Phân tách subtasks
                  </button>
                </div>
                {aiSubtaskSuggestions.length > 0 && (
                  <div className="p-5 bg-accent-workspace/5 border border-ghost rounded-3xl space-y-2 animate-in fade-in slide-in-from-top-4 duration-500 shadow-inner">
                    <p className="text-[10px] text-accent-workspace font-black uppercase tracking-widest mb-4 opacity-70">Chọn các bước cần thực hiện:</p>
                    <div className="grid grid-cols-1 gap-2">
                    {aiSubtaskSuggestions.map((suggestion, idx) => {
                      const isSelected = selectedSubtasks.includes(suggestion);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedSubtasks(prev => prev.filter(s => s !== suggestion));
                            } else {
                              setSelectedSubtasks(prev => [...prev, suggestion]);
                              toast.success(`Đã thêm: ${suggestion}`, { duration: 1500 });
                            }
                          }}
                          className={cn(
                            "w-full flex items-center justify-between px-4 py-3 border rounded-2xl text-xs font-bold transition-all duration-200 active:scale-[0.98]",
                            isSelected 
                              ? "bg-accent-workspace border-accent-workspace text-white shadow-glow shadow-accent-workspace/40" 
                              : "bg-white hover:bg-slate-50 border-ghost text-slate-700"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Plus className={cn("w-3.5 h-3.5 flex-shrink-0", isSelected ? "text-white" : "text-accent-workspace")} />
                            {suggestion}
                          </div>
                          {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse shadow-glow" />}
                        </button>
                      );
                    })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                  <div className="w-1 h-1 bg-brand-primary rounded-full" />
                  Ưu tiên
                </label>
                <Select value={priority} onValueChange={(val) => setPriority(val as TaskPriority)}>
                  <SelectTrigger className="h-14 border-white/50 dark:border-white/10 bg-white/40 dark:bg-white/5 rounded-2xl shadow-sm hover:bg-white dark:hover:bg-slate-900 transition-all font-bold group">
                    <SelectValue placeholder="Chọn mức độ">
                      {priority === TaskPriority.LOW ? "Thấp" : priority === TaskPriority.MEDIUM ? "Trung bình" : "Cao"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl shadow-depth-3 border-ghost">
                    <SelectItem value={TaskPriority.LOW} className="font-bold py-3 text-emerald-600">Thấp</SelectItem>
                    <SelectItem value={TaskPriority.MEDIUM} className="font-bold py-3 text-brand-primary">Trung bình</SelectItem>
                    <SelectItem value={TaskPriority.HIGH} className="font-bold py-3 text-rose-600">Cao</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                  <div className="w-1 h-1 bg-brand-primary rounded-full" />
                  Dự án đích
                </label>
                <Select value={projectId} onValueChange={(val) => setProjectId(val || '')} disabled={!!parentId}>
                  <SelectTrigger className="h-14 border-white/50 dark:border-white/10 bg-white/40 dark:bg-white/5 rounded-2xl shadow-sm hover:bg-white dark:hover:bg-slate-900 transition-all font-bold group">
                    <SelectValue placeholder="Chọn dự án">
                      {(() => {
                        if (!projectId) return "Chọn dự án";
                        const p = projects.find(x => x._id === projectId);
                        if (!p) return projectId;
                        return (
                          <div className="flex items-center">
                            <span className="mr-3 text-lg">{p.emoji}</span>
                            {p.name}
                          </div>
                        );
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl shadow-depth-3 border-ghost">
                    {projects.map((project) => (
                      <SelectItem key={project._id} value={project._id} className="font-bold py-3 px-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{project.emoji}</span>
                          {project.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                  <div className="w-1 h-1 bg-brand-primary rounded-full" />
                  <Users className="w-3.5 h-3.5 text-brand-primary/80" /> Gán cho
                </label>
                <div className="flex items-center p-2 bg-white/40 dark:bg-white/5 border border-white/50 dark:border-white/10 rounded-2xl h-14 group/assignee-container relative">
                  <div className="flex -space-x-2 overflow-hidden ml-2">
                    {currentAssignees.map((member: any) => (
                      <Avatar key={member.userId?._id || member.userId?.id} className="w-8 h-8 border-2 border-white dark:border-slate-900 shadow-sm transition-transform hover:scale-110 hover:z-10">
                        <AvatarImage src={member.userId?.profilePicture} className="object-cover" />
                        <AvatarFallback className={cn(
                          "text-white text-[10px] font-black",
                          getAvatarColor(member.userId?.name || '')
                        )}>
                          {getInitials(member.userId?.name || '')}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {currentAssignees.length === 0 && (
                      <span className="text-xs text-slate-400 font-medium ml-2">Chưa gán</span>
                    )}
                  </div>

                  <Popover
                    open={activeDropdown === 'assignees'}
                    onOpenChange={(open) => setActiveDropdown(open ? 'assignees' : null)}
                  >
                    <PopoverTrigger
                      type="button"
                      className={cn(
                        "w-8 h-8 rounded-full border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center hover:border-brand-primary hover:bg-brand-primary/5 transition-all ml-auto mr-1",
                        activeDropdown === 'assignees' && "border-brand-primary bg-brand-primary/5"
                      )}
                    >
                      <Plus className="w-4 h-4 text-slate-400" />
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3 rounded-2xl border-ghost shadow-2xl bg-white dark:bg-slate-900" align="end">
                      <div className="space-y-2">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest pb-1 border-b border-ghost">
                          Gán người thực hiện
                        </div>
                        <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                          {availableMembers.map((member: any) => {
                            const mId = member.userId?._id || member.userId?.id;
                            const isSelected = selectedAssigneeIds.includes(mId);
                            return (
                              <button
                                key={mId}
                                type="button"
                                onClick={() => toggleAssignee(mId)}
                                className={cn(
                                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group/member-btn",
                                  isSelected ? "bg-brand-primary/5 shadow-sm" : "hover:bg-slate-50 dark:hover:bg-white/5"
                                )}
                              >
                                <Avatar className="w-8 h-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                                  <AvatarImage src={member.userId?.profilePicture} className="object-cover" />
                                  <AvatarFallback className={cn(
                                    "text-white text-[9px] font-black",
                                    getAvatarColor(member.userId?.name || '')
                                  )}>
                                    {getInitials(member.userId?.name || '')}
                                  </AvatarFallback>
                                </Avatar>
                                <span className={cn(
                                  "text-[12px] font-bold flex-1 truncate transition-colors",
                                  isSelected ? "text-brand-primary" : "text-slate-700 dark:text-slate-200 group-hover/member-btn:text-brand-primary"
                                )}>
                                  {member.userId?.name}
                                </span>
                                {isSelected && <Check className="check-assignee w-3.5 h-3.5 text-brand-primary" strokeWidth={3} />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                  <div className="w-1 h-1 bg-brand-primary rounded-full" />
                  Thanh khoản
                </label>
                <Input 
                  type="number"
                  min="0"
                  step="any"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Ví dụ: 8"
                  className="h-14 border-white/50 dark:border-white/10 bg-white/40 dark:bg-white/5 focus:ring-brand-primary/30 focus:bg-white dark:focus:bg-slate-900 rounded-2xl font-bold shadow-sm transition-all"
                />
              </div>
            </div>

            {/* Section TAGS (Nhãn) - NEW */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                <div className="w-1 h-1 bg-brand-primary rounded-full" />
                <TagIcon className="w-3.5 h-3.5 text-brand-primary/80" /> Nhãn (Tags)
              </label>
              <div className="flex flex-wrap gap-2 items-center p-4 bg-white/40 dark:bg-white/5 border border-white/50 dark:border-white/10 rounded-2xl min-h-[56px] group/tag-container relative">
                {currentTags.length > 0 ? (
                  currentTags.map((tag: TagType) => (
                    <Badge 
                      key={tag._id}
                      style={{ backgroundColor: `${tag.color}15`, color: tag.color, borderColor: `${tag.color}30` }}
                      className="px-3 py-1 text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 rounded-lg group/item cursor-default"
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
                      {tag.name}
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleTag(tag._id); }}
                        className="hover:scale-125 transition-transform"
                      >
                        <X className="w-3 h-3 ml-1 cursor-pointer opacity-40 group-hover/item:opacity-100 transition-opacity" />
                      </button>
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 font-medium ml-2">Chưa có nhãn nào được chọn</span>
                )}
                
                <Popover
                  open={activeDropdown === 'tags'}
                  onOpenChange={(open) => setActiveDropdown(open ? 'tags' : null)}
                >
                  <PopoverTrigger
                    type="button"
                    className={cn(
                      "h-7 px-2 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg text-[10px] font-black uppercase tracking-widest gap-1 flex items-center transition-all ml-auto",
                      activeDropdown === 'tags' && "text-brand-primary bg-brand-primary/5"
                    )}
                  >
                    <Plus className="w-3 h-3" /> Thêm nhãn
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3 rounded-2xl border-ghost shadow-2xl bg-white dark:bg-slate-900" align="end">
                    <div className="space-y-2">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest pb-1 border-b border-ghost">
                        Chọn Nhãn Công Việc
                      </div>
                      <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                        {availableTags.map((tag: TagType) => {
                          const isSelected = selectedTagIds.includes(tag._id);
                          return (
                            <button
                              key={tag._id}
                              type="button"
                              onClick={() => toggleTag(tag._id)}
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left group/tag-btn",
                                isSelected ? "bg-brand-primary/5" : "hover:bg-slate-50 dark:hover:bg-white/5"
                              )}
                            >
                              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                              <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200 flex-1 truncate">{tag.name}</span>
                              {isSelected && <Check className="w-3 h-3 text-brand-primary" strokeWidth={3} />}
                            </button>
                          );
                        })}
                        {availableTags.length === 0 && (
                          <p className="text-[10px] text-slate-400 italic p-3 text-center">Chưa có nhãn nào trong workspace này</p>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                  <div className="w-1 h-1 bg-brand-primary rounded-full" />
                  Nhiệm vụ gốc
                </label>
                <Select value={selectedParentId} onValueChange={(val) => setSelectedParentId(val || 'none')} disabled={!!parentId}>
                  <SelectTrigger className="h-14 border-white/50 dark:border-white/10 bg-white/40 dark:bg-white/5 rounded-2xl shadow-sm font-bold">
                    <SelectValue placeholder="Không có">
                      {selectedParentId === 'none' ? "Không có" : availableParentTasks.find(t => t._id === selectedParentId)?.title || selectedParentId}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl shadow-depth-3 border-ghost max-h-64">
                    <SelectItem value="none" className="font-bold py-3">Không có công việc gốc</SelectItem>
                    {availableParentTasks.map((t: Task) => (
                      <SelectItem key={t._id} value={t._id} className="font-bold py-3">{t.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                  <div className="w-1 h-1 bg-brand-primary rounded-full" />
                  Quy trình phê duyệt
                </label>
                <div className={cn(
                  "h-14 flex items-center justify-between px-5 border rounded-2xl transition-all duration-300 group",
                  requiresApproval 
                    ? "bg-brand-primary/[0.03] border-brand-primary/30 shadow-[0_0_15px_rgba(45,212,191,0.05)]" 
                    : "bg-white/20 dark:bg-white/5 border-white/50 dark:border-white/10 hover:border-brand-primary/20"
                )}>
                  <div className="flex flex-col">
                    <Label 
                      htmlFor="create-approval-toggle" 
                      className={cn(
                        "text-xs font-bold transition-colors duration-300",
                        requiresApproval ? "text-brand-primary" : "text-slate-700 dark:text-slate-200"
                      )}
                    >
                      Cần chờ duyệt?
                    </Label>
                    <span className="text-[9px] text-slate-400 font-medium uppercase tracking-tight">
                      {isAdminOrOwner 
                        ? "Bật quy trình phê duyệt cho task này" 
                        : "Chỉ quản trị viên mới có quyền thiết lập"}
                    </span>
                  </div>
                  <Switch
                    id="create-approval-toggle"
                    checked={requiresApproval}
                    onCheckedChange={setRequiresApproval}
                    disabled={!isAdminOrOwner}
                    className="data-[state=checked]:bg-brand-primary shadow-sm"
                  />
                </div>
              </div>
            </div>

            {selectedParentId === 'none' && (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3 flex flex-col justify-end">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <div className="w-1 h-1 bg-brand-primary rounded-full" />
                    Bắt đầu
                  </label>
                  <Popover>
                    <PopoverTrigger
                      className={cn(
                        "flex items-center w-full h-14 px-5 border border-white/50 dark:border-white/10 bg-white/20 dark:bg-white/5 hover:bg-white dark:hover:bg-slate-900 rounded-2xl font-bold text-left justify-start transition-all outline-none focus:ring-2 focus:ring-brand-primary/20 shadow-sm group",
                        !startDate && "text-slate-400 font-normal"
                      )}
                    >
                      <CalendarIcon className="mr-3 h-5 w-5 text-brand-primary" />
                      {startDate ? format(startDate, "dd/MM/yyyy") : <span>Chọn ngày</span>}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden shadow-depth-3 border-ghost" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-3 flex flex-col justify-end">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <div className="w-1 h-1 bg-rose-500 rounded-full" />
                    Hạn chót
                  </label>
                  <Popover>
                    <PopoverTrigger
                      className={cn(
                        "flex items-center w-full h-14 px-5 border border-white/50 dark:border-white/10 bg-white/20 dark:bg-white/5 hover:bg-white dark:hover:bg-slate-900 rounded-2xl font-bold text-left justify-start transition-all outline-none focus:ring-2 focus:ring-brand-primary/20 shadow-sm group",
                        !dueDate && "text-slate-400 font-normal"
                      )}
                    >
                      <CalendarIcon className="mr-3 h-5 w-5 text-rose-500" />
                      {dueDate ? (
                        <span>
                          {format(dueDate, "dd/MM/yyyy")}
                          {hasDueTime && <span className="text-slate-500 ml-2">({dueTime})</span>}
                        </span>
                      ) : <span>Chọn ngày</span>}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden shadow-depth-3 border-ghost" align="start">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                        initialFocus
                      />
                      {dueDate && (
                        <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              Chọn giờ cụ thể
                            </label>
                            <button
                              type="button"
                              onClick={() => setHasDueTime(!hasDueTime)}
                              className={cn(
                                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-opacity-75",
                                hasDueTime ? 'bg-brand-primary' : 'bg-slate-300 dark:bg-slate-600'
                              )}
                            >
                              <span
                                aria-hidden="true"
                                className={cn(
                                  "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                  hasDueTime ? 'translate-x-4' : 'translate-x-0'
                                )}
                              />
                            </button>
                          </div>
                          
                          {hasDueTime && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                              <Clock className="w-4 h-4 text-brand-primary" />
                              <input
                                type="time"
                                value={dueTime}
                                onChange={(e) => setDueTime(e.target.value)}
                                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-primary/20"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-8 pt-6 border-t border-brand-primary/10 bg-brand-primary/5 mt-auto">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-900 h-14 px-8 transition-all">Hủy bỏ</Button>
            <Button 
              type="submit" 
              className="bg-kinetic hover:scale-[1.02] text-white rounded-2xl px-12 h-14 font-black uppercase text-[10px] tracking-[0.2em] shadow-glow active:scale-95 disabled:opacity-30 disabled:hover:scale-100 transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang khởi tạo...
                </>
              ) : "Triển khai ngay"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
