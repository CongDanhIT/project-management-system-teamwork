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
import { toast } from 'sonner';
import { Calendar as CalendarIcon, Sparkles, Loader2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from '@/lib/utils';
import { suggestTaskDescription, suggestSubtasks } from '@/services/ai.service';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onSubmit: (projectId: string, data: any) => Promise<void>;
  parentId?: string;
  initialStatus?: TaskStatus;
  workspaceId?: string; // Dùng để fetch tasks
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  projects,
  onSubmit,
  parentId,
  initialStatus = TaskStatus.TODO,
  workspaceId,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [estimatedHours, setEstimatedHours] = useState<number | ''>('');
  const [loggedHours, setLoggedHours] = useState<number | ''>('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [selectedParentId, setSelectedParentId] = useState<string>(parentId || 'none');
  const [isLoading, setIsLoading] = useState(false);

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
    queryKey: ['project-tasks', workspaceId, projectId],
    queryFn: () => taskService.getProjectTasks(workspaceId!, projectId, { pageSize: 1000 }), // Lấy nhiều để chọn parent
    enabled: !!workspaceId && !!projectId,
  });
  const availableParentTasks = (parentTasksData?.tasks || []).filter(t => !t.parentId);

  // Set default project when list changes
  React.useEffect(() => {
    if (projects.length > 0 && !projectId) {
      setProjectId(projects[0]._id);
    }
  }, [projects, projectId]);

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
        startDate: startDate ? startDate.toISOString() : undefined,
        dueDate: selectedParentId === 'none' ? (dueDate ? dueDate.toISOString() : undefined) : null,
        parentId: selectedParentId === 'none' ? undefined : selectedParentId,
        subtasks: selectedSubtasks, // Truyền danh sách subtask đã chọn
      });
      setTitle('');
      setDescription('');
      setPriority(TaskPriority.MEDIUM);
      setEstimatedHours('');
      setLoggedHours('');
      setStartDate(undefined);
      setDueDate(undefined);
      setSelectedParentId('none');
      setSelectedSubtasks([]);
      setAiSubtaskSuggestions([]);
      onClose();
    } catch (error) {
      toast.error("Lỗi khi tạo công việc");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[92vh] p-0 overflow-hidden glass border-ghost shadow-ambient rounded-[2rem] flex flex-col">
        <div className="p-8 pb-4">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-brand-primary/10 rounded-2xl flex items-center justify-center">
                <Plus className="text-brand-primary w-6 h-6" />
              </div>
              <DialogTitle className="text-3xl font-black text-slate-900 tracking-tight">
                {parentId ? 'Nhiệm vụ con' : 'Nhiệm vụ mới'}
              </DialogTitle>
            </div>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-8 space-y-8 py-4 custom-scrollbar">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Tiêu đề</label>
              <Input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề công việc..."
                className="h-14 border-ghost bg-secondary/20 focus:ring-brand-primary focus:bg-white rounded-2xl font-bold text-lg placeholder:text-slate-300 placeholder:font-medium shadow-sm transition-all"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Mô tả</label>
                <button
                  type="button"
                  onClick={handleAiSuggestDescription}
                  disabled={isAiDescLoading || !title.trim()}
                  className="group flex items-center gap-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-brand-primary bg-brand-secondary/80 hover:bg-brand-primary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-full transition-all shadow-sm active:scale-95"
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
                className="min-h-[140px] border-ghost bg-secondary/20 focus:ring-brand-primary focus:bg-white rounded-2xl resize-none shadow-sm font-medium leading-relaxed transition-all"
              />
            </div>

            {/* AI Gợi ý Subtasks */}
            {selectedParentId === 'none' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Kế hoạch hành động AI</label>
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
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Ưu tiên</label>
                <Select value={priority} onValueChange={(val) => setPriority(val as TaskPriority)}>
                  <SelectTrigger className="h-14 border-ghost bg-secondary/20 rounded-2xl shadow-sm hover:bg-white transition-all font-bold">
                    <SelectValue placeholder="Chọn mức độ">
                      {priority === TaskPriority.LOW ? "Tiêu chuẩn" : priority === TaskPriority.MEDIUM ? "Trung bình" : "Khẩn cấp"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl shadow-ambient border-ghost">
                    <SelectItem value={TaskPriority.LOW} className="font-bold py-3">Tiêu chuẩn</SelectItem>
                    <SelectItem value={TaskPriority.MEDIUM} className="font-bold py-3 text-brand-primary">Trung bình</SelectItem>
                    <SelectItem value={TaskPriority.HIGH} className="font-bold py-3 text-rose-600">Khẩn cấp</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Dự án đích</label>
                <Select value={projectId} onValueChange={(val) => setProjectId(val || '')} disabled={!!parentId}>
                  <SelectTrigger className="h-14 border-ghost bg-secondary/20 rounded-2xl shadow-sm hover:bg-white transition-all font-bold">
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
                  <SelectContent className="rounded-2xl shadow-ambient border-ghost">
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
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nhiệm vụ gốc (Parent)</label>
                <Select value={selectedParentId} onValueChange={(val) => setSelectedParentId(val || 'none')} disabled={!!parentId}>
                  <SelectTrigger className="h-14 border-ghost bg-secondary/20 rounded-2xl shadow-sm font-bold">
                    <SelectValue placeholder="Không có">
                      {selectedParentId === 'none' ? "Không có" : availableParentTasks.find(t => t._id === selectedParentId)?.title || selectedParentId}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl shadow-ambient border-ghost max-h-64">
                    <SelectItem value="none" className="font-bold py-3">Không có công việc gốc</SelectItem>
                    {availableParentTasks.map((t: Task) => (
                      <SelectItem key={t._id} value={t._id} className="font-bold py-3">{t.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Thanh khoản (Giờ)</label>
                <Input 
                  type="number"
                  min="0"
                  step="any"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Ví dụ: 8"
                  className="h-14 border-ghost bg-secondary/20 focus:ring-brand-primary focus:bg-white rounded-2xl font-bold shadow-sm transition-all"
                />
              </div>
            </div>

            {selectedParentId === 'none' && (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3 flex flex-col justify-end">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Bắt đầu</label>
                  <Popover>
                    <PopoverTrigger
                      className={cn(
                        "flex items-center w-full h-14 px-5 border-ghost bg-secondary/20 hover:bg-white rounded-2xl font-bold text-left justify-start transition-all outline-none focus:ring-2 focus:ring-brand-primary/20",
                        !startDate && "text-slate-400 font-normal"
                      )}
                    >
                      <CalendarIcon className="mr-3 h-5 w-5 text-brand-primary" />
                      {startDate ? format(startDate, "dd/MM/yyyy") : <span>Chọn ngày</span>}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden shadow-ambient border-ghost" align="start">
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Hạn chót</label>
                  <Popover>
                    <PopoverTrigger
                      className={cn(
                        "flex items-center w-full h-14 px-5 border-ghost bg-secondary/20 hover:bg-white rounded-2xl font-bold text-left justify-start transition-all outline-none focus:ring-2 focus:ring-brand-primary/20",
                        !dueDate && "text-slate-400 font-normal"
                      )}
                    >
                      <CalendarIcon className="mr-3 h-5 w-5 text-rose-500" />
                      {dueDate ? format(dueDate, "dd/MM/yyyy") : <span>Chọn ngày</span>}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden shadow-ambient border-ghost" align="start">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-8 pt-4 border-t border-divider/20 bg-secondary/10 mt-auto">
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
