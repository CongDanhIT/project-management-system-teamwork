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
import { Textarea } from "@/components/ui/textarea";
import { Phase } from '@/types/phase';
import { PhaseService } from '@/services/phase.service';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface PhaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    phase?: Phase | null;
    projectId: string;
    workspaceId: string;
}

export function PhaseModal({ isOpen, onClose, phase, projectId, workspaceId }: PhaseModalProps) {
    const queryClient = useQueryClient();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        if (phase) {
            setName(phase.name);
            setDescription(phase.description || '');
            setStartDate(phase.startDate ? format(new Date(phase.startDate), 'yyyy-MM-dd') : '');
            setEndDate(phase.endDate ? format(new Date(phase.endDate), 'yyyy-MM-dd') : '');
        } else {
            setName('');
            setDescription('');
            setStartDate('');
            setEndDate('');
        }
    }, [phase, isOpen]);

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            if (phase) {
                return PhaseService.updatePhase(phase._id, data);
            } else {
                return PhaseService.createPhase({
                    ...data,
                    projectId,
                    workspaceId,
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-phases', projectId] });
            toast.success(phase ? 'Đã cập nhật giai đoạn' : 'Đã tạo giai đoạn mới');
            onClose();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error('Vui lòng nhập tên giai đoạn');
            return;
        }
        mutation.mutate({
            name,
            description,
            startDate: startDate || null,
            endDate: endDate || null,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] rounded-[32px] border-slate-200/60 dark:border-white/10 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white">
                        {phase ? 'Chỉnh sửa giai đoạn' : 'Tạo giai đoạn mới'}
                    </DialogTitle>
                    <DialogDescription className="text-slate-500">
                        {phase ? 'Cập nhật thông tin chi tiết cho giai đoạn này.' : 'Thêm một giai đoạn mới vào lộ trình dự án của bạn.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-slate-400">Tên giai đoạn</Label>
                        <Input
                            id="name"
                            placeholder="VD: Nghiên cứu & Thiết kế"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="rounded-2xl h-12 bg-slate-50 dark:bg-white/5 border-slate-200/60 dark:border-white/10 focus:ring-brand-primary/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest text-slate-400">Mô tả</Label>
                        <Textarea
                            id="description"
                            placeholder="Mô tả mục tiêu của giai đoạn này..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="rounded-2xl min-h-[100px] bg-slate-50 dark:bg-white/5 border-slate-200/60 dark:border-white/10 focus:ring-brand-primary/20 resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startDate" className="text-xs font-black uppercase tracking-widest text-slate-400">Ngày bắt đầu</Label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="rounded-2xl h-12 bg-slate-50 dark:bg-white/5 border-slate-200/60 dark:border-white/10 pl-11 focus:ring-brand-primary/20"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endDate" className="text-xs font-black uppercase tracking-widest text-slate-400">Ngày kết thúc</Label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="rounded-2xl h-12 bg-slate-50 dark:bg-white/5 border-slate-200/60 dark:border-white/10 pl-11 focus:ring-brand-primary/20"
                                />
                            </div>
                        </div>
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
                            className="rounded-2xl h-12 px-8 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold shadow-lg shadow-brand-primary/20"
                        >
                            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {phase ? 'Lưu thay đổi' : 'Tạo giai đoạn'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
