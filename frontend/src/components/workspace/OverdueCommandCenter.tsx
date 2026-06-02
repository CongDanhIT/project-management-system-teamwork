'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { taskService } from '@/services/task.service';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  AlertCircle,
  Filter,
  Search,
  Layout,
  Clock,
  ShieldAlert,
  ChevronRight,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { SearchInput } from '@/components/shared/SearchInput';

interface OverdueCommandCenterProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  onTaskClick: (task: any) => void;
  projects?: any[];
}

export function OverdueCommandCenter({
  isOpen,
  onOpenChange,
  workspaceId,
  onTaskClick,
  projects = []
}: OverdueCommandCenterProps) {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(9);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'priority'>('date-desc');

  // Fetch data using React Query
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['overdue-tasks', workspaceId, page, searchQuery, priorityFilter, projectFilter, sortBy],
    queryFn: () => taskService.getTasksByWorkspace(workspaceId, {
      pageNumber: page,
      pageSize,
      isOverdue: true,
      keyword: searchQuery,
      priority: priorityFilter !== 'all' ? priorityFilter : undefined,
      projectId: projectFilter !== 'all' ? projectFilter : undefined,
      sortBy
    }),
    enabled: isOpen,
    staleTime: 30000, // 30 seconds
  });

  const tasks = data?.tasks || [];
  const pagination = data?.pagination || { totalPages: 1, totalCount: 0, currentPage: 1 };

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, priorityFilter, projectFilter, sortBy]);

  // Pagination helper
  const renderPageNumbers = () => {
    const pages = [];
    const totalPages = pagination.totalPages;
    
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', page - 1, page, page + 1, '...', totalPages);
      }
    }

    return pages.map((p, idx) => (
      <Button
        key={idx}
        variant={p === page ? "default" : "ghost"}
        size="sm"
        disabled={p === '...'}
        onClick={() => typeof p === 'number' && setPage(p)}
        className={cn(
          "w-8 h-8 p-0 rounded-lg text-xs font-bold transition-all",
          p === page ? "bg-brand-primary hover:bg-brand-primary/90 text-white shadow-lg shadow-brand-primary/20" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5",
          p === '...' && "cursor-default hover:bg-transparent"
        )}
      >
        {p}
      </Button>
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[98vw] h-[92vh] max-w-[1700px] p-0 overflow-hidden bg-white/95 dark:bg-[#0B1211]/98 backdrop-blur-[60px] border border-white/10 shadow-[0_32px_128px_-20px_rgba(0,0,0,0.7)] flex flex-col rounded-[32px] sm:max-w-none transition-all duration-500">
        
        {/* Header Section */}
        <DialogHeader className="p-8 pb-6 space-y-6 shrink-0 border-b border-black/5 dark:border-white/5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 text-center md:text-left">
              <div className="flex items-center gap-4 justify-center md:justify-start">
                <div className="w-12 h-12 rounded-[20px] bg-red-500/10 flex items-center justify-center text-red-500 shadow-sm">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <DialogTitle className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                  Trung tâm điều phối Chiến lược
                </DialogTitle>
              </div>
              <DialogDescription className="text-base font-medium text-slate-500 dark:text-slate-400 pl-0.5">
                Phân tích rủi ro và xử lý <span className="text-red-500 font-bold px-2 py-0.5 bg-red-50 dark:bg-red-500/10 rounded-md">{pagination.totalCount}</span> mục tiêu đang bị đình trệ.
              </DialogDescription>
            </div>

            <div className="flex items-center gap-4 bg-black/5 dark:bg-white/5 p-1.5 rounded-xl border border-black/5 dark:border-white/5">
              <div className="px-3 py-1 text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trạng thái hệ thống</p>
                <p className="text-xs font-bold text-emerald-500">Vận hành tối ưu</p>
              </div>
              <div className="w-[1px] h-6 bg-black/10 dark:bg-white/10" />
              <Button size="sm" variant="ghost" className="rounded-lg font-bold dark:text-white hover:bg-white dark:hover:bg-white/10 h-8 text-xs">
                {isFetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Xuất báo cáo"}
              </Button>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-4">
            <SearchInput
              placeholder="Tìm nội dung công việc, tên dự án..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12"
              containerClassName="flex-1"
            />

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Phân loại Dự án</span>
                <div className="relative z-[9999]">
                  <Select value={projectFilter} onValueChange={(val) => val && setProjectFilter(val)}>
                    <SelectTrigger className="w-[150px] md:w-[180px] h-10 bg-white dark:bg-white/5 border-none rounded-xl focus:ring-teal-500/30 font-bold text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-300 shadow-sm">
                      <div className="flex items-center gap-2 w-full min-w-0">
                        <Layout className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                        <span className="flex-1 text-left truncate">
                          {projectFilter === 'all' 
                            ? 'Tất cả dự án' 
                            : projects.find((p) => String(p._id) === projectFilter)?.name || 'Dự án'}
                        </span>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-depth-4 bg-white dark:bg-[#1C2322] p-2 z-[9999]">
                      <SelectItem value="all" className="rounded-lg py-2.5 font-bold text-[10px] uppercase tracking-widest">Tất cả dự án</SelectItem>
                      {projects.map((p) => (
                        <SelectItem key={String(p._id)} value={String(p._id)} className="rounded-lg py-2.5 font-bold text-xs">
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Mức độ Ưu tiên</span>
                <div className="relative z-[9999]">
                  <Select value={priorityFilter} onValueChange={(val) => val && setPriorityFilter(val)}>
                    <SelectTrigger className="w-[130px] md:w-[160px] h-10 bg-white dark:bg-white/5 border-none rounded-xl focus:ring-teal-500/30 font-bold text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-300 shadow-sm">
                      <div className="flex items-center gap-2 w-full min-w-0">
                        <Filter className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="flex-1 text-left truncate">
                          {priorityFilter === 'all' ? 'Mọi mức độ' :
                           priorityFilter === 'URGENT' ? 'Khẩn cấp' :
                           priorityFilter === 'HIGH' ? 'Mức độ Cao' :
                           priorityFilter === 'MEDIUM' ? 'Trung bình' :
                           priorityFilter === 'LOW' ? 'Mức độ Thấp' : 'Ưu tiên'}
                        </span>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-depth-4 bg-white dark:bg-[#1C2322] p-2 z-[9999]">
                      <SelectItem value="all" className="rounded-lg py-2.5 font-bold text-[10px] uppercase tracking-widest">Mọi mức độ</SelectItem>
                      <SelectItem value="URGENT" className="rounded-lg py-2.5 font-bold text-[10px] uppercase tracking-widest text-red-500">Khẩn cấp (Chiến lược)</SelectItem>
                      <SelectItem value="HIGH" className="rounded-lg py-2.5 font-bold text-[10px] uppercase tracking-widest text-amber-600">Mức độ Cao</SelectItem>
                      <SelectItem value="MEDIUM" className="rounded-lg py-2.5 font-bold text-[10px] uppercase tracking-widest text-brand-primary">Trung bình</SelectItem>
                      <SelectItem value="LOW" className="rounded-lg py-2.5 font-bold text-[10px] uppercase tracking-widest text-slate-500">Mức độ Thấp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Tiêu chí Sắp xếp</span>
                <div className="relative z-[9999]">
                  <Select value={sortBy} onValueChange={(val) => setSortBy(val as any)}>
                    <SelectTrigger className="w-[130px] md:w-[160px] h-10 bg-white dark:bg-white/5 border-none rounded-xl focus:ring-teal-500/30 font-bold text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-300 shadow-sm">
                      <div className="flex items-center gap-2 w-full min-w-0">
                        <Clock className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <span className="flex-1 text-left truncate">
                          {sortBy === 'date-desc' ? 'Trễ nhất' :
                           sortBy === 'date-asc' ? 'Mới nhất' :
                           sortBy === 'priority' ? 'Độ ưu tiên' : 'Sắp xếp'}
                        </span>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-depth-4 bg-white dark:bg-[#1C2322] p-2 z-[9999]">
                      <SelectItem value="date-desc" className="rounded-lg py-2.5 font-bold text-[10px] uppercase tracking-widest">Thời gian: Trễ nhất</SelectItem>
                      <SelectItem value="date-asc" className="rounded-lg py-2.5 font-bold text-[10px] uppercase tracking-widest">Thời gian: Mới nhất</SelectItem>
                      <SelectItem value="priority" className="rounded-lg py-2.5 font-bold text-[10px] uppercase tracking-widest">Theo độ Ưu tiên</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* List Content */}
        <ScrollArea className="flex-1 min-h-0 px-8">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Đang tải dữ liệu chiến lược...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 pt-4 pb-8">
              {tasks.length > 0 ? (
                tasks.map((task: any, index: number) => (
                  <div
                    key={task._id || index}
                    onClick={() => onTaskClick(task)}
                    className="group relative flex items-center gap-4 p-5 rounded-[24px] bg-slate-50/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white-[0.08] border border-black/5 dark:border-white/5 hover:border-brand-primary/20 transition-all duration-300 cursor-pointer overflow-hidden shadow-sm hover:shadow-xl hover:shadow-brand-primary/5"
                  >
                    <div className={cn(
                      "absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300 group-hover:w-2",
                      task.priority === 'URGENT' || task.priority === 'HIGH' ? "bg-red-500" : "bg-amber-500"
                    )} />

                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-red-500 shadow-sm border border-black/5 dark:border-white/5 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shrink-0">
                      <AlertCircle className="w-6 h-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge className={cn(
                          "text-[9px] font-bold uppercase px-2 py-0.5 border-none rounded-md",
                          task.priority === 'URGENT' || task.priority === 'HIGH' ? "text-red-500 bg-red-50 dark:bg-red-500/10" : "text-amber-500 bg-amber-50 dark:bg-amber-500/10"
                        )}>
                          {task.priority === 'URGENT' ? 'Khẩn cấp' : task.priority === 'HIGH' ? 'Ưu tiên cao' : task.priority === 'MEDIUM' ? 'Trung bình' : 'Thấp'}
                        </Badge>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                          {task.projectId?.name || 'Chưa phân loại'}
                        </span>
                      </div>
                      <h4 className="text-[16px] font-bold text-slate-900 dark:text-white tracking-tight truncate group-hover:text-brand-primary transition-colors">
                        {task.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="hidden sm:flex flex-col items-end">
                        <div className="text-[10px] font-bold text-red-500 uppercase tracking-wider px-2 py-1 bg-red-50 dark:bg-red-500/10 rounded-lg border border-red-100 dark:border-red-500/10">
                          {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true, locale: vi })}
                        </div>
                      </div>
                      {task.assignedTo && (
                        <div className="flex -space-x-2.5">
                          {(Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo]).slice(0, 3).map((member: any, idx: number) => (
                            <UserAvatar
                              key={idx}
                              user={member}
                              size="sm"
                              className="w-10 h-10 border-2 border-white dark:border-slate-900 shadow-sm"
                              showShadow={false}
                            />
                          ))}
                        </div>
                      )}
                      <ChevronRightIcon className="w-5 h-5 text-slate-300 group-hover:translate-x-1.5 group-hover:text-brand-primary transition-all duration-500" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-32 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-24 h-24 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-200">
                    <Layout className="w-12 h-12" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Hệ thống đã được xử lý sạch
                    </h3>
                    <p className="text-slate-500 max-w-sm font-medium">
                      Tuyệt vời! Không còn mục tiêu nào trong danh sách bị đình trệ với các tiêu chí lọc hiện tại.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchQuery('');
                        setPriorityFilter('all');
                        setProjectFilter('all');
                      }}
                      className="mt-4 rounded-xl border-brand-primary/20 text-brand-primary font-bold hover:bg-brand-primary/10"
                    >
                      Đặt lại bộ lọc
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer with Pagination */}
        {pagination.totalCount > 0 && (
          <div className="p-8 border-t border-black/5 dark:border-white/5 bg-slate-50/30 dark:bg-white/2 flex flex-col sm:flex-row items-center justify-between gap-6 shrink-0">
            <div className="flex flex-col items-center sm:items-start gap-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hiển thị tiến độ</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Hiển thị <span className="text-brand-primary">{(page - 1) * pageSize + 1} - {Math.min(page * pageSize, pagination.totalCount)}</span> trong tổng số <span className="text-slate-900 dark:text-white">{pagination.totalCount}</span> nhiệm vụ trễ hạn
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={page === 1 || isLoading}
                onClick={() => setPage(p => p - 1)}
                className="w-10 h-10 rounded-xl border-black/5 dark:border-white/10 hover:bg-white dark:hover:bg-white/5 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>

              <div className="flex items-center gap-1.5 px-2">
                {renderPageNumbers()}
              </div>

              <Button
                variant="outline"
                size="icon"
                disabled={page === pagination.totalPages || isLoading}
                onClick={() => setPage(p => p + 1)}
                className="w-10 h-10 rounded-xl border-black/5 dark:border-white/10 hover:bg-white dark:hover:bg-white/5 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
