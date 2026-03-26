import React from 'react';
import { Search, Filter, X, Users, GitBranch, Layout, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';
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
  onAssigneeChange: (value: string) => void;
  onParentTaskChange: (value: string) => void;
  projects: Project[];
  members: any[];
  tasks: Task[];
  filters: {
    search: string;
    status: string;
    priority: string;
    projectId: string;
    assignedTo: string;
    parentId: string;
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
  projects,
  members,
  tasks,
  filters,
  onClear,
}) => {
  const activeFiltersCount = [
    filters.status !== 'all',
    filters.priority !== 'all',
    filters.projectId !== 'all',
    filters.assignedTo !== 'all',
    filters.parentId !== 'all',
  ].filter(Boolean).length;

  const hasFilters = filters.search || activeFiltersCount > 0;

  // Helpers to get friendly labels
  const getStatusLabel = (status: string) => {
    switch (status) {
      case TaskStatus.TODO: return "Cần làm";
      case TaskStatus.IN_PROGRESS: return "Đang làm";
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
  const selectedAssignee = members.find(m => m.userId?._id === filters.assignedTo);
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
    <div className="flex items-center gap-3 mb-6 bg-white/40 backdrop-blur-md p-2 rounded-2xl border border-slate-200/50 shadow-sm">
      <div className="relative flex-1 group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        <Input
          placeholder="Tìm kiếm công việc nhanh..."
          className="pl-10 h-11 border-none bg-transparent focus-visible:ring-0 text-sm font-medium placeholder:text-slate-400"
          value={filters.search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2 pr-2">
        <Popover>
          <PopoverTrigger 
                className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-10 rounded-xl border-slate-200 bg-white hover:bg-slate-50 gap-2 font-bold px-4 transition-all active:scale-95 shadow-sm inline-flex items-center justify-center",
                    activeFiltersCount > 0 && "border-indigo-200 bg-indigo-50/30 text-indigo-600 hover:bg-indigo-50/50"
                )}
          >
            <Filter className={cn("w-4 h-4", activeFiltersCount > 0 ? "text-indigo-500" : "text-slate-400")} />
            Bộ lọc
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="bg-indigo-500 text-white border-none h-5 min-w-[20px] px-1 animate-in zoom-in-50">
                {activeFiltersCount}
              </Badge>
            )}
            <ChevronDown className="w-3.5 h-3.5 opacity-50" />
          </PopoverTrigger>
          <PopoverContent className="w-80 p-5 rounded-[22px] border-slate-200/60 shadow-2xl bg-white/95 backdrop-blur-xl" align="end">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2 capitalize">
                    <Filter className="w-3.5 h-3.5 text-indigo-500" />
                    Cấu hình lọc
                  </h4>
                  {activeFiltersCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={onClear} className="h-7 text-xs text-indigo-500 font-bold hover:bg-indigo-50 px-2 rounded-lg">
                          Đặt lại
                      </Button>
                  )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Trạng thái</label>
                    <Select value={filters.status} onValueChange={(val) => onStatusChange(val || 'all')}>
                      <SelectTrigger className="h-10 border-slate-200/60 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-indigo-500 font-medium">
                        <SelectValue>
                          {getStatusLabel(filters.status)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100">
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value={TaskStatus.TODO}>Cần làm</SelectItem>
                        <SelectItem value={TaskStatus.IN_PROGRESS}>Đang làm</SelectItem>
                        <SelectItem value={TaskStatus.INREVIEW}>Đang duyệt</SelectItem>
                        <SelectItem value={TaskStatus.DONE}>Hoàn thành</SelectItem>
                      </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Mức độ ưu tiên</label>
                    <Select value={filters.priority} onValueChange={(val) => onPriorityChange(val || 'all')}>
                      <SelectTrigger className="h-10 border-slate-200/60 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-indigo-500 font-medium">
                        <SelectValue>
                          {getPriorityLabel(filters.priority)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100">
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value={TaskPriority.LOW}>Thấp</SelectItem>
                        <SelectItem value={TaskPriority.MEDIUM}>Trung bình</SelectItem>
                        <SelectItem value={TaskPriority.HIGH}>Cao</SelectItem>
                      </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Theo dự án</label>
                    <Select value={filters.projectId} onValueChange={(val) => onProjectChange(val || 'all')}>
                      <SelectTrigger className="h-10 border-slate-200/60 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-indigo-500 font-medium">
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
                      <SelectContent className="rounded-xl border-slate-100 max-h-64">
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
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Thành viên thực hiện</label>
                    <Select value={filters.assignedTo} onValueChange={(val) => onAssigneeChange(val || 'all')}>
                      <SelectTrigger className="h-10 border-slate-200/60 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-indigo-500 font-medium">
                        <SelectValue>
                           <div className="flex items-center gap-2">
                              {selectedAssignee ? (
                                <>
                                  <Avatar className="w-5 h-5">
                                    <AvatarImage src={selectedAssignee.userId?.profilePicture || undefined} />
                                    <AvatarFallback className="text-[9px] font-bold">{selectedAssignee.userId?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <span className="truncate">{selectedAssignee.userId?.name}</span>
                                </>
                              ) : "Mọi thành viên"}
                           </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 max-h-64">
                        <SelectItem value="all">Mọi thành viên</SelectItem>
                        {members.map(member => {
                          const u = member.userId;
                          if (!u) return null;
                          return (
                            <SelectItem key={u._id} value={u._id}>
                              <div className="flex items-center gap-2">
                                <Avatar className="w-5 h-5">
                                  <AvatarImage src={u.profilePicture || undefined} />
                                  <AvatarFallback className="text-[9px] font-bold">{u.name?.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">{u.name}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nhiệm vụ cha</label>
                    <Select value={filters.parentId} onValueChange={(val) => onParentTaskChange(val || 'all')}>
                      <SelectTrigger className="h-10 border-slate-200/60 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-indigo-500 font-medium">
                        <SelectValue>
                          <div className="flex items-center gap-2">
                             <GitBranch className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                             <span className="truncate">
                               {filters.parentId === 'root' ? "Chỉ nhiệm vụ chính" : (selectedParentTask?.title || "Tất cả")}
                             </span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 max-h-64">
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
