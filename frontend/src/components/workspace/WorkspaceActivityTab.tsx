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
  Pencil
} from 'lucide-react';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
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

export default function WorkspaceActivityTab({ workspaceId }: WorkspaceActivityTabProps) {
  const [filters, setFilters] = React.useState({
    action: 'all',
    entityType: 'all',
    startDate: '',
    endDate: '',
  });

  const [tempFilters, setTempFilters] = React.useState(filters);

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
        
        <Sheet>
          <SheetTrigger
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
          <SheetContent className="w-[400px] sm:w-[540px] dark:bg-[#0F1110] dark:border-white/5">
            <SheetHeader className="mb-8">
              <SheetTitle className="text-2xl font-black text-[#035D5B] dark:text-[#C7F964] uppercase tracking-tight">Bộ lọc nâng cao</SheetTitle>
              <SheetDescription className="font-medium">
                Tìm kiếm chính xác các thay đổi theo loại hành động, thời gian hoặc đối tượng.
              </SheetDescription>
            </SheetHeader>
            
            <div className="space-y-8">
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Loại đối tượng</Label>
                <Select 
                    value={tempFilters.entityType} 
                    onValueChange={(v: string | null) => setTempFilters(prev => ({ ...prev, entityType: v ?? 'all' }))}
                >
                  <SelectTrigger className="rounded-2xl border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 h-12 font-bold">
                    <SelectValue placeholder="Tất cả đối tượng" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl dark:bg-[#1A1D1C] dark:border-white/10">
                    <SelectItem value="all" className="font-bold">Tất cả đối tượng</SelectItem>
                    <SelectItem value="TASK" className="font-bold">Công việc (Task)</SelectItem>
                    <SelectItem value="PROJECT" className="font-bold">Dự án (Project)</SelectItem>
                    <SelectItem value="MEMBER" className="font-bold">Thành viên (Member)</SelectItem>
                    <SelectItem value="WORKSPACE" className="font-bold">Không gian (Workspace)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Hành động cụ thể</Label>
                <Select 
                    value={tempFilters.action} 
                    onValueChange={(v: string | null) => setTempFilters(prev => ({ ...prev, action: v ?? 'all' }))}
                >
                  <SelectTrigger className="rounded-2xl border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 h-12 font-bold">
                    <SelectValue placeholder="Tất cả hành động" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl dark:bg-[#1A1D1C] dark:border-white/10">
                    <SelectItem value="all" className="font-bold">Tất cả hành động</SelectItem>
                    <SelectItem value="CREATE_TASK" className="font-bold">Tạo công việc</SelectItem>
                    <SelectItem value="UPDATE_TASK" className="font-bold">Cập nhật công việc</SelectItem>
                    <SelectItem value="DELETE_TASK" className="font-bold">Xóa công việc</SelectItem>
                    <SelectItem value="CREATE_PROJECT" className="font-bold">Tạo dự án</SelectItem>
                    <SelectItem value="MEMBER_JOINED" className="font-bold">Thành viên gia nhập</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Từ ngày</Label>
                    <Input 
                        type="date" 
                        className="rounded-2xl border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 h-12 font-bold"
                        value={tempFilters.startDate}
                        onChange={(e) => setTempFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                </div>
                <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Đến ngày</Label>
                    <Input 
                        type="date" 
                        className="rounded-2xl border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 h-12 font-bold"
                        value={tempFilters.endDate}
                        onChange={(e) => setTempFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                </div>
              </div>
            </div>

            <SheetFooter className="absolute bottom-8 left-6 right-6 gap-3">
               <Button 
                variant="outline" 
                className="flex-1 rounded-2xl h-14 font-black uppercase tracking-tighter"
                onClick={handleResetFilters}
               >
                 Đặt lại
               </Button>
               <SheetClose
                 render={
                   <Button 
                      className="flex-1 rounded-2xl h-14 font-black uppercase tracking-tighter bg-[#035D5B] text-white hover:bg-[#035D5B]/90 dark:bg-[#C7F964] dark:text-[#035D5B] dark:hover:bg-[#C7F964]/90"
                      onClick={handleApplyFilters}
                   >
                     Áp dụng
                   </Button>
                 }
               />
            </SheetFooter>
          </SheetContent>
        </Sheet>
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
