'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
    Sparkles, 
    Loader2, 
    Check, 
    RotateCcw, 
    ArrowRight,
    ListTodo,
    Layers,
    AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    generateAiProjectPlan, 
    applyAiProjectPlan, 
    AiProjectStructure 
} from '@/services/ai.service';

interface AIPlannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    workspaceId: string;
    projectName: string;
}

export function AIPlannerModal({ isOpen, onClose, projectId, workspaceId, projectName }: AIPlannerModalProps) {
    const queryClient = useQueryClient();
    const [prompt, setPrompt] = useState(`Hãy lập kế hoạch chi tiết cho dự án "${projectName}" bao gồm các giai đoạn (Phases) và các công việc cụ thể (Tasks).`);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isApplying, setIsApplying] = useState(false);
    const [structure, setStructure] = useState<AiProjectStructure | null>(null);

    // Cập nhật prompt khi projectName thay đổi (ví dụ khi load xong dữ liệu)
    React.useEffect(() => {
        if (projectName && projectName !== 'undefined') {
            setPrompt(`Hãy lập kế hoạch chi tiết cho dự án "${projectName}" bao gồm các giai đoạn (Phases) và các công việc cụ thể (Tasks).`);
        }
    }, [projectName]);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            toast.error('Vui lòng nhập yêu cầu cho AI');
            return;
        }

        setIsGenerating(true);
        try {
            const result = await generateAiProjectPlan(workspaceId, projectId, prompt);
            setStructure(result);
            toast.success('AI đã hoàn thành bản phác thảo kế hoạch!');
        } catch (error: any) {
            console.error('AI Generate Error:', error);
            toast.error(error.message || 'AI gặp sự cố khi lập kế hoạch. Vui lòng thử lại.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleApply = async () => {
        if (!structure) return;

        setIsApplying(true);
        const toastId = toast.loading('Đang khởi tạo các giai đoạn và công việc...');
        try {
            await applyAiProjectPlan(workspaceId, projectId, structure);
            toast.success('Kế hoạch đã được áp dụng thành công!', { id: toastId });
            queryClient.invalidateQueries({ queryKey: ['project-phases', projectId] });
            queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
            onClose();
        } catch (error: any) {
            console.error('AI Apply Error:', error);
            toast.error('Không thể lưu kế hoạch. Vui lòng thử lại.', { id: toastId });
        } finally {
            setIsApplying(false);
        }
    };

    const resetModal = () => {
        setStructure(null);
        setPrompt(`Hãy lập kế hoạch chi tiết cho dự án "${projectName}" bao gồm các giai đoạn (Phases) và các công việc cụ thể (Tasks).`);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                if (isGenerating || isApplying) return;
                onClose();
            }
        }}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-[32px] border-slate-200/60 dark:border-white/10 shadow-2xl bg-white dark:bg-slate-900">
                <DialogHeader className="p-8 pb-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-primary to-purple-600 flex items-center justify-center shadow-lg shadow-brand-primary/20">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                AI Smart Decomposition
                            </DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium">
                                Phân rã dự án thông minh bằng Groq LPU (Llama 3.3)
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-8 py-4 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {!structure ? (
                            <motion.div 
                                key="input"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-6"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                            <AlertCircle className="w-3 h-3" />
                                            Yêu cầu của bạn
                                        </label>
                                        <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">Mẫu gợi ý</span>
                                    </div>

                                    {/* Prompt Suggestions */}
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {[
                                            { 
                                                label: 'Khung chuẩn', 
                                                icon: ListTodo,
                                                color: 'text-blue-500',
                                                bg: 'bg-blue-500/10',
                                                template: `Hãy lập kế hoạch chi tiết cho dự án: ${projectName}.\n\n1. Mục tiêu cốt lõi: [Mục tiêu].\n2. Các giai đoạn mong muốn: [Ví dụ: Chuẩn bị, Thực hiện, Bàn giao].\n3. Yêu cầu chi tiết: Mỗi giai đoạn cần tối thiểu 4 công việc cụ thể.`
                                            },
                                            { 
                                                label: 'Phần mềm', 
                                                icon: Layers,
                                                color: 'text-emerald-500',
                                                bg: 'bg-emerald-500/10',
                                                template: `Lập kế hoạch xây dựng ứng dụng ${projectName}. Chia thành: Thiết kế UI/UX, Phát triển Backend, Phát triển Frontend và Kiểm thử (QA). Mỗi giai đoạn cần ít nhất 5 task chi tiết về các tính năng lõi.`
                                            },
                                            { 
                                                label: 'Marketing', 
                                                icon: Sparkles,
                                                color: 'text-purple-500',
                                                bg: 'bg-purple-500/10',
                                                template: `Lộ trình chiến dịch Marketing ra mắt ${projectName}. Tập trung: Nghiên cứu thị trường, Thiết kế bộ nhận diện, Chạy quảng cáo đa kênh và Thuê KOLs. Chia nhỏ các task theo từng tuần thực hiện.`
                                            }
                                        ].map((item, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setPrompt(item.template)}
                                                className={cn(
                                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border border-transparent hover:border-current",
                                                    item.bg, item.color
                                                )}
                                            >
                                                <item.icon className="w-3 h-3" />
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>

                                    <Textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="Mô tả mục tiêu dự án, quy trình hoặc các yêu cầu đặc thù để AI lập kế hoạch chính xác nhất..."
                                        className="min-h-[160px] rounded-3xl bg-slate-50 dark:bg-white/5 border-slate-200/60 dark:border-white/10 p-5 text-slate-700 dark:text-slate-200 focus:ring-brand-primary/20 resize-none leading-relaxed"
                                    />
                                    <p className="text-xs text-slate-400 italic">
                                        💡 Mẹo: Chọn một mẫu gợi ý phía trên để bắt đầu nhanh hơn.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                    <div className="p-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                                            <Layers className="w-3.5 h-3.5 text-blue-500" />
                                            Phases & Milestones
                                        </h4>
                                        <p className="text-[11px] text-slate-500 leading-normal">
                                            Tự động chia nhỏ dự án thành các giai đoạn logic.
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                                            <ListTodo className="w-3.5 h-3.5 text-emerald-500" />
                                            Smart Tasks
                                        </h4>
                                        <p className="text-[11px] text-slate-500 leading-normal">
                                            Gợi ý các công việc cụ thể kèm mức độ ưu tiên.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="preview"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-6 pb-4"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-500" />
                                        Bản phác thảo kế hoạch
                                    </h3>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={resetModal}
                                        className="text-xs font-bold text-brand-primary hover:bg-brand-primary/5 rounded-xl h-8"
                                    >
                                        <RotateCcw className="w-3 h-3 mr-1.5" />
                                        Làm lại
                                    </Button>
                                </div>

                                <div className="space-y-6">
                                    {structure.phases.map((phase, idx) => (
                                        <div key={idx} className="relative pl-6 border-l-2 border-slate-100 dark:border-white/5 pb-2">
                                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-brand-primary shadow-sm flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                                            </div>
                                            <div className="mb-4">
                                                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                    {phase.name}
                                                    <span className="text-[10px] bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-full text-slate-500 font-bold uppercase">
                                                        {phase.tasks.length} tasks
                                                    </span>
                                                </h4>
                                                <p className="text-xs text-slate-500 mt-1">{phase.description}</p>
                                            </div>
                                            <div className="grid grid-cols-1 gap-2">
                                                {phase.tasks.map((task, tIdx) => (
                                                    <div key={tIdx} className="p-3 rounded-xl bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-between group hover:border-brand-primary/30 transition-all">
                                                        <div className="flex-1">
                                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{task.title}</p>
                                                            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{task.description}</p>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${
                                                                task.priority === 'HIGH' ? 'bg-red-100 text-red-600' : 
                                                                task.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-600' : 
                                                                'bg-blue-100 text-blue-600'
                                                            }`}>
                                                                {task.priority}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-bold w-12 text-right">
                                                                {task.estimatedHours}h
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="p-8 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-200/60 dark:border-white/5">
                    {!structure ? (
                        <Button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="w-full h-14 rounded-2xl bg-brand-primary hover:bg-brand-primary/90 text-white font-black uppercase tracking-[0.1em] shadow-xl shadow-brand-primary/20 text-sm group"
                        >
                            {isGenerating ? (
                                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                            ) : (
                                <Sparkles className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                            )}
                            {isGenerating ? 'Đang phân rã dự án...' : 'Bắt đầu lập kế hoạch'}
                        </Button>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                disabled={isApplying}
                                className="h-14 rounded-2xl flex-1 font-bold text-slate-600 dark:text-slate-300"
                            >
                                Hủy bỏ
                            </Button>
                            <Button
                                onClick={handleApply}
                                disabled={isApplying}
                                className="h-14 rounded-2xl flex-[2] bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-[0.1em] shadow-xl shadow-emerald-500/20 text-sm group"
                            >
                                {isApplying ? (
                                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                ) : (
                                    <ArrowRight className="w-5 h-5 mr-3 group-hover:translate-x-1 transition-transform" />
                                )}
                                {isApplying ? 'Đang khởi tạo...' : 'Áp dụng kế hoạch này'}
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
