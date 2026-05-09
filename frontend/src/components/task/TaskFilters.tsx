import React from 'react';
import { Search, Filter, X, Users, GitBranch, Layout, CheckCircle2, AlertCircle, ChevronDown, Layers } from 'lucide-react';
import { SearchInput } from '@/components/shared/SearchInput';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button, buttonVariants } from '@/components/ui/button';
import { TaskStatus, TaskPriority } from '@/types/task';
import { Project } from '@/services/project.service';
import { Task } from '@/types/task';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TaskFiltersProps {
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onProjectChange: (value: string) => void;
  onAssigneeChange: (values: string[]) => void;
  onParentTaskChange: (value: string) => void;
  onPhaseChange: (value: string) => void;
  projects: Project[];
  members: any[];
  phases: any[];
  tasks: Task[];
  filters: {
    search: string;
    status: string;
    priority: string;
    projectId: string;
    assigneeIds: string[];
    parentId: string;
    phaseId: string;
  };
  onClear: () => void;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  onSearchChange,
  onStatusChange,
  onPriorityChange,
  onProjectChange,
  onAssigneeChange,
  onParentTaskChange,
  onPhaseChange,
  projects,
  members,
  phases,
  tasks,
  filters,
  onClear,
}) => {
  const activeFiltersCount = [
    filters.status !== 'all',
    filters.priority !== 'all',
    filters.projectId !== 'all',
    filters.assigneeIds.length > 0,
    filters.parentId !== 'all',
    filters.phaseId !== 'all',
  ].filter(Boolean).length;

  const hasFilters = filters.search || activeFiltersCount > 0;

  // Helpers to get friendly labels
  const getStatusLabel = (status: string) => {
    switch (status) {
      case TaskStatus.TODO: return "Cần làm";
      case TaskStatus.IN_PROGRESS: return "Đang thực hiện";
      case TaskStatus.INREVIEW: return "Đang duyệt";
      case TaskStatus.DONE: return "Hoàn thành";
      default: return "Tất cả";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case TaskPriority.LOW: return "Thấp";
      case TaskPriority.MEDIUM: return "Trung bình";
      case TaskPriority.HIGH: return "Cao";
      default: return "Tất cả";
    }
  };

  const selectedProject = projects.find(p => p._id === filters.projectId);
  const getActiveAssignees = () => {
    return members.filter(m => filters.assigneeIds.includes(m.userId?._id));
  };
  const activeAssignees = getActiveAssignees();

  const toggleAssignee = (userId: string) => {
    let newIds = [...filters.assigneeIds];
    if (newIds.includes(userId)) {
      newIds = newIds.filter(id => id !== userId);
    } else {
      newIds.push(userId);
    }
    onAssigneeChange(newIds);
  };
  const selectedParentTask = tasks.find(t => t._id === filters.parentId);

  // Lấy các task không phải là subtask (dùng làm select task cha)
  const parentTasks = tasks.filter(t => {
    const isRoot = !t.parentId;
    if (filters.projectId !== 'all') {
      const tProjectId = t.projectId && typeof t.projectId === 'object' ? t.projectId._id : t.projectId;
      return isRoot && tProjectId === filters.projectId;
    }
    return isRoot;
  });

  return (
    <div className="flex items-center gap-3 mb-8 bg-slate-50/50 dark:bg-slate-900/40 backdrop-blur-xl p-2.5 rounded-[32px] border border-slate-100/80 dark:border-white/5 shadow-sm">
      <SearchInput
        placeholder="Tìm kiếm công việc nhanh..."
        value={filters.search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="h-11"
        containerClassName="flex-1"
      />

      <div className="flex items-center gap-2 pr-2">
        <Popover>
          <PopoverTrigger 
                className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-10 rounded-xl border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 gap-2 font-bold px-4 transition-all active:scale-95 shadow-sm inline-flex items-center justify-center",
                    activeFiltersCount > 0 && "border-brand-primary/20 dark:border-brand-primary/20 bg-brand-primary/10/30 text-brand-primary hover:bg-brand-primary/10/50"
                )}
          >
            <Filter className={cn("w-4 h-4", activeFiltersCount > 0 ? "text-brand-primary/80" : "text-slate-400")} />
            Bộ lọc
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="bg-brand-primary/100 text-white border-none h-5 min-w-[20px] px-1 animate-in zoom-in-50">
                {activeFiltersCount}
              </Badge>
            )}
            <ChevronDown className="w-3.5 h-3.5 opacity-50" />
          </PopoverTrigger>
          <PopoverContent className="w-80 p-5 rounded-[22px] border-slate-200/60 dark:border-white/10 shadow-2xl bg-white/95 dark:bg-slate-950/90 backdrop-blur-xl" align="end">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 capitalize">
                    <Filter className="w-3.5 h-3.5 text-brand-primary/80" />
                    Cấu hình lọc
                  </h4>
                  {activeFiltersCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={onClear} className="h-7 text-xs text-brand-primary/80 font-bold hover:bg-brand-primary/10 px-2 rounded-lg">
                          Đặt lại
                      </Button>
                  )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Trạng thái</label>
                    <Select value={filters.status} onValueChange={(val) => onStatusChange(val || 'all')}>
                      <SelectTrigger className="h-10 border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl focus:ring-1 focus:ring-brand-primary/80 font-medium dark:text-slate-200">
                        <SelectValue>
                          {getStatusLabel(filters.status)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 dark:border-white/10 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value={TaskStatus.TODO}>Cần làm</SelectItem>
                        <SelectItem value={TaskStatus.IN_PROGRESS}>Đang thực hiện</SelectItem>
                        <SelectItem value={TaskStatus.INREVIEW}>Đang duyệt</SelectItem>
                        <SelectItem value={TaskStatus.DONE}>Hoàn thành</SelectItem>
                      </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Mức độ ưu tiên</label>
                    <Select value={filters.priority} onValueChange={(val) => onPriorityChange(val || 'all')}>
                      <SelectTrigger className="h-10 border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl focus:ring-1 focus:ring-brand-primary/80 font-medium dark:text-slate-200">
                        <SelectValue>
                          {getPriorityLabel(filters.priority)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 dark:border-white/10 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value={TaskPriority.LOW}>Thấp</SelectItem>
                        <SelectItem value={TaskPriority.MEDIUM}>Trung bình</SelectItem>
                        <SelectItem value={TaskPriority.HIGH}>Cao</SelectItem>
                      </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Theo dự án</label>
                    <Select value={filters.projectId} onValueChange={(val) => onProjectChange(val || 'all')}>
                      <SelectTrigger className="h-10 border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl focus:ring-1 focus:ring-brand-primary/80 font-medium dark:text-slate-200">
                        <SelectValue>
                          <div className="flex items-center gap-2">
                             {selectedProject ? (
                               <>
                                 <span>{selectedProject.emoji || '🎯'}</span>
                                 <span className="truncate">{selectedProject.name}</span>
                               </>
                             ) : "Tất cả dự án"}
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 dark:border-white/10 dark:bg-slate-900 text-slate-900 dark:text-slate-100 max-h-64">
                        <SelectItem value="all">Tất cả dự án</SelectItem>
                        {projects.map(project => (
                          <SelectItem key={project._id} value={project._id}>
                            <span className="mr-2">{project.emoji || '🎯'}</span>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Người thực hiện</label>
                    <Popover>
                      <PopoverTrigger>
                        <div className="flex items-center justify-between w-full h-10 px-3 border border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl hover:bg-slate-100/50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                           <div className="flex items-center gap-2 overflow-hidden">
                              {activeAssignees.length > 0 ? (
                                <div className="flex -space-x-2">
                                  {activeAssignees.slice(0, 3).map(m => (
                                    <Avatar key={m.userId?._id} className="w-6 h-6 border-2 border-white dark:border-slate-800">
                                      <AvatarImage src={m.userId?.profilePicture || undefined} />
                                      <AvatarFallback className="text-[9px] font-bold">{m.userId?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                  ))}
                                  {activeAssignees.length > 3 && (
                                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-white dark:border-slate-700 text-[10px] font-bold text-slate-500 z-10">
                                      +{activeAssignees.length - 3}
                                    </div>
                                  )}
                                  <span className="ml-[12px] truncate text-sm dark:text-slate-300">
                                    Đã chọn {activeAssignees.length} thành viên
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm font-medium dark:text-slate-400">Mọi thành viên</span>
                              )}
                           </div>
                           <ChevronDown className="w-4 h-4 opacity-50" />
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-[17.5rem] p-2 rounded-xl border-slate-100 dark:border-white/10 shadow-xl dark:bg-slate-900" align="start">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2 pb-1 block">Chọn người thực hiện</label>
                          <div className="max-h-64 overflow-y-auto pr-1 custom-scrollbar space-y-1">
                            {members.map(member => {
                              const u = member.userId;
                              if (!u) return null;
                              const isSelected = filters.assigneeIds.includes(u._id);
                              return (
                                <div
                                  key={u._id}
                                  onClick={() => toggleAssignee(u._id)}
                                  className={cn(
                                    "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors",
                                    isSelected ? "bg-brand-primary/5 hover:bg-brand-primary/10" : "hover:bg-slate-50 dark:hover:bg-slate-800"
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-6 h-6">
                                      <AvatarImage src={u.profilePicture || undefined} />
                                      <AvatarFallback className="text-[10px] font-bold">{u.name?.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <span className={cn("text-sm transition-colors", isSelected ? "font-bold text-brand-primary" : "font-medium text-slate-700 dark:text-slate-300")}>{u.name}</span>
                                  </div>
                                  <div className={cn(
                                    "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                    isSelected ? "bg-brand-primary border-brand-primary" : "border-slate-300 dark:border-slate-600"
                                  )}>
                                    {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Giai đoạn</label>
                    <Select value={filters.phaseId} onValueChange={(val) => onPhaseChange(val || 'all')}>
                      <SelectTrigger className="h-10 border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl focus:ring-1 focus:ring-brand-primary/80 font-medium dark:text-slate-200">
                        <SelectValue>
                          <div className="flex items-center gap-2">
                             <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                             <span className="truncate">
                               {phases.find(p => p._id === filters.phaseId)?.name || "Tất cả"}
                             </span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 dark:border-white/10 dark:bg-slate-900 text-slate-900 dark:text-slate-100 max-h-64">
                        <SelectItem value="all">Tất cả giai đoạn</SelectItem>
                        {phases.map(phase => (
                          <SelectItem key={phase._id} value={phase._id} className="max-w-[250px] truncate">
                            {phase.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Nhiệm vụ cha</label>
                    <Select value={filters.parentId} onValueChange={(val) => onParentTaskChange(val || 'all')}>
                      <SelectTrigger className="h-10 border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl focus:ring-1 focus:ring-brand-primary/80 font-medium dark:text-slate-200">
                        <SelectValue>
                          <div className="flex items-center gap-2">
                             <GitBranch className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                             <span className="truncate">
                               {filters.parentId === 'root' ? "Chỉ nhiệm vụ chính" : (selectedParentTask?.title || "Tất cả")}
                             </span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 dark:border-white/10 dark:bg-slate-900 text-slate-900 dark:text-slate-100 max-h-64">
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="root">Chỉ nhiệm vụ chính</SelectItem>
                        {parentTasks.map(task => (
                          <SelectItem key={task._id} value={task._id} className="max-w-[250px] truncate">
                            {task.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {filters.search && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onSearchChange('')}
            className="w-9 h-9 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
