import React from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { activityService } from '@/services/activity.service';
import { 
  PlusCircle, 
  RefreshCw, 
  Trash2, 
  Archive, 
  UserPlus, 
  UserMinus, 
  Settings, 
  Layout, 
  CheckCircle2,
  Clock,
  MessageSquare,
  ArrowRight,
  Filter,
  X,
  Search,
  FolderPlus,
  FilePlus,
  FileText,
  Layers,
  Pencil,
  RotateCcw
} from 'lucide-react';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WorkspaceActivityTabProps {
  workspaceId: string;
}

const actionConfig: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
  // Task Actions
  CREATE_TASK: { icon: PlusCircle, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', label: 'đã tạo công việc' },
  UPDATE_TASK: { icon: RefreshCw, color: 'text-amber-500', bgColor: 'bg-amber-500/10', label: 'đã cập nhật công việc' },
  DELETE_TASK: { icon: Trash2, color: 'text-red-500', bgColor: 'bg-red-500/10', label: 'đã xóa công việc' },
  RESTORE_TASK: { icon: Archive, color: 'text-teal-500', bgColor: 'bg-teal-500/10', label: 'đã khôi phục công việc' },
  MOVE_TASK: { icon: ArrowRight, color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'đã di chuyển công việc' },
  
  // Project Actions
  CREATE_PROJECT: { icon: Layout, color: 'text-brand-primary', bgColor: 'bg-brand-primary/10', label: 'đã tạo dự án mới' },
  UPDATE_PROJECT: { icon: Settings, color: 'text-slate-500', bgColor: 'bg-slate-500/10', label: 'đã cập nhật dự án' },
  DELETE_PROJECT: { icon: Trash2, color: 'text-red-600', bgColor: 'bg-red-600/10', label: 'đã xóa dự án' },
  RESTORE_PROJECT: { icon: Archive, color: 'text-teal-500', bgColor: 'bg-teal-500/10', label: 'đã khôi phục dự án' },

  // Phase Actions
  CREATE_PHASE: { icon: Clock, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10', label: 'đã tạo giai đoạn' },
  UPDATE_PHASE: { icon: Settings, color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'đã cập nhật giai đoạn' },
  DELETE_PHASE: { icon: Trash2, color: 'text-red-500', bgColor: 'bg-red-500/10', label: 'đã xóa giai đoạn' },
  RESTORE_PHASE: { icon: Archive, color: 'text-teal-500', bgColor: 'bg-teal-500/10', label: 'đã khôi phục giai đoạn' },

  // Asset & Folder Actions
  CREATE_FOLDER: { icon: FolderPlus, color: 'text-amber-500', bgColor: 'bg-amber-500/10', label: 'đã tạo thư mục' },
  UPDATE_FOLDER: { icon: Settings, color: 'text-orange-500', bgColor: 'bg-orange-500/10', label: 'đã cập nhật thư mục' },
  DELETE_FOLDER: { icon: Trash2, color: 'text-red-500', bgColor: 'bg-red-500/10', label: 'đã xóa thư mục' },
  UPLOAD_FILE: { icon: FilePlus, color: 'text-blue-600', bgColor: 'bg-blue-600/10', label: 'đã tải lên tệp tin' },
  DELETE_FILE: { icon: Trash2, color: 'text-red-600', bgColor: 'bg-red-600/10', label: 'đã xóa tệp tin' },
  RENAME_FILE: { icon: Pencil, color: 'text-slate-500', bgColor: 'bg-slate-500/10', label: 'đã đổi tên tệp tin' },

  // Member Actions
  MEMBER_JOINED: { icon: UserPlus, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10', label: 'đã tham gia không gian' },
  MEMBER_LEFT: { icon: UserMinus, color: 'text-rose-500', bgColor: 'bg-rose-500/10', label: 'đã rời khỏi không gian' },
};

const getEntityTypeLabel = (type: string) => {
  switch (type) {
    case 'TASK': return 'Công việc (Task)';
    case 'PROJECT': return 'Dự án (Project)';
    case 'PHASE': return 'Giai đoạn (Phase)';
    case 'ASSET_FOLDER': return 'Thư mục (Folder)';
    case 'ASSET': return 'Tài liệu (File)';
    case 'MEMBER': return 'Thành viên (Member)';
    case 'WORKSPACE': return 'Không gian (Workspace)';
    default: return 'Tất cả đối tượng';
  }
};

const getActionLabel = (action: string) => {
  switch (action) {
    case 'CREATE_TASK': return 'Tạo công việc';
    case 'UPDATE_TASK': return 'Cập nhật công việc';
    case 'DELETE_TASK': return 'Xóa công việc';
    case 'RESTORE_TASK': return 'Khôi phục công việc';
    case 'MOVE_TASK': return 'Di chuyển công việc';
    case 'CREATE_PROJECT': return 'Tạo dự án';
    case 'UPDATE_PROJECT': return 'Cập nhật dự án';
    case 'DELETE_PROJECT': return 'Xóa dự án';
    case 'RESTORE_PROJECT': return 'Khôi phục dự án';
    case 'CREATE_PHASE': return 'Tạo giai đoạn';
    case 'UPDATE_PHASE': return 'Cập nhật giai đoạn';
    case 'DELETE_PHASE': return 'Xóa giai đoạn';
    case 'RESTORE_PHASE': return 'Khôi phục giai đoạn';
    case 'CREATE_FOLDER': return 'Tạo thư mục';
    case 'UPDATE_FOLDER': return 'Cập nhật thư mục';
    case 'DELETE_FOLDER': return 'Xóa thư mục';
    case 'UPLOAD_FILE': return 'Tải lên tài liệu';
    case 'DELETE_FILE': return 'Xóa tài liệu';
    case 'RENAME_FILE': return 'Đổi tên tài liệu';
    case 'MEMBER_JOINED': return 'Thành viên gia nhập';
    case 'MEMBER_LEFT': return 'Thành viên rời đi';
    case 'WORKSPACE_UPDATED': return 'Cập nhật Workspace';
    default: return 'Tất cả hành động';
  }
};

const entityActionsMap: Record<string, { value: string; label: string }[]> = {
  all: [
    { value: 'CREATE_TASK', label: 'Tạo công việc' },
    { value: 'UPDATE_TASK', label: 'Cập nhật công việc' },
    { value: 'DELETE_TASK', label: 'Xóa công việc' },
    { value: 'RESTORE_TASK', label: 'Khôi phục công việc' },
    { value: 'MOVE_TASK', label: 'Di chuyển công việc' },
    { value: 'CREATE_PROJECT', label: 'Tạo dự án' },
    { value: 'UPDATE_PROJECT', label: 'Cập nhật dự án' },
    { value: 'DELETE_PROJECT', label: 'Xóa dự án' },
    { value: 'RESTORE_PROJECT', label: 'Khôi phục dự án' },
    { value: 'CREATE_PHASE', label: 'Tạo giai đoạn' },
    { value: 'UPDATE_PHASE', label: 'Cập nhật giai đoạn' },
    { value: 'DELETE_PHASE', label: 'Xóa giai đoạn' },
    { value: 'RESTORE_PHASE', label: 'Khôi phục giai đoạn' },
    { value: 'CREATE_FOLDER', label: 'Tạo thư mục' },
    { value: 'UPDATE_FOLDER', label: 'Cập nhật thư mục' },
    { value: 'DELETE_FOLDER', label: 'Xóa thư mục' },
    { value: 'UPLOAD_FILE', label: 'Tải lên tài liệu' },
    { value: 'DELETE_FILE', label: 'Xóa tài liệu' },
    { value: 'RENAME_FILE', label: 'Đổi tên tài liệu' },
    { value: 'MEMBER_JOINED', label: 'Thành viên gia nhập' },
    { value: 'MEMBER_LEFT', label: 'Thành viên rời đi' },
    { value: 'WORKSPACE_UPDATED', label: 'Cập nhật Workspace' },
  ],
  TASK: [
    { value: 'CREATE_TASK', label: 'Tạo công việc' },
    { value: 'UPDATE_TASK', label: 'Cập nhật công việc' },
    { value: 'DELETE_TASK', label: 'Xóa công việc' },
    { value: 'RESTORE_TASK', label: 'Khôi phục công việc' },
    { value: 'MOVE_TASK', label: 'Di chuyển công việc' },
  ],
  PROJECT: [
    { value: 'CREATE_PROJECT', label: 'Tạo dự án' },
    { value: 'UPDATE_PROJECT', label: 'Cập nhật dự án' },
    { value: 'DELETE_PROJECT', label: 'Xóa dự án' },
    { value: 'RESTORE_PROJECT', label: 'Khôi phục dự án' },
  ],
  PHASE: [
    { value: 'CREATE_PHASE', label: 'Tạo giai đoạn' },
    { value: 'UPDATE_PHASE', label: 'Cập nhật giai đoạn' },
    { value: 'DELETE_PHASE', label: 'Xóa giai đoạn' },
    { value: 'RESTORE_PHASE', label: 'Khôi phục giai đoạn' },
  ],
  ASSET_FOLDER: [
    { value: 'CREATE_FOLDER', label: 'Tạo thư mục' },
    { value: 'UPDATE_FOLDER', label: 'Cập nhật thư mục' },
    { value: 'DELETE_FOLDER', label: 'Xóa thư mục' },
  ],
  ASSET: [
    { value: 'UPLOAD_FILE', label: 'Tải lên tài liệu' },
    { value: 'DELETE_FILE', label: 'Xóa tài liệu' },
    { value: 'RENAME_FILE', label: 'Đổi tên tài liệu' },
  ],
  MEMBER: [
    { value: 'MEMBER_JOINED', label: 'Thành viên gia nhập' },
    { value: 'MEMBER_LEFT', label: 'Thành viên rời đi' },
  ],
  WORKSPACE: [
    { value: 'WORKSPACE_UPDATED', label: 'Cập nhật Workspace' }
  ]
};

export default function WorkspaceActivityTab({ workspaceId }: WorkspaceActivityTabProps) {
  const [filters, setFilters] = React.useState({
    action: 'all',
    entityType: 'all',
    startDate: '',
    endDate: '',
  });

  const [tempFilters, setTempFilters] = React.useState(filters);
  const [isOpen, setIsOpen] = React.useState(false);

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'action' || key === 'entityType') return value !== 'all';
    return !!value;
  }).length;

  const { 
    data, 
    isLoading, 
    isFetchingNextPage, 
    fetchNextPage, 
    hasNextPage,
    refetch
  } = useInfiniteQuery({
    queryKey: ['workspace-activity', workspaceId, filters],
    queryFn: ({ pageParam = 1 }) => {
        const apiFilters: any = {};
        if (filters.action !== 'all') apiFilters.action = filters.action;
        if (filters.entityType !== 'all') apiFilters.entityType = filters.entityType;
        if (filters.startDate) apiFilters.startDate = filters.startDate;
        if (filters.endDate) apiFilters.endDate = filters.endDate;
        
        return activityService.getWorkspaceActivity(workspaceId, pageParam as number, 20, apiFilters);
    },
    getNextPageParam: (lastPage: any) => {
      const pagination = lastPage?.pagination;
      if (pagination && pagination.currentPage < pagination.totalPages) {
        return pagination.currentPage + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: !!workspaceId,
  });

  const activities = data?.pages.flatMap(page => page?.activities || []).filter(Boolean) || [];

  const handleEntityTypeChange = (type: string | null) => {
    const newType = type ?? 'all';
    setTempFilters(prev => {
      const validActions = entityActionsMap[newType]?.map(a => a.value) || [];
      const isActionValid = newType === 'all' || validActions.includes(prev.action);
      return {
        ...prev,
        entityType: newType,
        action: isActionValid ? prev.action : 'all'
      };
    });
  };

  const handleApplyFilters = () => {
    setFilters(tempFilters);
  };

  const handleResetFilters = () => {
    const reset = {
        action: 'all',
        entityType: 'all',
        startDate: '',
        endDate: '',
    };
    setTempFilters(reset);
    setFilters(reset);
  };

  // Group activities by date
  const groupedActivities = activities.reduce((groups: any, activity: any) => {
    if (!activity || !activity.createdAt) return groups;
    
    const date = new Date(activity.createdAt);
    let label = format(date, 'dd MMMM, yyyy', { locale: vi });
    
    if (isToday(date)) label = 'Hôm nay';
    else if (isYesterday(date)) label = 'Hôm qua';
    
    if (!groups[label]) groups[label] = [];
    groups[label].push(activity);
    return groups;
  }, {});

  if (isLoading) {
    return (
      <div className="space-y-12 py-10">
        {[1, 2].map(i => (
          <div key={i} className="space-y-6">
            <Skeleton className="h-4 w-32 rounded-full" />
            <div className="space-y-4">
              {[1, 2, 3].map(j => (
                <div key={j} className="flex gap-4 p-4 rounded-[24px] bg-slate-50/50 dark:bg-white/5">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-16 py-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#035D5B] dark:text-[#C7F964] uppercase tracking-tighter">Dòng thời gian</h2>
          <p className="text-sm text-slate-500 font-medium">Cập nhật mọi chuyển động của dự án theo thời gian thực.</p>
        </div>
        
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger
            render={
              <Button variant="outline" size="sm" className="rounded-full gap-2 font-bold border-slate-200 dark:border-white/10 relative">
                <Filter className="w-4 h-4" /> 
                Lọc hành động
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#C7F964] text-[#035D5B] text-[10px] flex items-center justify-center rounded-full border-2 border-white dark:border-[#0F1110]">
                      {activeFiltersCount}
                  </span>
                )}
              </Button>
            }
          />
          <PopoverContent align="end" className="w-[360px] p-5 rounded-[24px] bg-white dark:bg-[#0F1110] dark:border-white/5 border border-slate-100 dark:border-white/10 shadow-xl space-y-4">
            <PopoverHeader className="pb-2 border-b border-slate-100 dark:border-white/5">
              <PopoverTitle className="text-sm font-black text-[#035D5B] dark:text-[#C7F964] uppercase tracking-tight">Bộ lọc hoạt động</PopoverTitle>
              <PopoverDescription className="text-[11px] text-slate-500 font-medium mt-0.5">
                Tìm kiếm chính xác các thay đổi theo các tiêu chí.
              </PopoverDescription>
            </PopoverHeader>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Loại đối tượng</Label>
                <Select 
                    value={tempFilters.entityType} 
                    onValueChange={handleEntityTypeChange}
                >
                  <SelectTrigger className="w-full rounded-lg border border-slate-200/50 dark:border-white/5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 h-9 font-bold px-3 text-xs">
                    <SelectValue placeholder="Tất cả đối tượng">
                      {getEntityTypeLabel(tempFilters.entityType)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-lg dark:bg-[#1A1D1C] dark:border-white/10">
                    <SelectItem value="all" className="font-bold text-xs">Tất cả đối tượng</SelectItem>
                    <SelectItem value="TASK" className="font-bold text-xs">Công việc (Task)</SelectItem>
                    <SelectItem value="PROJECT" className="font-bold text-xs">Dự án (Project)</SelectItem>
                    <SelectItem value="PHASE" className="font-bold text-xs">Giai đoạn (Phase)</SelectItem>
                    <SelectItem value="ASSET_FOLDER" className="font-bold text-xs">Thư mục (Folder)</SelectItem>
                    <SelectItem value="ASSET" className="font-bold text-xs">Tài liệu (File)</SelectItem>
                    <SelectItem value="MEMBER" className="font-bold text-xs">Thành viên (Member)</SelectItem>
                    <SelectItem value="WORKSPACE" className="font-bold text-xs">Không gian (Workspace)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Hành động cụ thể</Label>
                <Select 
                    value={tempFilters.action} 
                    onValueChange={(v: string | null) => setTempFilters(prev => ({ ...prev, action: v ?? 'all' }))}
                >
                  <SelectTrigger className="w-full rounded-lg border border-slate-200/50 dark:border-white/5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 h-9 font-bold px-3 text-xs">
                    <SelectValue placeholder="Tất cả hành động">
                      {getActionLabel(tempFilters.action)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-lg dark:bg-[#1A1D1C] dark:border-white/10">
                    <SelectItem value="all" className="font-bold text-xs">Tất cả hành động</SelectItem>
                    {(entityActionsMap[tempFilters.entityType] || entityActionsMap.all).map(act => (
                      <SelectItem key={act.value} value={act.value} className="font-bold text-xs">
                        {act.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Từ ngày</Label>
                    <Input 
                        type="date" 
                        className="w-full rounded-lg border border-slate-200/50 dark:border-white/5 bg-slate-50 dark:bg-white/5 h-9 font-bold px-3 text-xs"
                        value={tempFilters.startDate}
                        onChange={(e) => setTempFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Đến ngày</Label>
                    <Input 
                        type="date" 
                        className="w-full rounded-lg border border-slate-200/50 dark:border-white/5 bg-slate-50 dark:bg-white/5 h-9 font-bold px-3 text-xs"
                        value={tempFilters.endDate}
                        onChange={(e) => setTempFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
              <Button 
                variant="outline" 
                className="rounded-full h-8 font-bold text-xs gap-1 border-slate-200 dark:border-white/10 px-3"
                onClick={handleResetFilters}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Đặt lại
              </Button>
              <div className="flex gap-1.5">
                <Button 
                  variant="ghost" 
                  className="rounded-full h-8 font-bold text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white px-3"
                  onClick={() => {
                    setTempFilters(filters);
                    setIsOpen(false);
                  }}
                >
                  Hủy
                </Button>
                <Button 
                  className="rounded-full h-8 font-bold text-xs bg-[#035D5B] text-white hover:bg-[#035D5B]/90 dark:bg-[#C7F964] dark:text-[#035D5B] dark:hover:bg-[#C7F964]/90 px-4"
                  onClick={() => {
                    handleApplyFilters();
                    setIsOpen(false);
                  }}
                >
                  Áp dụng
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-6 text-slate-300">
            <Search className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Không tìm thấy kết quả</h3>
            <p className="text-slate-500 text-sm mt-2 max-w-xs font-medium">
            Thử thay đổi bộ lọc hoặc xóa các tiêu chí để xem thêm hoạt động.
            </p>
            <Button 
                variant="link" 
                className="mt-4 text-[#035D5B] dark:text-[#C7F964] font-bold"
                onClick={handleResetFilters}
            >
                Xóa tất cả bộ lọc
            </Button>
        </div>
      ) : (
        <div className="relative space-y-16">
            {/* Vertical Line Connector */}
            <div className="absolute left-[21px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-teal-500/20 via-slate-200/20 dark:via-white/10 to-transparent" />

            {Object.entries(groupedActivities).map(([dateLabel, logs]: [string, any]) => (
            <div key={dateLabel} className="relative space-y-8">
                {/* Date Header */}
                <div className="sticky top-0 z-20 py-2 bg-white/80 dark:bg-[#0F1110]/80 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-6 bg-[#C7F964] rounded-full shadow-[0_0_12px_rgba(199,249,100,0.5)]" />
                        <h3 className="text-[11px] font-black text-[#035D5B] dark:text-[#C7F964] uppercase tracking-[0.2em]">
                            {dateLabel}
                        </h3>
                    </div>
                </div>

                <div className="space-y-8 pl-1">
                {logs.map((activity: any, idx: number) => {
                    const config = actionConfig[activity.action] || { icon: RefreshCw, color: 'text-slate-500', bgColor: 'bg-slate-100', label: 'đã thay đổi' };
                    const Icon = config.icon;

                    return (
                    <div key={activity._id} className="group relative flex gap-6 items-start animate-in fade-in slide-in-from-left-4 duration-500">
                        {/* Activity Icon Point */}
                        <div className={cn(
                            "relative z-10 w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform duration-500 group-hover:scale-110",
                            config.bgColor
                        )}>
                            <Icon className={cn("w-5 h-5", config.color)} />
                        </div>

                        <div className="flex-1 space-y-2 pt-1">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                            <UserAvatar 
                                user={activity.userId} 
                                size="sm" 
                                className="h-6 w-6 border-none ring-1 ring-slate-100 dark:ring-white/10"
                            />
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-tight">
                                <span className="font-bold text-[#035D5B] dark:text-[#C7F964]">{activity.userId?.name || 'Ai đó'}</span>
                                {' '}
                                <span className="opacity-80">{config.label}</span>
                                {' '}
                                <span className="font-bold">{activity.details?.summary || activity.entityType}</span>
                            </p>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-white/5 px-2 py-1 rounded-md shrink-0">
                            {format(new Date(activity.createdAt), 'HH:mm')}
                            </span>
                        </div>

                        {/* Detail Box (Optional) */}
                        {(activity.details?.summary || activity.projectId) && (
                            <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm group-hover:shadow-md group-hover:border-teal-500/20 transition-all duration-300">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    {activity.projectId && (
                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider text-teal-600 bg-teal-500/5 border-none">
                                        Dự án: {activity.projectId?.name || '...'}
                                        </Badge>
                                    )}
                                    <span className="text-[13px] font-medium text-slate-600 dark:text-slate-300">
                                        {activity.details?.summary || 'Chi tiết hoạt động đang được cập nhật.'}
                                    </span>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-x-2 group-hover:translate-x-0" />
                            </div>
                            </div>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: vi })}
                            </span>
                        </div>
                        </div>
                    </div>
                    );
                })}
                </div>
            </div>
            ))}
        </div>
      )}
      
      {hasNextPage && (
        <div className="flex justify-center pt-8">
            <Button 
                variant="ghost" 
                onClick={() => fetchNextPage()} 
                disabled={isFetchingNextPage}
                className="rounded-full px-8 font-bold text-teal-600 uppercase text-[10px] tracking-widest"
            >
                {isFetchingNextPage ? 'Đang tải...' : 'Xem thêm hoạt động'}
            </Button>
        </div>
      )}
    </div>
  );
}
