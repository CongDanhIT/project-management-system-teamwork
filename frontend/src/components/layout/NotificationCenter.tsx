'use client';

import React from 'react';
import { Bell, Check, Clock, MessageSquare, User, AtSign, AlertCircle, X, CheckSquare } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { interactionService } from '@/services/interaction.service';
import { useAuthStore } from '@/stores/auth.store';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/providers/SocketProvider';

interface NotificationCenterProps {
  workspaceId: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ workspaceId }) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user: currentUser } = useAuthStore();

  const getDisplayMessage = (n: any) => {
    if (n.type === 'TASK_OVERDUE' && n.recipientId && currentUser) {
      const recipientIdStr = typeof n.recipientId === 'object' ? n.recipientId._id : n.recipientId;
      const currentUserIdStr = currentUser.id;
      if (recipientIdStr !== currentUserIdStr) {
        const recipientName = typeof n.recipientId === 'object' ? n.recipientId.name : '';
        return n.message.replace('của bạn', `của ${recipientName || 'thành viên'}`);
      }
    }
    return n.message;
  };

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', workspaceId],
    queryFn: () => interactionService.getNotifications(workspaceId),
    enabled: !!workspaceId,
    refetchInterval: 30000, // Polking mỗi 30s dự phòng socket
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => interactionService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', workspaceId] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => interactionService.markAllAsRead(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', workspaceId] });
    },
  });

  const { socket, isConnected } = useSocket();

  // Lắng nghe thông báo mới qua Socket
  React.useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewNotification = (data: any) => {
      console.log("[NotificationCenter] New notification signal received:", data);
      // Invalidate cache để tải lại danh sách mới nhất
      queryClient.invalidateQueries({ queryKey: ['notifications', workspaceId] });
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket, isConnected, workspaceId, queryClient]);

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsReadMutation.mutateAsync(notification._id);
    }

    // Điều hướng dựa trên loại hoặc refType
    if (notification.type === 'TASK_OVERDUE') {
      router.push(`/workspace/${workspaceId}/notifications`);
      return;
    }

    if (notification.refType === 'Announcement') {
      const announcementId = notification.refId;
      const commentId = notification.metadata?.commentId;
      
      router.push(`/workspace/${workspaceId}/newsfeed?announcementId=${announcementId}${commentId ? `&commentId=${commentId}` : ''}`);
    } else if (notification.refType === 'Task' || notification.type === 'TASK_REVIEW_REQUESTED') {
      const taskId = notification.refId;
      const projectId = notification.metadata?.projectId;
      const commentId = notification.metadata?.commentId;
      
      // Điều hướng tới view Table của project nếu có projectId, nếu không thì vào danh sách công việc chung
      const baseUrl = projectId 
        ? `/workspace/${workspaceId}/projects/${projectId}/table`
        : `/workspace/${workspaceId}/tasks`;
      
      router.push(`${baseUrl}?taskId=${taskId}${commentId ? `&commentId=${commentId}` : ''}`);
    } else {
      router.push(`/workspace/${workspaceId}`);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'MENTIONED': return <AtSign className="w-3 h-3 text-brand-primary" />;
      case 'COMMENT_ADDED': return <MessageSquare className="w-3 h-3 text-blue-400" />;
      case 'TASK_ASSIGNED': return <User className="w-3 h-3 text-emerald-400" />;
      case 'TASK_UPDATED': return <Clock className="w-3 h-3 text-amber-400" />;
      case 'TASK_REVIEW_REQUESTED': return <CheckSquare className="w-3 h-3 text-brand-secondary" />;
      default: return <AlertCircle className="w-3 h-3 text-slate-400" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger 
        render={
          <Button 
            variant="ghost" 
            size="icon" 
            className="group relative text-slate-400 hover:bg-brand-primary/10 rounded-full h-11 w-11 transition-all duration-300"
          >
            <Bell className="w-6 h-6 group-hover:text-brand-primary" />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border-2 border-white dark:border-slate-900 shadow-sm"></span>
              </span>
            )}
          </Button>
        }
      />

      <DropdownMenuContent 
        align="end" 
        className="w-[380px] p-0 rounded-[28px] shadow-depth-3 border-ghost glass overflow-hidden animate-in fade-in zoom-in-95 duration-200 mt-2"
      >
        <div className="p-5 border-b border-divider/40 bg-modal-surface/50 backdrop-blur-md flex items-center justify-between">
          <div>
            <div className="p-0 text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">
              Thông báo mới
            </div>
            <p className="text-[10px] font-bold text-slate-500 mt-0.5">Bạn có {unreadCount} thông báo chưa đọc</p>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="h-7 px-2 text-[9px] font-black text-brand-primary uppercase tracking-widest hover:bg-brand-primary/5 rounded-lg transition-colors"
            >
              {markAllAsReadMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Đọc tất cả'}
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full opacity-40">
              <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-2" />
              <span className="text-[10px] font-black uppercase tracking-widest">Đang tải...</span>
            </div>
          ) : notifications.length > 0 ? (
            <div className="py-2">
              {notifications.map((n: any) => (
                <DropdownMenuItem 
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={cn(
                    "flex gap-4 p-4 mx-2 my-1 rounded-2xl cursor-pointer transition-all duration-300 group/item relative",
                    n.isRead ? "opacity-60 grayscale-[0.5]" : "bg-brand-primary/5 hover:bg-brand-primary/10 shadow-sm"
                  )}
                >
                   <div className="relative shrink-0">
                    <Avatar className="w-10 h-10 border border-divider shadow-sm">
                      <AvatarImage src={n.type === 'TASK_OVERDUE' ? n.recipientId?.profilePicture : n.senderId?.profilePicture} />
                      <AvatarFallback className="bg-modal-surface text-[10px] font-black text-brand-primary">
                        {(n.type === 'TASK_OVERDUE' ? n.recipientId?.name : n.senderId?.name)?.substring(0, 2).toUpperCase() || 'TF'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border border-divider flex items-center justify-center shadow-sm">
                      {getIcon(n.type)}
                    </div>
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-black text-foreground group-hover/item:text-brand-primary transition-colors">
                        {n.type === 'TASK_OVERDUE' ? n.recipientId?.name : n.senderId?.name}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                        {format(new Date(n.createdAt), 'HH:mm, dd/MM', { locale: vi })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                      <span className="font-bold text-slate-400 mr-1">{n.title}:</span>
                      {getDisplayMessage(n)}
                    </p>
                  </div>

                  {!n.isRead && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <div className="w-2 h-2 rounded-full bg-brand-primary shadow-[0_0_8px_rgba(45,212,191,0.6)]" />
                    </div>
                  )}
                </DropdownMenuItem>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-12 text-center opacity-30">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <Bell className="w-8 h-8" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                Hộp thư trống rỗng.<br />Không có thông báo nào.
              </p>
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t border-divider/40 bg-modal-surface/20 text-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push(`/workspace/${workspaceId}/notifications`)}
            className="w-full text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-brand-primary transition-colors"
          >
            Xem tất cả thông báo
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
