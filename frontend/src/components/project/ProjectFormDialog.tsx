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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const EMOJI_LIST = ['📁', '🚀', '🎨', '💡', '🔧', '📊', '🌟', '🔥', '🎯', '🌐', '🛠️', '📱'];

const STATUS_OPTIONS = [
  { value: 'PLANNING', label: 'Lập kế hoạch' },
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'IN_PROGRESS', label: 'Đang triển khai' },
  { value: 'ON_HOLD', label: 'Tạm dừng' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'FROZEN', label: 'Đóng băng' },
];

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
  const [status, setStatus] = useState<Project['status']>(project?.status ?? 'PLANNING');

  React.useEffect(() => {
    setName(project?.name ?? '');
    setDescription(project?.description ?? '');
    setEmoji(project?.emoji ?? '📁');
    setStatus(project?.status ?? 'PLANNING');
  }, [project, open]);

  const isEdit = !!project;

  const mutation = useMutation({
    mutationFn: async () => {
      const data = { name, description, emoji, status };
      if (isEdit) {
        return projectService.updateProject(workspaceId, project!._id, data);
      }
      return projectService.createProject(workspaceId, data);
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
      <DialogContent className="sm:max-w-md rounded-[24px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-black tracking-tight">
            {isEdit ? 'Cấu hình dự án' : 'Bắt đầu dự án mới'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Emoji Picker */}
          <div>
            <Label className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-3 block">Biểu tượng</Label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_LIST.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={cn(
                    'w-10 h-10 text-xl rounded-xl border-2 transition-all duration-200',
                    emoji === e
                      ? 'border-teal-500 bg-teal-50 scale-110 shadow-sm'
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="proj-name" className="text-sm font-bold text-slate-700">Tên dự án *</Label>
            <Input
              id="proj-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên dự án..."
              className="rounded-xl border-slate-200 focus:ring-teal-500 h-11"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-1.5">
                <Label htmlFor="proj-status" className="text-sm font-bold text-slate-700">Trạng thái</Label>
                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                  <SelectTrigger className="rounded-xl border-slate-200 h-11">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="rounded-lg">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="proj-desc" className="text-sm font-bold text-slate-700">Mô tả mục tiêu</Label>
            <Textarea
              id="proj-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn gọn về những gì bạn muốn đạt được..."
              className="rounded-xl border-slate-200 focus:ring-teal-500 min-h-[100px]"
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
