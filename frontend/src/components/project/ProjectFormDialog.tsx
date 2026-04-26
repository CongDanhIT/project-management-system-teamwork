'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService, Project } from '@/services/project.service';
import uploadService from '@/services/upload.service';
import { toast } from 'sonner';
import { ImagePlus, Link, Upload, X, Loader2 } from 'lucide-react';
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
  const [coverUrl, setCoverUrl] = useState(project?.coverUrl ?? '');
  const [coverPositionX, setCoverPositionX] = useState(project?.coverPositionX ?? 50);
  const [coverPositionY, setCoverPositionY] = useState(project?.coverPositionY ?? 50);
  const [uploadType, setUploadType] = useState<'url' | 'file'>('url');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setName(project?.name ?? '');
    setDescription(project?.description ?? '');
    setEmoji(project?.emoji ?? '📁');
    setStatus(project?.status ?? 'PLANNING');
    setCoverUrl(project?.coverUrl ?? '');
    setCoverPositionX(project?.coverPositionX ?? 50);
    setCoverPositionY(project?.coverPositionY ?? 50);
  }, [project, open]);

  const isEdit = !!project;

  const mutation = useMutation({
    mutationFn: async () => {
      const data = { name, description, emoji, status, coverUrl, coverPositionX, coverPositionY };
      if (isEdit) {
        return projectService.updateProject(workspaceId, project!._id, data);
      }
      return projectService.createProject(workspaceId, data);
    },
    onSuccess: (data: Project) => {
      // 1. Cụ thể: Làm tươi danh sách dự án của workspace này
      queryClient.invalidateQueries({ queryKey: ['workspace-projects', workspaceId] });

      // 2. Cập nhật cache thủ công (giúp UI phản hồi nhanh hơn - Optimistic)
      queryClient.setQueriesData({ queryKey: ['workspace-projects', workspaceId] }, (oldData: any) => {
        if (!oldData || !oldData.projects) return oldData;
        
        if (isEdit) {
          const updatedProjects = oldData.projects.map((p: Project) =>
            p._id === data._id ? { ...p, ...data } : p
          );
          return { ...oldData, projects: updatedProjects };
        } else {
          return {
            ...oldData,
            projects: [data, ...oldData.projects],
            totalCount: (oldData.totalCount || 0) + 1
          };
        }
      });

      // 3. Luôn làm mới analytics vì số lượng/trạng thái dự án thay đổi
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] });
      
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return toast.error("Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB");
    }

    try {
      setIsUploading(true);
      const result = await uploadService.uploadImage(file);
      setCoverUrl(result.fileUrl);
      toast.success("Đã tải ảnh lên thành công!");
    } catch (error) {
      toast.error("Lỗi khi tải ảnh lên, thử lại nhé!");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md rounded-[40px] p-0 overflow-hidden flex flex-col max-h-[90vh] border-none shadow-depth-3 bg-white dark:bg-slate-950">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3 text-slate-900 dark:text-slate-100">
            <div className="w-1.5 h-8 bg-brand-primary rounded-full shadow-[0_0_15px_rgba(3,93,91,0.3)]" />
            {isEdit ? 'Cấu hình dự án' : 'Bắt đầu dự án mới'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-2 space-y-6 custom-scrollbar">
            {/* Emoji Picker */}
            <div className="space-y-3">
              <Label className="text-[10px] font-black text-slate-400 tracking-widest uppercase block">Biểu tượng</Label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_LIST.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={cn(
                      'w-12 h-12 text-xl rounded-2xl transition-all duration-300 border-none',
                      emoji === e
                        ? 'bg-brand-primary text-white scale-110 shadow-lg shadow-brand-primary/20'
                        : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
              <Label htmlFor="proj-name" className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-1">Tên dự án *</Label>
              <Input
                id="proj-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Campaign Mùa Hè 2024..."
                className="rounded-2xl border-none bg-slate-100/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 ring-0 focus:ring-4 focus:ring-brand-primary/5 transition-all h-14 text-sm font-bold shadow-sm"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="proj-status" className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-1">Trạng thái</Label>
                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                  <SelectTrigger className="rounded-2xl border-none bg-slate-100/50 dark:bg-slate-900/50 h-14 font-bold text-sm shadow-sm">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-depth-3 bg-white dark:bg-slate-900">
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="rounded-xl font-medium focus:bg-brand-primary/10">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-1">Ảnh bìa dự án</Label>
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl shadow-sm">
                  <button
                    type="button"
                    onClick={() => setUploadType('url')}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-black transition-all",
                      uploadType === 'url' ? "bg-white dark:bg-slate-800 text-brand-primary shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    <Link size={12} />
                    URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadType('file')}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-black transition-all",
                      uploadType === 'file' ? "bg-white dark:bg-slate-800 text-brand-primary shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    <Upload size={12} />
                    TẢI LÊN
                  </button>
                </div>
              </div>

              {/* Image Preview Area */}
              {coverUrl && (
                <div className="relative group w-full h-32 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
                  <img
                    src={coverUrl}
                    alt="Cover Preview"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    style={{ objectPosition: `${coverPositionX}% ${coverPositionY}%` }}
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <button
                    type="button"
                    onClick={() => setCoverUrl('')}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-600 hover:text-red-500 shadow-lg transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {coverUrl && (
                <div className="space-y-6 pt-2 bg-slate-50/50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-white/5 animate-in slide-in-from-top-2 duration-300">
                  {/* Trục Y */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                      <span className="flex items-center gap-2">
                        <div className="w-1 h-3 bg-brand-primary rounded-full" />
                        Căn chỉnh (Dọc - Y)
                      </span>
                      <span className="text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-md">{coverPositionY}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={coverPositionY}
                      onChange={(e) => setCoverPositionY(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-brand-primary transition-all hover:h-2"
                    />
                    <div className="flex justify-between text-[8px] text-slate-400 font-bold uppercase tracking-tighter px-1">
                      <span>Trên (0%)</span>
                      <span>Chính giữa</span>
                      <span>Dưới (100%)</span>
                    </div>
                  </div>

                  {/* Trục X */}
                  <div className="space-y-3 border-t border-slate-200/50 dark:border-slate-800/50 pt-4">
                    <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                      <span className="flex items-center gap-2">
                        <div className="w-1 h-3 bg-brand-tertiary rounded-full" />
                        Căn chỉnh (Ngang - X)
                      </span>
                      <span className="text-brand-tertiary bg-brand-tertiary/10 px-2 py-0.5 rounded-md">{coverPositionX}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={coverPositionX}
                      onChange={(e) => setCoverPositionX(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-brand-tertiary transition-all hover:h-2"
                    />
                    <div className="flex justify-between text-[8px] text-slate-400 font-bold uppercase tracking-tighter px-1">
                      <span>Trái (0%)</span>
                      <span>Chính giữa</span>
                      <span>Phải (100%)</span>
                    </div>
                  </div>
                </div>
              )}

              {uploadType === 'url' ? (
                <Input
                  id="proj-cover"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="Dán link ảnh (Unsplash, Pinterest...)"
                  className="rounded-2xl border-none bg-slate-100/50 dark:bg-slate-900/50 h-14 text-sm font-bold shadow-sm"
                />
              ) : (
                <div
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-[32px] p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all",
                    "border-slate-200 dark:border-slate-800 hover:border-brand-primary/40 hover:bg-brand-primary/[0.02]",
                    isUploading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                  />
                  {isUploading ? (
                    <>
                      <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                      <p className="text-xs font-bold text-teal-600">Đang tải lên...</p>
                    </>
                  ) : (
                    <>
                      <ImagePlus className="w-8 h-8 text-slate-400" />
                      <p className="text-xs font-bold text-slate-500">Kéo thả hoặc Click để chọn ảnh</p>
                      <p className="text-[10px] text-slate-400">JPG, PNG, WebP (Tối đa 5MB)</p>
                    </>
                  )}
                </div>
              )}
              <p className="text-[10px] text-slate-400 italic">Gợi ý: Ảnh có tỉ lệ 16:9 sẽ hiển thị đẹp nhất trên Dashboard.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="proj-desc" className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-1">Mô tả mục tiêu</Label>
              <Textarea
                id="proj-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Viết vài dòng về tầm nhìn của dự án..."
                className="rounded-2xl border-none bg-slate-100/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 ring-0 focus:ring-4 focus:ring-brand-primary/5 transition-all min-h-[120px] font-bold shadow-sm p-4"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="px-10 py-8 bg-slate-50/50 dark:bg-slate-900/30 border-none rounded-b-[40px] flex-row gap-4 mt-auto">
            <Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending} className="rounded-full h-12 font-bold flex-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              Huỷ bỏ
            </Button>
            <Button type="submit" disabled={mutation.isPending} className="rounded-full h-12 px-10 bg-brand-primary hover:bg-brand-primary/90 text-white font-black flex-1 shadow-lg shadow-brand-primary/20 brightness-110 active:scale-95 transition-all">
              {mutation.isPending ? 'Đang lưu...' : isEdit ? 'Cập nhật ngay' : 'Bắt đầu ngay'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
