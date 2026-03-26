'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService, Project } from '@/services/project.service';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const EMOJI_LIST = ['📁', '🚀', '🎨', '💡', '🔧', '📊', '🌟', '🔥', '🎯', '🌐', '🛠️', '📱'];

interface ProjectFormDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  project?: Project | null;
}

export function ProjectFormDialog({ open, onClose, workspaceId, project }: ProjectFormDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [emoji, setEmoji] = useState(project?.emoji ?? '📁');

  React.useEffect(() => {
    setName(project?.name ?? '');
    setDescription(project?.description ?? '');
    setEmoji(project?.emoji ?? '📁');
  }, [project, open]);

  const isEdit = !!project;

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEdit) {
        return projectService.updateProject(workspaceId, project!._id, { name, description, emoji });
      }
      return projectService.createProject(workspaceId, { name, description, emoji });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-projects', workspaceId] });
      toast.success(isEdit ? 'Đã cập nhật dự án!' : 'Đã tạo dự án mới!');
      onClose();
    },
    onError: () => {
      toast.error('Có lỗi xảy ra, thử lại nhé!');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Tên dự án không được để trống');
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Chỉnh sửa dự án' : 'Tạo dự án mới'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-2 block">Biểu tượng</Label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_LIST.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={cn(
                    'w-9 h-9 text-xl rounded-lg border-2 transition-all',
                    emoji === e
                      ? 'border-indigo-500 bg-indigo-50 scale-110'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proj-name">Tên dự án *</Label>
            <Input
              id="proj-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Website Relaunch"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proj-desc">Mô tả (tuỳ chọn)</Label>
            <Textarea
              id="proj-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn về dự án..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Huỷ
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo dự án'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
