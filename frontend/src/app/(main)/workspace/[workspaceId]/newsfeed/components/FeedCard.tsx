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
  Trash2,
  Download,
  Zap,
  Smile,
  Reply
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { cn } from '@/lib/utils';
import { workspaceService } from '@/services/workspace.service';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { Announcement, announcementService, Attachment } from '@/services/announcement.service';
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
  highlightCommentId?: string;
}

export function FeedCard({ announcement, onToggleReaction, isAdminOrOwner, highlightCommentId }: FeedCardProps) {
  const { user } = useAuthStore();
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [mentionedUserIds, setMentionedUserIds] = useState<Set<string>>(new Set());

  const { data: workspaceTags } = useQuery({
    queryKey: ['workspaceTags', workspaceId],
    queryFn: () => tagService.getTags(workspaceId as string),
    enabled: !!workspaceId
  });

  const { data: workspaceMembers } = useQuery({
    queryKey: ['workspaceMembers', workspaceId],
    queryFn: () => workspaceService.getMembers(workspaceId as string),
    enabled: !!workspaceId
  });

  // Tự động mở bình luận và cuộn đến nếu có highlight
  React.useEffect(() => {
    if (highlightCommentId && announcement.comments) {
      const hasComment = announcement.comments.some(c => c._id === highlightCommentId);
      if (hasComment) {
        setShowComments(true);
        setTimeout(() => {
          const commentEl = document.getElementById(`comment-${highlightCommentId}`);
          if (commentEl) {
            commentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 500);
      }
    }
  }, [highlightCommentId, announcement.comments]);

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
    mutationFn: (data: { title?: string; content?: string; attachments?: Attachment[] }) => 
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

  const addCommentMut = useMutation({
    mutationFn: (data: { content: string; replyTo?: string; mentions?: string[] }) => 
      announcementService.addComment(announcement.workspaceId, announcement._id, data.content, data.replyTo, data.mentions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', announcement.workspaceId] });
      setCommentText('');
      setReplyingTo(null);
      setMentionedUserIds(new Set());
      toast.success("Đã gửi bình luận");
    },
    onError: () => toast.error("Lỗi khi gửi bình luận")
  });

  const deleteCommentMut = useMutation({
    mutationFn: (commentId: string) => announcementService.deleteComment(announcement.workspaceId, announcement._id, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', announcement.workspaceId] });
      toast.success("Đã xóa bình luận");
    },
    onError: () => toast.error("Lỗi khi xóa bình luận")
  });

  const toggleCommentReactionMut = useMutation({
    mutationFn: ({ commentId, emoji }: { commentId: string; emoji: string }) => 
      announcementService.toggleCommentReaction(announcement.workspaceId, announcement._id, commentId, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', announcement.workspaceId] });
    },
    onError: () => toast.error("Lỗi khi thao tác cảm xúc")
  });

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addCommentMut.mutate({ 
      content: commentText.trim(), 
      replyTo: replyingTo?.id,
      mentions: Array.from(mentionedUserIds)
    });
  };

  const handleDeleteComment = (commentId: string) => {
    if (window.confirm("Xóa bình luận này?")) {
      deleteCommentMut.mutate(commentId);
    }
  };

  const handleReply = (comment: any) => {
    setReplyingTo({ id: comment.authorId?._id || comment.authorId, name: comment.authorId?.name });
    setCommentText(`@${comment.authorId?.name} `);
    setShowComments(true);
    // Focus textarea after a short delay
    setTimeout(() => {
      const textarea = document.getElementById(`comment-textarea-${announcement._id}`) as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        textarea.selectionStart = textarea.value.length;
      }
    }, 100);
  };

  const onEmojiClick = (emojiData: any) => {
    setCommentText(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
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

  const handleDownload = (url: string, fileName: string) => {
    try {
      let finalUrl = url;

      // Nếu là link từ Cloudflare R2 (thường chứa chuỗi r2.cloudflarestorage.com)
      // Ta cần đi qua backend để lấy Signed URL vì bucket đang để chế độ Private
      if (url.includes('r2.cloudflarestorage.com')) {
        const urlParts = url.split('/');
        // Tìm vị trí của "newsfeed" trong path để lấy fileKey
        const newsfeedIndex = urlParts.findIndex(part => part === 'newsfeed');
        if (newsfeedIndex !== -1) {
          const fileKey = urlParts.slice(newsfeedIndex).join('/');
          const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
          finalUrl = `${apiBase}/upload/download?key=${encodeURIComponent(fileKey)}`;
        }
      }

      const link = document.createElement('a');
      link.href = finalUrl;
      link.download = fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Đang chuẩn bị tải xuống: ${fileName}`);
    } catch (error) {
      window.open(url, '_blank');
    }
  };

  const images = announcement.attachments?.filter(att => 
    att.fileType === 'IMAGE' || /\.(jpg|jpeg|png|webp|gif)$/i.test(att.fileUrl)
  ) || [];

  const files = announcement.attachments?.filter(att => 
    att.fileType !== 'IMAGE' && !/\.(jpg|jpeg|png|webp|gif)$/i.test(att.fileUrl)
  ) || [];

  // Editorial Tech styles - No-Line Rule & Obsidian Meridian Palette
  return (
    <div 
      id={`announcement-${announcement._id}`}
      className="group relative p-8 rounded-[32px] bg-white dark:bg-surface-secondary shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)] dark:shadow-none transition-all duration-500 scroll-mt-24"
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

        {/* Images Grid */}
        {images.length > 0 && (
          <div className={`mt-6 grid gap-4 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {images.map((img, idx) => (
              <div 
                key={idx} 
                className="relative rounded-[24px] overflow-hidden bg-slate-50 dark:bg-surface-tertiary border border-divider group cursor-pointer" 
                style={{ aspectRatio: images.length === 1 ? 'auto' : '16/9', maxHeight: '400px' }}
                onClick={() => setSelectedImage(img.fileUrl)}
              >
                <img src={img.fileUrl} alt={img.fileName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
            ))}
          </div>
        )}

        {/* Files List (Discrete Zalo-style cards) */}
        {files.length > 0 && (
          <div className="mt-4 space-y-3">
            {files.map((file, idx) => (
              <div 
                key={idx}
                onClick={() => handleDownload(file.fileUrl, file.fileName)}
                className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-surface-tertiary border border-divider hover:border-brand-primary/30 dark:hover:border-brand-secondary/30 transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-white dark:bg-surface-secondary flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <div className="relative">
                    <FileText className="w-6 h-6 text-brand-primary" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-brand-primary border-2 border-white dark:border-surface-secondary" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-slate-700 dark:text-slate-200 truncate pr-4">
                    {file.fileName}
                  </p>
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">
                    Tài liệu • {file.fileName.split('.').pop()?.toUpperCase()}
                  </p>
                </div>
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 group-hover:text-brand-primary transition-colors">
                   <Download className="w-5 h-5" />
                </div>
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

          <button 
            onClick={() => setShowComments(!showComments)}
            className={`group/btn flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-bold transition-all ${
              showComments 
                ? 'text-brand-primary bg-brand-primary/10' 
                : 'text-slate-500 bg-slate-50 hover:bg-slate-100 dark:bg-surface-tertiary dark:hover:bg-white/5'
            }`}
          >
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
                  className="w-7 h-7 rounded-full border-2 border-white dark:border-surface-secondary bg-slate-100 dark:bg-surface-tertiary transition-transform hover:-translate-y-1 hover:z-10 cursor-alias shadow-sm"
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
                 <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-surface-tertiary border-2 border-white dark:border-surface-secondary flex items-center justify-center text-[9px] font-black text-slate-500 shadow-sm">
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




      {/* Comments Section */}
      {showComments && (
        <div className="mt-8 pt-8 border-t border-divider animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 mb-6">
            <h4 className="text-[15px] font-bold text-slate-800 dark:text-white">Thảo luận</h4>
            <div className="h-px flex-1 bg-divider opacity-50" />
          </div>

          <div className="space-y-6 mb-8">
            {announcement.comments?.map((comment) => (
              <div 
                key={comment._id} 
                id={`comment-${comment._id}`}
                className={cn(
                  "flex gap-4 group/comment p-2 rounded-[24px] transition-all duration-700",
                  highlightCommentId === comment._id && "bg-brand-primary/10 ring-1 ring-brand-primary/20 scale-[1.01] shadow-sm"
                )}
              >
                <UserAvatar user={comment.authorId} size="sm" showShadow={false} />
                <div className="flex-1">
                  <div className="bg-slate-50 dark:bg-surface-tertiary p-4 rounded-[20px] rounded-tl-none relative">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-[13px] text-slate-900 dark:text-white">
                        {comment.authorId?.name}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: vi })}
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      {comment.content}
                    </p>

                    {/* Comment Actions (Reply & React) */}
                    <div className="flex items-center gap-4 mt-2">
                      <button 
                        onClick={() => handleReply(comment)}
                        className="text-[11px] font-bold text-slate-400 hover:text-brand-primary transition-colors flex items-center gap-1"
                      >
                        <Reply className="w-3 h-3" />
                        Phản hồi
                      </button>

                      <Popover>
                        <PopoverTrigger className="text-[11px] font-bold text-slate-400 hover:text-brand-primary transition-colors">
                          Thả cảm xúc
                        </PopoverTrigger>
                        <PopoverContent side="top" align="start" className="w-auto p-1.5 rounded-full bg-white dark:bg-surface-secondary border-divider shadow-xl flex gap-1 animate-in fade-in zoom-in-95">
                          {['👍', '❤️', '😆', '😮', '😢'].map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => toggleCommentReactionMut.mutate({ commentId: comment._id, emoji })}
                              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-base transition-transform hover:scale-125"
                            >
                              {emoji}
                            </button>
                          ))}
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Active Comment Reactions */}
                    {comment.reactions && comment.reactions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {comment.reactions.map((r: any) => (
                          <button
                            key={r.emoji}
                            onClick={() => toggleCommentReactionMut.mutate({ commentId: comment._id, emoji: r.emoji })}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold transition-all ${
                              r.userIds.some((u: any) => (u._id || u) === user?.id)
                                ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary'
                                : 'bg-white dark:bg-surface-secondary border-divider text-slate-500'
                            }`}
                          >
                            <span>{r.emoji}</span>
                            <span>{r.userIds.length}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Delete comment button (only author or admin) */}
                    {(comment.authorId?._id === user?.id || comment.authorId === user?.id || isAdminOrOwner) && (
                      <button 
                        onClick={() => handleDeleteComment(comment._id)}
                        className="absolute -right-2 -top-2 w-7 h-7 rounded-full bg-white dark:bg-surface-secondary shadow-depth-1 border border-divider flex items-center justify-center text-slate-400 hover:text-red-500 opacity-0 group-comment-hover:opacity-100 transition-all scale-75 group-comment-hover:scale-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {(!announcement.comments || announcement.comments.length === 0) && (
              <div className="text-center py-6">
                <p className="text-[13px] font-medium text-slate-400 italic">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
              </div>
            )}
          </div>

          {/* Comment Input */}
          <div className="flex gap-4 items-start">
            <UserAvatar user={user as any} size="sm" showShadow={false} />
            <div className="flex-1 relative">
              {/* Replying To Indicator */}
              {replyingTo && (
                <div className="flex items-center justify-between px-4 py-1.5 bg-brand-primary/5 border border-brand-primary/10 rounded-t-[18px] -mb-2 animate-in slide-in-from-bottom-1">
                  <span className="text-[11px] text-brand-primary font-medium flex items-center gap-2">
                    <Reply className="w-3 h-3" />
                    Đang phản hồi <strong>{replyingTo.name}</strong>
                  </span>
                  <button 
                    onClick={() => {
                      setReplyingTo(null);
                      if (commentText.startsWith(`@${replyingTo.name} `)) {
                        setCommentText(commentText.replace(`@${replyingTo.name} `, ''));
                      }
                    }}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Mentions Suggestion List */}
              {commentText.includes('@') && (() => {
                const parts = commentText.split(' ');
                const lastPart = parts[parts.length - 1];
                if (lastPart.startsWith('@')) {
                  const query = lastPart.substring(1).toLowerCase();
                  const filteredMembers = workspaceMembers?.members?.filter((m: any) => 
                    m.userId?.name.toLowerCase().includes(query)
                  ) || [];

                  if (filteredMembers.length > 0) {
                    return (
                      <div className="absolute bottom-full left-0 w-64 bg-white dark:bg-surface-secondary border border-divider rounded-2xl shadow-2xl mb-2 overflow-hidden z-50 animate-in slide-in-from-bottom-2">
                        <div className="p-2 border-b border-divider bg-slate-50 dark:bg-white/5">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nhắc tên thành viên</span>
                        </div>
                        <div className="max-h-48 overflow-auto py-1">
                          {filteredMembers.map((m: any) => (
                            <button
                              key={m.userId._id}
                              onClick={() => {
                                const newParts = [...parts];
                                newParts[newParts.length - 1] = `@${m.userId.name} `;
                                setCommentText(newParts.join(' '));
                                setMentionedUserIds(prev => new Set(prev).add(m.userId._id));
                                const textarea = document.getElementById(`comment-textarea-${announcement._id}`) as HTMLTextAreaElement;
                                textarea?.focus();
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left"
                            >
                              <UserAvatar user={m.userId} size="sm" />
                              <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">{m.userId.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  }
                }
                return null;
              })()}

              <textarea 
                id={`comment-textarea-${announcement._id}`}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                placeholder="Viết bình luận của bạn... (Gõ @ để nhắc tên)"
                className="w-full bg-slate-50 dark:bg-surface-tertiary border border-divider focus:border-brand-primary/50 focus:ring-4 focus:ring-brand-primary/5 rounded-[24px] p-4 pr-24 text-[13px] text-slate-700 dark:text-white placeholder:text-slate-400 outline-none resize-none min-h-[52px] transition-all"
                rows={1}
              />
              
              <div className="absolute right-3 bottom-2 flex items-center gap-1">
                {/* Emoji Picker Button */}
                <div className="relative">
                  <button 
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-brand-primary hover:bg-brand-primary/5 transition-all"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  
                  {showEmojiPicker && (
                    <div className="absolute bottom-full right-0 mb-4 z-[60]">
                      <div className="fixed inset-0" onClick={() => setShowEmojiPicker(false)} />
                      <div className="relative">
                        <EmojiPicker 
                          onEmojiClick={onEmojiClick}
                          autoFocusSearch={false}
                          theme={'light' as any}
                          width={300}
                          height={400}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleAddComment}
                  disabled={!commentText.trim() || addCommentMut.isPending}
                  className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center hover:scale-110 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
                >
                  <Zap className="w-4 h-4 fill-current" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
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
