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
    queryFn: () => taskService.getProjectTasks(workspaceId!, projectId),
    enabled: !!workspaceId && !!projectId,
  });
  const availableParentTasks = (parentTasksData || []).filter(t => !t.parentId);

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
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] p-0 overflow-hidden bg-white/95 backdrop-blur-xl border-slate-200/60 shadow-2xl rounded-3xl flex flex-col">
        <div className="p-6 pb-2">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
              {parentId ? 'Tạo nhiệm vụ con mới' : 'Tạo nhiệm vụ mới'}
            </DialogTitle>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 space-y-6 py-2 custom-scrollbar">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tiêu đề</label>
              <Input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề công việc..."
                className="h-12 border border-slate-200 bg-white/50 focus:ring-indigo-500 rounded-xl font-bold placeholder:text-slate-200 placeholder:font-normal shadow-inner shadow-slate-200/50"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mô tả</label>
                <button
                  type="button"
                  onClick={handleAiSuggestDescription}
                  disabled={isAiDescLoading || !title.trim()}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  {isAiDescLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  AI gợi ý
                </button>
              </div>
              <Textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Thêm mô tả chi tiết..."
                className="min-h-[120px] border border-slate-200 bg-white/50 focus:ring-indigo-500 rounded-xl resize-none shadow-inner shadow-slate-200/50"
              />
            </div>

            {/* AI Gợi ý Subtasks */}
            {selectedParentId === 'none' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Gợi ý Nhiệm vụ con</label>
                  <button
                    type="button"
                    onClick={handleAiSuggestSubtasks}
                    disabled={isAiSubtasksLoading || !title.trim()}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    {isAiSubtasksLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    Gợi ý subtasks
                  </button>
                </div>
                {aiSubtaskSuggestions.length > 0 && (
                  <div className="p-3 bg-violet-50 border border-violet-200/60 rounded-xl space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-xs text-violet-500 font-semibold mb-2">Chọn để thêm vào tiêu đề (tạo subtask sau khi tạo task cha):</p>
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
                              toast.success(`Đã chọn: ${suggestion}`, { duration: 1500 });
                            }
                          }}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 border rounded-lg text-xs font-medium transition-all",
                            isSelected 
                              ? "bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-100" 
                              : "bg-white hover:bg-violet-50 border-violet-100 text-slate-700"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Plus className={cn("w-3 h-3 flex-shrink-0", isSelected ? "text-violet-200" : "text-violet-500")} />
                            {suggestion}
                          </div>
                          {isSelected && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ưu tiên</label>
                <Select value={priority} onValueChange={(val) => setPriority(val as TaskPriority)}>
                  <SelectTrigger className="h-12 border-slate-200/60 bg-white/50 rounded-xl shadow-inner shadow-slate-200/50">
                    <SelectValue placeholder="Chọn mức độ ưu tiên">
                      {priority === TaskPriority.LOW ? "Thấp" : priority === TaskPriority.MEDIUM ? "Trung bình" : "Cao"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value={TaskPriority.LOW}>Thấp</SelectItem>
                    <SelectItem value={TaskPriority.MEDIUM}>Trung bình</SelectItem>
                    <SelectItem value={TaskPriority.HIGH}>Cao</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dự án</label>
                <Select value={projectId} onValueChange={(val) => setProjectId(val || '')} disabled={!!parentId}>
                  <SelectTrigger className="h-12 border-slate-200/60 bg-white/50 rounded-xl shadow-inner shadow-slate-200/50">
                    <SelectValue placeholder="Chọn dự án">
                      {(() => {
                        if (!projectId) return "Chọn dự án";
                        const p = projects.find(x => x._id === projectId);
                        if (!p) return projectId;
                        return (
                          <div className="flex items-center">
                            <span className="mr-2">{p.emoji}</span>
                            {p.name}
                          </div>
                        );
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {projects.map((project) => (
                      <SelectItem key={project._id} value={project._id}>
                        <span className="mr-2">{project.emoji}</span>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nhiệm vụ cha</label>
                <Select value={selectedParentId} onValueChange={(val) => setSelectedParentId(val || 'none')} disabled={!!parentId}>
                  <SelectTrigger className="h-12 border-slate-200/60 bg-white/50 rounded-xl shadow-inner shadow-slate-200/50">
                    <SelectValue placeholder="Không có">
                      {selectedParentId === 'none' ? "Không có" : availableParentTasks.find(t => t._id === selectedParentId)?.title || selectedParentId}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-64">
                    <SelectItem value="none">Không có</SelectItem>
                    {availableParentTasks.map((t: Task) => (
                      <SelectItem key={t._id} value={t._id}>{t.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ước tính (Giờ)</label>
                <Input 
                  type="number"
                  min="0"
                  step="any"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Ví dụ: 8"
                  className="h-12 border border-slate-200 bg-white/50 focus:ring-indigo-500 rounded-xl font-medium placeholder:text-slate-200 placeholder:font-normal shadow-inner shadow-slate-200/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đã log (Giờ)</label>
                <Input 
                  type="number"
                  min="0"
                  step="any"
                  value={loggedHours}
                  onChange={(e) => setLoggedHours(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Ví dụ: 4.5"
                  className="h-12 border border-slate-200 bg-white/50 focus:ring-indigo-500 rounded-xl font-medium placeholder:text-slate-200 placeholder:font-normal shadow-inner shadow-slate-200/50"
                />
              </div>
            </div>

            {selectedParentId === 'none' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 flex flex-col justify-end">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mở đầu</label>
                  <Popover>
                    <PopoverTrigger
                      className={cn(
                        "flex items-center w-full h-12 px-4 border border-slate-200/60 bg-white/50 hover:bg-slate-50 rounded-xl font-bold text-left justify-start transition-colors outline-none focus:ring-2 focus:ring-indigo-500/20",
                        !startDate && "text-slate-400 font-normal"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "dd/MM/yyyy") : <span>Chọn ngày</span>}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-xl border-slate-200/60" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2 flex flex-col justify-end">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hạn chót</label>
                  <Popover>
                    <PopoverTrigger
                      className={cn(
                        "flex items-center w-full h-12 px-4 border border-slate-200/60 bg-white/50 hover:bg-slate-50 rounded-xl font-bold text-left justify-start transition-colors outline-none focus:ring-2 focus:ring-indigo-500/20",
                        !dueDate && "text-slate-400 font-normal"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "dd/MM/yyyy") : <span>Chọn ngày</span>}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-xl border-slate-200/60" align="start">
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

          <DialogFooter className="p-6 pt-2 border-t border-slate-100 bg-slate-50/50">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl font-bold text-slate-500 hover:text-slate-900">Hủy</Button>
            <Button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-10 font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : "Lưu công việc"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
