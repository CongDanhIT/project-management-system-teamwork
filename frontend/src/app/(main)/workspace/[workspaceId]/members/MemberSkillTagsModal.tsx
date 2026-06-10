'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagService } from '@/services/tag.service';
import { workspaceService } from '@/services/workspace.service';
import { Loader2, Tags, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MemberSkillTagsModalProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  memberId: string;
  memberName: string;
  currentTags: string[];
}

export const MemberSkillTagsModal: React.FC<MemberSkillTagsModalProps> = ({
  open,
  onClose,
  workspaceId,
  memberId,
  memberName,
  currentTags,
}) => {
  const queryClient = useQueryClient();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setSelectedTags(currentTags);
    }
  }, [open, currentTags]);

  const { data: tags, isLoading } = useQuery({
    queryKey: ['workspace-member-tags', workspaceId],
    queryFn: () => tagService.getTags(workspaceId, 'MEMBER'),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: (skillTags: string[]) => workspaceService.updateMemberSkills(workspaceId, memberId, skillTags),
    onSuccess: () => {
      toast.success('Đã cập nhật kỹ năng thành công');
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
      onClose();
    },
    onError: () => {
      toast.error('Lỗi khi cập nhật kỹ năng');
    }
  });

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSave = () => {
    mutation.mutate(selectedTags);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md rounded-[32px] p-0 overflow-hidden border-none shadow-depth-3 bg-white dark:bg-slate-950">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50">
          <DialogTitle className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Tags className="w-5 h-5 text-brand-primary" />
            Kỹ năng của {memberName}
          </DialogTitle>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Gắn nhãn kỹ năng để hệ thống AI (Smart Scanner) có thể tự động đề xuất {memberName} vào các công việc phù hợp.
          </p>
        </DialogHeader>

        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center py-8 text-brand-primary">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Đang tải...</p>
            </div>
          ) : tags && tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => {
                const isSelected = selectedTags.includes(tag._id);
                return (
                  <button
                    key={tag._id}
                    onClick={() => toggleTag(tag._id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-200",
                      isSelected 
                        ? "shadow-md scale-105" 
                        : "opacity-60 hover:opacity-100 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900"
                    )}
                    style={{
                      borderColor: isSelected ? tag.color : `${tag.color}40`,
                      backgroundColor: isSelected ? `${tag.color}15` : 'transparent',
                      color: tag.color
                    }}
                  >
                    <span 
                      className="w-1.5 h-1.5 rounded-full" 
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                    {isSelected && <Check className="w-3 h-3 ml-1" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm font-medium text-slate-500">Chưa có nhãn Kỹ năng nào.</p>
              <p className="text-xs text-slate-400 mt-1">Vui lòng thêm nhãn Kỹ năng (loại MEMBER) trong phần Cài đặt Workspace.</p>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-white/5">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="rounded-full font-bold"
            disabled={mutation.isPending}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleSave}
            className="rounded-full bg-brand-primary hover:bg-brand-primary/90 text-white font-bold min-w-[120px]"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu thay đổi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
