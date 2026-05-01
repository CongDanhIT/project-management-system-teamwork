'use client';

import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AssetFolder } from '@/types/phase';
import { AssetService } from '@/services/asset.service';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FolderPlus, Loader2 } from 'lucide-react';

interface AssetFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    folder?: AssetFolder | null;
    projectId: string;
    workspaceId: string;
    phaseId?: string | null;
    parentFolderId?: string | null;
}

export function AssetFolderModal({ isOpen, onClose, folder, projectId, workspaceId, phaseId, parentFolderId }: AssetFolderModalProps) {
    const queryClient = useQueryClient();
    const [name, setName] = useState('');

    useEffect(() => {
        if (folder) {
            setName(folder.name);
        } else {
            setName('');
        }
    }, [folder, isOpen]);

    const mutation = useMutation({
        mutationFn: async (data: { name: string }) => {
            if (folder) {
                return AssetService.updateFolder(folder._id, data);
            } else {
                return AssetService.createFolder({
                    ...data,
                    projectId,
                    workspaceId,
                    phaseId,
                    parentFolderId: parentFolderId || undefined,
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-assets', projectId] });
            toast.success(folder ? 'Đã cập nhật thư mục' : 'Đã tạo thư mục mới');
            onClose();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error('Vui lòng nhập tên thư mục');
            return;
        }
        mutation.mutate({ name });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px] rounded-[32px] border-slate-200/60 dark:border-white/10 shadow-2xl">
                <DialogHeader>
                    <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-4">
                        <FolderPlus className="w-6 h-6 text-amber-500" />
                    </div>
                    <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white">
                        {folder ? 'Đổi tên thư mục' : 'Tạo thư mục mới'}
                    </DialogTitle>
                    <DialogDescription className="text-slate-500">
                        {folder ? 'Nhập tên mới cho thư mục của bạn.' : 'Tổ chức các tài liệu của bạn vào các thư mục riêng biệt.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="folder-name" className="text-xs font-black uppercase tracking-widest text-slate-400">Tên thư mục</Label>
                        <Input
                            id="folder-name"
                            placeholder="VD: Bản vẽ kỹ thuật, Tài liệu pháp lý..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="rounded-2xl h-12 bg-slate-50 dark:bg-white/5 border-slate-200/60 dark:border-white/10 focus:ring-amber-500/20"
                            autoFocus
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="rounded-2xl h-12 px-6 font-bold"
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            disabled={mutation.isPending}
                            className="rounded-2xl h-12 px-8 bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg shadow-amber-500/20"
                        >
                            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {folder ? 'Cập nhật' : 'Tạo thư mục'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
