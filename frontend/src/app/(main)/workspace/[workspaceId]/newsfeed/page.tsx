'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { announcementService, Announcement } from '@/services/announcement.service';
import { Megaphone } from 'lucide-react';
import { toast } from 'sonner';

import { FeedCard } from './components/FeedCard';
import { FeedComposer } from './components/FeedComposer';
import { PulseSidebar } from './components/PulseSidebar';
import { useWorkspaceRole } from '@/hooks/useWorkspaceRole';

import { useSearchParams } from 'next/navigation';

export default function NewsfeedPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const workspaceId = params?.workspaceId as string;
  const targetAnnouncementId = searchParams.get('announcementId');
  const targetCommentId = searchParams.get('commentId');
  
  const queryClient = useQueryClient();
  const { isAdminOrOwner } = useWorkspaceRole();

  const { data, isLoading } = useQuery({
    queryKey: ['announcements', workspaceId],
    queryFn: () => announcementService.getAnnouncements(workspaceId),
    enabled: !!workspaceId
  });

  // Tự động cuộn đến bài viết mục tiêu
  React.useEffect(() => {
    if (!isLoading && targetAnnouncementId) {
      setTimeout(() => {
        const element = document.getElementById(`announcement-${targetAnnouncementId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500); // Đợi render xong
    }
  }, [isLoading, targetAnnouncementId]);

  const createMut = useMutation({
    mutationFn: (formData: { title: string; content: string; type: string }) => 
      announcementService.createAnnouncement(workspaceId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', workspaceId] });
      toast.success("Đăng tin thành công");
    },
    onError: () => toast.error("Đã xảy ra lỗi khi tạo bản tin")
  });

  const handleToggleReaction = async (announcementId: string, emoji: string) => {
    try {
      await announcementService.toggleReaction(workspaceId, announcementId, emoji);
      queryClient.invalidateQueries({ queryKey: ['announcements', workspaceId] });
    } catch (error) {
      toast.error('Lỗi khi thao tác');
    }
  };

  const announcements: Announcement[] = data?.announcements || [];

  return (
    <div className="h-full bg-slate-50/50 dark:bg-background overflow-auto hidden-scrollbar pb-20">
      <div className="max-w-[1280px] mx-auto px-6 py-10 mt-7">
        
        {/* Header (Simplified in Obsidian Flow) */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-primary dark:text-white tracking-tight">
            Workspace Feed
          </h1>
          <p className="text-[14px] text-slate-500 mt-2 font-medium">Bảng tin cập nhật, cột mốc và thảo luận của đội nhóm.</p>
        </div>

        {/* 2-Column Obsidian Flow Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
          
          {/* Main Feed Column */}
          <div className="space-y-6">
            
            {/* Inline Composer (The "What's on your mind" block) */}
            {isAdminOrOwner && (
              <FeedComposer 
                onCreate={(formData) => createMut.mutate(formData)} 
                isLoading={createMut.isPending} 
              />
            )}

            {/* Feed List */}
            {isLoading ? (
              <div className="flex justify-center p-12">
                <div className="brand-loader"></div>
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center p-16 border border-dashed border-divider rounded-[32px]">
                <Megaphone className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-[18px] font-bold text-slate-700 dark:text-slate-300">Chưa có bài đăng nào</h3>
                <p className="text-slate-500 text-[14px] font-medium mt-2">Hãy dùng khung phía trên để chia sẻ với nhóm.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {announcements.map((announcement) => (
                  <div id={`announcement-${announcement._id}`} key={announcement._id}>
                    <FeedCard 
                      announcement={announcement} 
                      isAdminOrOwner={isAdminOrOwner}
                      onToggleReaction={(emoji) => handleToggleReaction(announcement._id, emoji)}
                      highlightCommentId={targetCommentId || undefined}
                    />
                  </div>
                ))}
              </div>
            )}
            
          </div>

          {/* Right Sidebar Column */}
          <PulseSidebar announcements={announcements} />

        </div>
      </div>
    </div>
  );
}
