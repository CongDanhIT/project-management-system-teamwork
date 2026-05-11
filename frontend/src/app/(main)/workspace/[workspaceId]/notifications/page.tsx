'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { interactionService } from '@/services/interaction.service';
import { 
  Bell, 
  Check, 
  AtSign, 
  MessageSquare, 
  User, 
  Clock, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Loader from "@/components/ui/Loader";
import { toast } from 'sonner';

export default function NotificationsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<string | undefined>(undefined);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications-paginated', workspaceId, page, filter],
    queryFn: () => interactionService.getPaginatedNotifications(workspaceId, page, 20, filter),
    enabled: !!workspaceId,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => interactionService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-paginated', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['notifications', workspaceId] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => interactionService.markAllAsRead(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-paginated', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['notifications', workspaceId] });
      toast.success("Đã đánh dấu tất cả là đã đọc");
    },
  });

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsReadMutation.mutateAsync(notification._id);
    }

    // Logic điều hướng (copy từ NotificationCenter)
    if (notification.type === 'TASK_OVERDUE') {
      // Đã ở trang thông báo rồi nên không cần điều hướng đi đâu cả
      return;
    }

    if (notification.refType === 'Announcement') {
      router.push(`/workspace/${workspaceId}/newsfeed?announcementId=${notification.refId}${notification.metadata?.commentId ? `&commentId=${notification.metadata.commentId}` : ''}`);
    } else if (notification.refType === 'Task') {
      const baseUrl = notification.metadata?.projectId 
        ? `/workspace/${workspaceId}/projects/${notification.metadata.projectId}/table`
        : `/workspace/${workspaceId}/tasks`;
      router.push(`${baseUrl}?taskId=${notification.refId}${notification.metadata?.commentId ? `&commentId=${notification.metadata.commentId}` : ''}`);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'MENTIONED': return <AtSign className="w-4 h-4 text-brand-primary" />;
      case 'COMMENT_ADDED': return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'TASK_ASSIGNED': return <User className="w-4 h-4 text-emerald-400" />;
      case 'TASK_OVERDUE': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'TASK_REVIEW_REQUESTED': return <Check className="w-4 h-4 text-amber-500" />;
      case 'TASK_UPDATED': return <Clock className="w-4 h-4 text-slate-400" />;
      default: return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  const filters = [
    { label: 'Tất cả', value: undefined },
    { label: 'Nhắc tên', value: 'MENTIONED' },
    { label: 'Bình luận', value: 'COMMENT_ADDED' },
    { label: 'Giao việc', value: 'TASK_ASSIGNED,TASK_REVIEW_REQUESTED,TASK_UPDATED' },
    { label: 'Quá hạn', value: 'TASK_OVERDUE' },
  ];

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader size="lg" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Hộp thư thông báo</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Theo dõi các hoạt động mới nhất trong không gian làm việc.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => markAllAsReadMutation.mutate()}
          disabled={markAllAsReadMutation.isPending}
          className="rounded-2xl border-slate-200 dark:border-white/10 font-bold gap-2"
        >
          <CheckCheck className="w-4 h-4" />
          Đọc tất cả
        </Button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
          {filters.map((f) => (
            <Button
              key={f.label}
              variant={filter === f.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => { setFilter(f.value); setPage(1); }}
              className={cn(
                "rounded-lg text-[11px] font-black uppercase tracking-widest h-8 px-4",
                filter === f.value ? "bg-white text-brand-primary shadow-sm hover:bg-white" : "text-slate-500"
              )}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {data?.notifications.length > 0 ? (
          <>
            {data.notifications.map((n: any) => (
              <Card 
                key={n._id}
                onClick={() => handleNotificationClick(n)}
                className={cn(
                  "cursor-pointer transition-all duration-300 border-none rounded-3xl overflow-hidden group",
                  n.isRead 
                    ? "bg-slate-50/50 dark:bg-white/2 opacity-70 hover:opacity-100" 
                    : n.type === 'TASK_OVERDUE'
                      ? "bg-white dark:bg-slate-900 shadow-xl shadow-red-200/20 dark:shadow-none border-l-4 border-l-red-500"
                      : "bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/20 dark:shadow-none border-l-4 border-l-brand-primary"
                )}
              >
                <CardContent className="p-6 flex gap-6 items-start">
                  <div className="relative shrink-0">
                    <Avatar className="w-12 h-12 border-2 border-white dark:border-slate-800 shadow-md">
                      <AvatarImage src={n.senderId?.profilePicture} />
                      <AvatarFallback className="font-black text-brand-primary">
                        {n.senderId?.name?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border border-divider flex items-center justify-center shadow-sm">
                      {getIcon(n.type)}
                    </div>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                          {n.senderId?.name}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[9px] font-black uppercase tracking-tighter rounded-full border-slate-200 dark:border-white/10",
                            n.type === 'TASK_OVERDUE' ? "text-red-500 border-red-200" :
                            n.type === 'TASK_ASSIGNED' ? "text-emerald-500 border-emerald-200" :
                            n.type === 'COMMENT_ADDED' ? "text-blue-500 border-blue-200" :
                            n.type === 'MENTIONED' ? "text-brand-primary border-brand-primary/20" : ""
                          )}
                        >
                          {n.type === 'MENTIONED' ? 'Nhắc tên' : 
                           n.type === 'COMMENT_ADDED' ? 'Bình luận' : 
                           n.type === 'TASK_ASSIGNED' ? 'Giao việc' : 
                           n.type === 'TASK_OVERDUE' ? 'Quá hạn' : 
                           n.type === 'TASK_REVIEW_REQUESTED' ? 'Xét duyệt' : 
                           n.type === 'TASK_UPDATED' ? 'Cập nhật' : n.type}
                        </Badge>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(n.createdAt), 'HH:mm, EEEE dd/MM/yyyy', { locale: vi })}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">{n.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      {n.message}
                    </p>
                  </div>

                  {!n.isRead && (
                    <div className="w-2 h-2 rounded-full bg-brand-primary shrink-0 self-center" />
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Trang {data.currentPage} / {data.totalPages}
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="rounded-xl border-slate-200 dark:border-white/10"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  disabled={page === data.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="rounded-xl border-slate-200 dark:border-white/10"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
            <Bell className="w-20 h-20 mb-6 text-slate-300" />
            <h3 className="text-xl font-black uppercase tracking-widest">Hộp thư trống</h3>
            <p className="text-sm font-medium mt-2">Bạn không có thông báo nào phù hợp với bộ lọc.</p>
          </div>
        )}
      </div>
    </div>
  );
}
