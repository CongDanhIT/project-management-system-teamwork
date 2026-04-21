import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
  Heart, 
  MessageSquare, 
  Megaphone, 
  Flag, 
  AlertTriangle, 
  Pin, 
  FileText,
  MoreVertical,
  Pencil,
  Trash2
} from 'lucide-react';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { Announcement, announcementService } from '@/services/announcement.service';
import { useAuthStore } from '@/stores/auth.store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FeedEditModal } from './FeedEditModal';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useParams } from 'next/navigation';
import { tagService } from '@/services/tag.service';

interface FeedCardProps {
  announcement: Announcement;
  onToggleReaction: (emoji: string) => void;
  isAdminOrOwner?: boolean;
}

export function FeedCard({ announcement, onToggleReaction, isAdminOrOwner }: FeedCardProps) {
  const { user } = useAuthStore();
  const { workspaceId } = useParams();
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: workspaceTags } = useQuery({
    queryKey: ['workspaceTags', workspaceId],
    queryFn: () => tagService.getTags(workspaceId as string),
    enabled: !!workspaceId
  });

  const deleteMut = useMutation({
    mutationFn: () => announcementService.deleteAnnouncement(announcement.workspaceId, announcement._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', announcement.workspaceId] });
      toast.success("Đã xóa bản tin");
    },
    onError: () => toast.error("Lỗi khi xóa bản tin")
  });

  const togglePinMut = useMutation({
    mutationFn: () => announcementService.togglePin(announcement.workspaceId, announcement._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', announcement.workspaceId] });
      toast.success(announcement.isPinned ? "Đã bỏ ghim" : "Đã ghim bản tin");
    },
    onError: () => toast.error("Lỗi khi thao tác ghim")
  });

  const updateMut = useMutation({
    mutationFn: (data: { title?: string; content?: string }) => 
      announcementService.updateAnnouncement(announcement.workspaceId, announcement._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', announcement.workspaceId] });
      toast.success("Đã cập nhật bản tin");
      setIsEditModalOpen(false);
    },
    onError: () => toast.error("Lỗi khi cập nhật bản tin")
  });

  const handleDelete = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa bản tin này?")) {
      deleteMut.mutate();
    }
  };

  const handleTogglePin = () => {
    togglePinMut.mutate();
  };

  const handleUpdate = (data: any) => {
    updateMut.mutate(data);
  };

  const getIcon = () => {
    switch (announcement.type) {
      case 'MILESTONE': return <Flag className="w-5 h-5 text-teal-400" />;
      case 'ALERT': return <AlertTriangle className="w-5 h-5 text-brand-secondary" />; // Neon Lime
      default: return <Megaphone className="w-5 h-5 text-slate-400" />;
    }
  };

  const isLiked = announcement.reactions?.some((r: any) => r.emoji === '❤️' && r.userIds.includes(user?.id));
  const likesCount = announcement.reactions?.find((r: any) => r.emoji === '❤️')?.userIds.length || 0;

  const renderContent = (content: string) => {
    if (!content) return null;
    
    // Regex tìm các hashtag (VD: #thiết-kế, #database)
    const parts = content.split(/(#[a-zA-Z0-9À-ỹ_-]+)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        const tagName = part.substring(1);
        const matchingTag = workspaceTags?.find(t => t.name.toLowerCase() === tagName.toLowerCase());
        
        if (matchingTag) {
          return (
            <span 
              key={index}
              className="inline-flex items-center px-2 py-0.5 rounded-md mx-0.5 font-bold text-[13px] transition-all"
              style={{ 
                backgroundColor: `${matchingTag.color}20`,
                color: matchingTag.color,
                border: `1px solid ${matchingTag.color}40`
              }}
            >
              <span className="opacity-70 mr-0.5">#</span>
              {matchingTag.name}
            </span>
          );
        }
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Editorial Tech styles - No-Line Rule & Obsidian Meridian Palette
  return (
    <div 
      id={`announcement-${announcement._id}`}
      className="group relative p-8 rounded-[32px] bg-white dark:bg-surface-secondary shadow-ambient dark:shadow-none transition-all duration-500 scroll-mt-24"
    >
      
      {/* Header section */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <UserAvatar user={announcement.createdBy} size="default" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[15px] text-slate-900 dark:text-white">
                {announcement.createdBy?.name || 'Unknown User'}
              </span>
            </div>
            <span className="text-[12px] font-medium text-slate-500 dark:text-text-dim">
              {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true, locale: vi })}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Type Icon - Always Visible */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 dark:bg-surface-tertiary">
            {getIcon()}
          </div>

          {/* Pinned Badge - Moved inside header flow */}
          {announcement.isPinned && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary dark:bg-brand-secondary/10 dark:text-brand-secondary text-[10px] font-black uppercase tracking-wider animate-in fade-in zoom-in-95">
              <Pin className="w-3 h-3 fill-current" />
              <span>Pinned</span>
            </div>
          )}

          {isAdminOrOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-slate-400 outline-none">
                <MoreVertical className="w-5 h-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 p-2 rounded-2xl bg-white dark:bg-surface-secondary border-divider shadow-xl">
                <DropdownMenuItem 
                  onClick={handleTogglePin}
                  className="flex items-center gap-2 p-3 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 font-bold text-slate-700 dark:text-slate-200"
                >
                  <Pin className={`w-4 h-4 ${announcement.isPinned ? 'fill-current' : ''}`} />
                  {announcement.isPinned ? 'Bỏ ghim' : 'Ghim bản tin'}
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex items-center gap-2 p-3 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 font-bold text-slate-700 dark:text-slate-200"
                >
                  <Pencil className="w-4 h-4" />
                  Chỉnh sửa
                </DropdownMenuItem>

                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="flex items-center gap-2 p-3 rounded-xl cursor-pointer hover:bg-red-50 dark:hover:bg-red-500/10 font-bold text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa bài đăng
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      
      {/* Content Section */}
      <div className="mb-8">
        <h3 className="text-[20px] font-bold mb-3 text-slate-900 dark:text-white leading-tight">
          {announcement.title}
        </h3>
        
        <div className="text-[14px] leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
          {renderContent(announcement.content)}
        </div>

        {/* Attachments Section */}
        {announcement.attachments && announcement.attachments.length > 0 && (
          <div className={`mt-6 grid gap-4 ${announcement.attachments.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {announcement.attachments.map((att, idx) => (
              <div 
                key={idx} 
                className="relative rounded-[24px] overflow-hidden bg-slate-50 dark:bg-surface-tertiary border border-divider group cursor-pointer" 
                style={{ aspectRatio: announcement.attachments!.length === 1 && att.fileType === 'IMAGE' ? 'auto' : '16/9', maxHeight: '400px' }}
                onClick={() => {
                   if (att.fileType === 'IMAGE') setSelectedImage(att.fileUrl);
                   else window.open(att.fileUrl, '_blank');
                }}
              >
                {(() => {
                  const isImage = att.fileType === 'IMAGE' || 
                                 /\.(jpg|jpeg|png|webp|gif)$/i.test(att.fileUrl);
                  return isImage ? (
                    <img src={att.fileUrl} alt={att.fileName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full p-4 text-center hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6 text-brand-primary" />
                      </div>
                      <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200 line-clamp-2">{att.fileName}</span>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer / Interaction Bar */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger className={`group/btn flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-bold transition-all outline-none ${
              isLiked 
                ? 'text-rose-500 bg-rose-500/10' 
                : 'text-slate-500 bg-slate-50 hover:bg-slate-100 dark:bg-surface-tertiary dark:hover:bg-white/5'
            }`}>
              <Heart className={`w-[18px] h-[18px] transition-transform group-hover/btn:scale-110 ${isLiked ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">Thả cảm xúc</span>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-auto p-1.5 rounded-full bg-white dark:bg-surface-secondary border-divider shadow-xl flex gap-1 animate-in fade-in zoom-in-95">
              {['👍', '😮', '😢', '😆', '❤️'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => onToggleReaction(emoji)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-xl transition-transform hover:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </PopoverContent>

          </Popover>

          <button className="group/btn flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 dark:bg-surface-tertiary dark:hover:bg-white/5 transition-all">
            <MessageSquare className="w-[18px] h-[18px] transition-transform group-hover/btn:scale-110" />
            {announcement.comments?.length > 0 && <span>{announcement.comments.length}</span>}
            {(!announcement.comments || announcement.comments.length === 0) && <span>Thảo luận</span>}
          </button>
        </div>

        {/* Reaction Capsules - Clean version (Text only, Populated names via title) */}
        {announcement.reactions && announcement.reactions.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 ml-1">
            {announcement.reactions.map((reaction: any) => {
              const hasReacted = reaction.userIds.some((u: any) => (u._id || u) === user?.id);
              const names = reaction.userIds.map((u: any) => u.name).join(', ');
              
              return (
                <button
                  key={reaction.emoji}
                  onClick={() => onToggleReaction(reaction.emoji)}
                  title={names}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold border transition-all ${
                    hasReacted 
                      ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary' 
                      : 'bg-white dark:bg-surface-tertiary border-divider text-slate-500 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  <span className="text-[14px]">{reaction.emoji}</span>
                  <span>{reaction.userIds.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Interaction Summary Row (New) */}
      {announcement.reactions && announcement.reactions.length > 0 && (() => {
        // Collect all unique participants across all reactions
        const allParticipants: any[] = [];
        const seenIds = new Set();
        
        announcement.reactions.forEach((r: any) => {
          r.userIds.forEach((u: any) => {
            if (!seenIds.has(u._id)) {
              seenIds.add(u._id);
              allParticipants.push(u);
            }
          });
        });

        if (allParticipants.length === 0) return null;

        return (
          <div className="mt-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex -space-x-2.5">
              {allParticipants.slice(0, 5).map((p, idx) => (
                <div 
                  key={p._id} 
                  className="w-7 h-7 rounded-full border-2 border-white dark:border-surface-secondary bg-slate-100 dark:bg-surface-tertiary transition-transform hover:-translate-y-1 hover:z-10 cursor-alias"
                  title={p.name}
                >
                  {p.profilePicture ? (
                    <img src={p.profilePicture} alt={p.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-brand-primary/20 text-brand-primary text-[10px] font-black rounded-full">
                      {p.name?.charAt(0)}
                    </div>
                  )}
                </div>
              ))}
              {allParticipants.length > 5 && (
                 <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-surface-tertiary border-2 border-white dark:border-surface-secondary flex items-center justify-center text-[9px] font-black text-slate-500">
                    +{allParticipants.length - 5}
                 </div>
              )}
            </div>
            
            <div className="text-[12px] font-medium text-slate-500 dark:text-text-dim">
                <span className="font-bold text-slate-700 dark:text-white">
                  {allParticipants[0]?.name}
                </span>
                {allParticipants.length === 2 && (
                  <> và <span className="font-bold text-slate-700 dark:text-white">{allParticipants[1]?.name}</span></>
                )}
                {allParticipants.length > 2 && (
                  <> và <span className="font-bold text-slate-700 dark:text-white">{allParticipants.length - 1} thành viên khác</span></>
                )}
                <span> đã thảo luận & thả cảm xúc</span>
            </div>
          </div>
        );
      })()}




      {/* Image Preview Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <img 
            src={selectedImage} 
            alt="Preview" 
            className="max-w-full max-h-full rounded-[24px] shadow-2xl scale-100 animate-in zoom-in-95 duration-200" 
          />
        </div>
      )}

      {/* Edit Modal */}
      <FeedEditModal 
        announcement={announcement}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={handleUpdate}
        isLoading={updateMut.isPending}
      />
    </div>
  );
}
