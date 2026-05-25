'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

import { PhaseService } from '@/services/phase.service';
import { AssetService } from '@/services/asset.service';
import { projectService, Project } from '@/services/project.service';
import { 
    Plus,
    ChevronRight,
    Clock,
    CheckCircle2,
    Layers,
    LayoutGrid,
    Layout,
    BarChart3,
    ArrowRight,
    Calendar,
    Users,
    Paperclip,
    Files,
    FolderPlus,
    FilePlus,
    MoreVertical,
    Search,
    Filter,
    Lock,
    Unlock,
    Trash2,
    Edit2,
    ArrowLeft,
    Sparkles
} from 'lucide-react';
import { PhaseModal } from '@/components/project/PhaseModal';
import { AIPlannerModal } from '@/components/project/AIPlannerModal';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { Input } from '@/components/ui/input';
import { useRole } from '@/hooks/useRole';

import { Button, buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import Loader from "@/components/ui/Loader";
import { toast } from 'sonner';
import { Phase, AssetFolder, ProjectAsset } from '@/types/phase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { cn } from '@/lib/utils';
import { AssetDetailModal } from '@/components/project/AssetDetailModal';
import { AssetFolderModal } from '@/components/project/AssetFolderModal';

export default function ProjectPhasesHub() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const workspaceId = params.workspaceId as string;
    const projectId = params.projectId as string;
    
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'phases' | 'files'>('phases');
    const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [editingFolder, setEditingFolder] = useState<AssetFolder | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [modalPhase, setModalPhase] = useState<Phase | null>(null);
    const [phaseToDelete, setPhaseToDelete] = useState<Phase | null>(null);
    const [selectedFile, setSelectedFile] = useState<ProjectAsset | null>(null);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [renamingFile, setRenamingFile] = useState<ProjectAsset | null>(null);
    const { isPrivileged } = useRole();


    // Fetch Project Data
    useEffect(() => {
        const fetchProject = async () => {
            try {
                const data = await projectService.getProjectById(workspaceId, projectId);
                setProject(data);
                // Invalidate projects list query to update lastAccessedAt and sorting
                queryClient.invalidateQueries({ queryKey: ['workspace-projects', workspaceId] });
            } catch (error) {
                console.error('Fetch project error:', error);
                toast.error('Không thể tải thông tin dự án');
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [workspaceId, projectId]);

    // Fetch Phases
    const { data: phases = [], isLoading: isPhasesLoading } = useQuery({
        queryKey: ['project-phases', projectId],
        queryFn: () => PhaseService.getPhases(projectId).then(res => res.data),
        enabled: !!projectId,
        select: (data: Phase[]) => [...data].sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
    });

    // Toggle Phase Lock Mutation
    const toggleLockMutation = useMutation({
        mutationFn: ({ phaseId, isLocked }: { phaseId: string, isLocked: boolean }) => 
            PhaseService.updatePhase(phaseId, { isLocked }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-phases', projectId] });
            toast.success('Đã cập nhật trạng thái giai đoạn');
        },
        onError: () => {
            toast.error('Không thể cập nhật trạng thái');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (phaseId: string) => PhaseService.deletePhase(phaseId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-phases', projectId] });
            queryClient.invalidateQueries({ queryKey: ['workspace-projects', workspaceId] }); // To update task count
            toast.success('Đã chuyển giai đoạn vào thùng rác');
            setPhaseToDelete(null);
        },
        onError: () => {
            toast.error('Không thể xóa giai đoạn');
        }
    });


    // Fetch Assets (only if Files tab is active)
    const { data: assetsData, isLoading: isAssetsLoading } = useQuery({
        queryKey: ['project-assets', projectId, selectedPhaseId, selectedFolderId],
        queryFn: () => AssetService.listAssets(projectId, selectedFolderId, selectedPhaseId).then(res => res.data),
        enabled: !!projectId && activeTab === 'files',
    });

    // Create Folder Mutation (Đã chuyển sang AssetFolderModal quản lý)

    // Handle File Upload
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const loadingToast = toast.loading(`Đang tải lên ${file.name}...`);

            // 1. Get presigned URL
            const { uploadUrl, storageKey, fileUrl } = await AssetService.getUploadUrl(file.name, file.type);

            // 2. Upload to R2
            await AssetService.uploadToR2(uploadUrl, file);

            // 3. Confirm upload
            await AssetService.confirmUpload({
                workspaceId,
                projectId,
                phaseId: selectedPhaseId,
                folderId: selectedFolderId,
                name: file.name,
                storageKey,
                fileUrl,
                fileSize: file.size,
                fileType: file.type
            });

            toast.dismiss(loadingToast);
            toast.success(`Đã tải lên ${file.name} thành công`);
            queryClient.invalidateQueries({ queryKey: ['project-assets', projectId, selectedPhaseId, selectedFolderId] });
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error(`Lỗi khi tải lên: ${error.message || 'Vui lòng thử lại'}`);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Delete Asset Mutation
    const deleteAssetMutation = useMutation({
        mutationFn: (assetId: string) => AssetService.deleteAsset(assetId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-assets', projectId, selectedPhaseId, selectedFolderId] });
            toast.success('Đã xóa tài liệu');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Không thể xóa tài liệu');
        }
    });

    // Rename Asset Mutation
    const renameAssetMutation = useMutation({
        mutationFn: ({ assetId, name }: { assetId: string, name: string }) => AssetService.updateAsset(assetId, { name }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-assets', projectId, selectedPhaseId, selectedFolderId] });
            toast.success('Đã đổi tên tài liệu');
            setRenamingFile(null);
        },
        onError: (error: any) => {
            toast.error(error.message || 'Không thể đổi tên tài liệu');
        }
    });

    if (loading || isPhasesLoading) return <div className="flex items-center justify-center h-[calc(100vh-200px)]"><Loader size="lg" /></div>;
    if (!project) return <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-slate-500"><p>Không tìm thấy dự án.</p></div>;

    return (
        <div className="space-y-8 pb-12">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-brand-primary font-bold text-sm uppercase tracking-widest">
                        <Layers className="w-4 h-4" />
                        Trung tâm dự án
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        {project.name}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
                        {project.description || 'Quản lý lộ trình và tài nguyên của dự án chuyên nghiệp.'}
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-inner">
                        <button
                            onClick={() => setActiveTab('phases')}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                activeTab === 'phases' 
                                ? "bg-white dark:bg-slate-800 text-brand-primary shadow-sm" 
                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            Lộ trình
                        </button>
                        <button
                            onClick={() => setActiveTab('files')}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                activeTab === 'files' 
                                ? "bg-white dark:bg-slate-800 text-brand-primary shadow-sm" 
                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            Tài liệu
                        </button>
                    </div>
                    
                    {activeTab === 'phases' ? (
                        isPrivileged && (
                            <div className="flex items-center gap-2">
                                <Button 
                                    onClick={() => setIsAIModalOpen(true)}
                                    className="rounded-2xl h-12 px-6 bg-gradient-to-r from-brand-primary to-purple-600 hover:from-brand-primary/90 hover:to-purple-600/90 text-white shadow-xl shadow-brand-primary/20 border-none font-bold"
                                >
                                    <Sparkles className="w-5 h-5 mr-2" />
                                    AI Plan
                                </Button>
                                <Button 
                                    onClick={() => {
                                        setModalPhase(null);
                                        setIsModalOpen(true);
                                    }}
                                    className="rounded-2xl h-12 px-6 bg-brand-primary hover:bg-brand-primary/90 text-white shadow-xl shadow-brand-primary/20 border-none font-bold"
                                >
                                    <Plus className="w-5 h-5 mr-2" />
                                    Giai đoạn mới
                                </Button>
                            </div>
                        )
                    ) : (
                        <div className="flex items-center gap-2">
                            <input 
                                type="file" 
                                className="hidden" 
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                            />
                            <Button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="rounded-2xl h-12 px-6 bg-brand-primary hover:bg-brand-primary/90 text-white shadow-xl shadow-brand-primary/20 border-none font-bold"
                            >
                                <FilePlus className="w-5 h-5 mr-2" />
                                {isUploading ? 'Đang tải...' : 'Tải tài liệu'}
                            </Button>
                        </div>
                    )}

                </div>
            </div>

            {/* Main Content View */}
            <AnimatePresence mode="wait">
                {activeTab === 'phases' ? (
                    <motion.div
                        key="phases-view"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {phases.map((phase: Phase, index: number) => (
                            <motion.div
                                key={phase._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="group relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-2xl -z-10 rounded-[32px]" />
                                <div className="bg-white dark:bg-slate-900/50 rounded-[32px] border border-slate-200/60 dark:border-white/5 p-6 shadow-sm hover:shadow-2xl hover:border-brand-primary/30 transition-all duration-500 overflow-hidden">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className={cn(
                                            "w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-500",
                                            !phase.isLocked 
                                            ? 'bg-brand-primary text-white border-brand-primary/20 shadow-lg shadow-brand-primary/20' 
                                            : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-transparent'
                                        )}>
                                            {phase.isLocked ? <Lock className="w-7 h-7" /> : <Unlock className="w-7 h-7" />}
                                        </div>
                                        <div className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5",
                                            phase.isLocked ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                                        )}>
                                            {phase.isLocked ? (
                                                <>
                                                    <Lock className="w-3 h-3 text-amber-500" />
                                                    <span className="text-amber-500">Đã khóa</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Unlock className="w-3 h-3 text-emerald-500" />
                                                    <span className="text-emerald-500">Đang mở</span>
                                                </>
                                            )}
                                        </div>
                                        {isPrivileged && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 rounded-full")}>
                                                    <MoreVertical className="w-4 h-4 text-slate-400" />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-2xl p-2 border-slate-200/60 dark:border-white/10 shadow-2xl">
                                                    <DropdownMenuItem 
                                                        onClick={() => toggleLockMutation.mutate({ phaseId: phase._id, isLocked: !phase.isLocked })}
                                                        className="rounded-xl font-bold cursor-pointer"
                                                    >
                                                        {phase.isLocked ? <Unlock className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                                                        {phase.isLocked ? 'Mở khóa giai đoạn' : 'Khóa giai đoạn'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        onClick={() => {
                                                            setModalPhase(phase);
                                                            setIsModalOpen(true);
                                                        }}
                                                        className="rounded-xl font-bold cursor-pointer"
                                                    >
                                                        <Edit2 className="w-4 h-4 mr-2" />
                                                        Chỉnh sửa thông tin
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem 
                                                        onClick={() => {
                                                            setPhaseToDelete(phase);
                                                        }}
                                                        className="rounded-xl font-bold cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Xóa giai đoạn
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>


                                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 group-hover:text-brand-primary transition-colors">
                                        {phase.name}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-6 min-h-[40px]">
                                        {phase.description || 'Không có mô tả cho giai đoạn này.'}
                                    </p>

                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Calendar className="w-3.5 h-3.5 text-brand-primary" />
                                            <span>Bắt đầu: {phase.startDate ? new Date(phase.startDate).toLocaleDateString('vi-VN') : 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Paperclip className="w-3.5 h-3.5 text-brand-primary" />
                                            <span>Tài liệu: {(phase as any).assetsCount || 0}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-2">
                                        <button 
                                            onClick={() => {
                                                if (phase.isLocked && !isPrivileged) {
                                                    toast.error('Giai đoạn này đã bị khóa.');
                                                    return;
                                                }
                                                router.push(`/workspace/${workspaceId}/projects/${projectId}/phases/${phase._id}/board`);
                                            }}
                                            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-brand-primary hover:text-white transition-all group/action"
                                        >
                                            <LayoutGrid className="w-5 h-5 mb-1 group-hover/action:scale-110 transition-transform" />
                                            <span className="text-[10px] font-black uppercase">Board</span>
                                        </button>
                                        <button 
                                            onClick={() => {
                                                if (phase.isLocked && !isPrivileged) {
                                                    toast.error('Giai đoạn này đã bị khóa.');
                                                    return;
                                                }
                                                router.push(`/workspace/${workspaceId}/projects/${projectId}/phases/${phase._id}/table`);
                                            }}
                                            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-brand-primary hover:text-white transition-all group/action"
                                        >
                                            <Layout className="w-5 h-5 mb-1 group-hover/action:scale-110 transition-transform" />
                                            <span className="text-[10px] font-black uppercase">Table</span>
                                        </button>
                                        <button 
                                            onClick={() => {
                                                if (phase.isLocked && !isPrivileged) {
                                                    toast.error('Giai đoạn này đã bị khóa.');
                                                    return;
                                                }
                                                router.push(`/workspace/${workspaceId}/projects/${projectId}/phases/${phase._id}/calendar`);
                                            }}
                                            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-brand-primary hover:text-white transition-all group/action"
                                        >
                                            <Calendar className="w-5 h-5 mb-1 group-hover/action:scale-110 transition-transform" />
                                            <span className="text-[10px] font-black uppercase">Calendar</span>
                                        </button>
                                        <button 
                                            onClick={() => {
                                                if (phase.isLocked && !isPrivileged) {
                                                    toast.error('Giai đoạn này đã bị khóa.');
                                                    return;
                                                }
                                                router.push(`/workspace/${workspaceId}/projects/${projectId}/phases/${phase._id}/analytics`);
                                            }}
                                            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-brand-primary hover:text-white transition-all group/action"
                                        >
                                            <BarChart3 className="w-5 h-5 mb-1 group-hover/action:scale-110 transition-transform" />
                                            <span className="text-[10px] font-black uppercase">Stats</span>
                                        </button>
                                    </div>



                                    <Button 
                                        onClick={() => {
                                            if (phase.isLocked && !isPrivileged) {
                                                toast.error('Giai đoạn này đã bị khóa. Chỉ Quản trị viên mới có quyền truy cập và chỉnh sửa.');
                                                return;
                                            }
                                            router.push(`/workspace/${workspaceId}/projects/${projectId}/phases/${phase._id}/board`);
                                        }}
                                        className={cn(
                                            "w-full mt-4 rounded-2xl h-12 transition-all font-bold group/btn",
                                            phase.isLocked && !isPrivileged 
                                            ? "bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed" 
                                            : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-brand-primary dark:hover:bg-brand-primary hover:text-white"
                                        )}
                                    >
                                        {phase.isLocked && !isPrivileged ? 'Đã bị khóa' : 'Vào làm việc'}
                                        <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                                    </Button>

                                </div>
                            </motion.div>
                        ))}
                        
                        {phases.length === 0 && (
                            <div className="lg:col-span-3 flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-white/5 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-white/10">
                                <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-3xl flex items-center justify-center shadow-xl mb-6">
                                    <Layers className="w-10 h-10 text-brand-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Chưa có giai đoạn nào</h3>
                                <p className="text-slate-500 mb-8 max-w-sm text-center">Hãy chia nhỏ dự án thành các giai đoạn để quản lý tiến độ hiệu quả hơn.</p>
                                <Button 
                                    onClick={() => {
                                        setModalPhase(null);
                                        setIsModalOpen(true);
                                    }}
                                    className="rounded-2xl h-12 px-8 bg-brand-primary font-bold shadow-lg shadow-brand-primary/20"
                                >
                                    Tạo Giai đoạn đầu tiên
                                </Button>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="files-view"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex flex-col lg:flex-row gap-8 h-full"
                    >
                        {/* Phase Selector Sidebar */}
                        <div className="w-full lg:w-72 flex flex-col gap-4">
                            <div className="bg-white dark:bg-slate-900/50 rounded-[32px] border border-slate-200/60 dark:border-white/5 overflow-hidden shadow-sm flex flex-col h-full">
                                <div className="p-5 border-b border-slate-200/60 dark:border-white/5">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Filter className="w-3 h-3" />
                                        Lọc theo giai đoạn
                                    </h3>
                                </div>
                                <div className="p-3 space-y-1.5 overflow-y-auto max-h-[500px]">
                                    <button
                                        onClick={() => {
                                            setSelectedPhaseId(null);
                                            setSelectedFolderId(null);
                                        }}
                                        className={cn(
                                            "w-full text-left p-4 rounded-2xl transition-all flex items-center gap-3 group",
                                            !selectedPhaseId ? "bg-brand-primary/5 text-brand-primary font-bold" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                                            !selectedPhaseId ? "bg-brand-primary text-white" : "bg-slate-100 dark:bg-white/5"
                                        )}>
                                            <Files className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm">Tài liệu chung</span>
                                    </button>
                                    
                                    {phases.map((phase: Phase, idx: number) => (
                                        <button
                                            key={phase._id}
                                            onClick={() => {
                                                setSelectedPhaseId(phase._id);
                                                setSelectedFolderId(null);
                                            }}
                                            className={cn(
                                                "w-full text-left p-4 rounded-2xl transition-all flex items-center gap-3 group",
                                                selectedPhaseId === phase._id ? "bg-brand-primary/5 text-brand-primary font-bold" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                                                selectedPhaseId === phase._id ? "bg-brand-primary text-white" : "bg-slate-100 dark:bg-white/5"
                                            )}>
                                                <span className="text-xs font-black">{idx + 1}</span>
                                            </div>
                                            <span className="text-sm truncate">{phase.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Files Explorer Content */}
                        <div className="flex-1 space-y-6">
                            <div className="bg-white dark:bg-slate-900/50 rounded-[32px] border border-slate-200/60 dark:border-white/5 p-6 shadow-sm min-h-[500px] flex flex-col">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="relative w-full max-w-md">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input 
                                            type="text" 
                                            placeholder="Tìm kiếm tài liệu..." 
                                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {selectedFolderId && (
                                            <Button 
                                                variant="ghost" 
                                                className="rounded-xl h-10 text-slate-500"
                                                onClick={() => setSelectedFolderId(null)}
                                            >
                                                <ArrowLeft className="w-4 h-4 mr-2" />
                                                Quay lại
                                            </Button>
                                        )}
                                        <Button 
                                            variant="outline" 
                                            className="rounded-xl border-slate-200/60 h-10"
                                            onClick={() => {
                                                setEditingFolder(null);
                                                setIsFolderModalOpen(true);
                                            }}
                                        >
                                            <FolderPlus className="w-4 h-4 mr-2" />
                                            Thư mục
                                        </Button>
                                    </div>
                                </div>

                                {isAssetsLoading ? (
                                    <div className="flex-1 flex items-center justify-center"><Loader size="md" /></div>
                                ) : assetsData && (assetsData.folders.length > 0 || assetsData.files.length > 0) ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {assetsData.folders.map((folder: AssetFolder) => (
                                            <div 
                                                key={folder._id} 
                                                onClick={() => setSelectedFolderId(folder._id)}
                                                className="p-5 bg-slate-50/50 dark:bg-white/5 rounded-2xl border border-slate-200/60 dark:border-white/5 hover:border-brand-primary/30 transition-all cursor-pointer group shadow-sm"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                        <svg className="w-7 h-7 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M10 4L12 6H20C21.1 6 22 6.9 22 8V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4H10Z" />
                                                        </svg>
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger 
                                                            onClick={(e) => e.stopPropagation()}
                                                            render={
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100">
                                                                    <MoreVertical className="w-4 h-4 text-slate-400" />
                                                                </Button>
                                                            }
                                                        />
                                                        <DropdownMenuContent align="end" className="rounded-2xl p-2 border-none shadow-xl bg-white dark:bg-slate-900">
                                                            <DropdownMenuItem 
                                                                className="rounded-xl font-bold cursor-pointer"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingFolder(folder);
                                                                    setIsFolderModalOpen(true);
                                                                }}
                                                            >
                                                                <Edit2 className="w-4 h-4 mr-2" />
                                                                Đổi tên thư mục
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem 
                                                                className="rounded-xl text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-500/10 font-bold cursor-pointer"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteAssetMutation.mutate(folder._id);
                                                                }}
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                Xóa thư mục
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                                <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">{folder.name}</h4>
                                                <p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-widest">Thư mục</p>
                                            </div>
                                        ))}
                                        {assetsData.files.map((file: ProjectAsset) => {
                                            const isImage = file.fileType.startsWith('image/');
                                            return (
                                                <div 
                                                    key={file._id} 
                                                    onClick={() => setSelectedFile(file)}
                                                    className="p-5 bg-slate-50/50 dark:bg-white/5 rounded-2xl border border-slate-200/60 dark:border-white/5 hover:border-brand-primary/30 transition-all group shadow-sm cursor-pointer"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        {isImage ? (
                                                            <div className="w-12 h-12 rounded-xl overflow-hidden mb-3 group-hover:scale-110 transition-transform border border-slate-200/40 dark:border-white/5 bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative">
                                                                <img 
                                                                    src={file.fileUrl} 
                                                                    alt={file.name} 
                                                                    className="w-full h-full object-cover" 
                                                                    loading="lazy"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                                <Files className="w-6 h-6 text-blue-500" />
                                                            </div>
                                                        )}
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger 
                                                                onClick={(e) => e.stopPropagation()}
                                                                render={
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100">
                                                                        <MoreVertical className="w-4 h-4 text-slate-400" />
                                                                    </Button>
                                                                }
                                                            />
                                                            <DropdownMenuContent align="end" className="rounded-2xl p-2 border-none shadow-xl bg-white dark:bg-slate-900">
                                                                <DropdownMenuItem 
                                                                    className="rounded-xl font-bold cursor-pointer"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setRenamingFile(file);
                                                                    }}
                                                                >
                                                                    <Edit2 className="w-4 h-4 mr-2" />
                                                                    Đổi tên tài liệu
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem 
                                                                    className="rounded-xl font-bold cursor-pointer"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedFile(file);
                                                                    }}
                                                                >
                                                                    <ArrowRight className="w-4 h-4 mr-2" />
                                                                    Xem chi tiết
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem 
                                                                    className="rounded-xl text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-500/10 font-bold cursor-pointer"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        deleteAssetMutation.mutate(file._id);
                                                                    }}
                                                                >
                                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                                    Xóa tài liệu
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                    <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">{file.name}</h4>
                                                    <div className="flex items-center justify-between mt-2 gap-2">
                                                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest truncate flex-1" title={file.fileType}>
                                                            {file.fileType.includes('spreadsheetml') ? 'XLSX' : 
                                                             file.fileType.includes('wordprocessingml') ? 'DOCX' : 
                                                             file.fileType.includes('presentationml') ? 'PPTX' :
                                                             file.fileType.split('/').pop()?.split('.').pop() || 'FILE'}
                                                        </p>
                                                        <p className="text-[10px] text-slate-500 font-bold whitespace-nowrap">{(file.fileSize / 1024).toFixed(2)} KB</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                                        <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                                            <Files className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Không có tài liệu nào</h3>
                                        <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">
                                            Kéo thả tệp tin hoặc nhấn "Tải tài liệu" để bắt đầu lưu trữ tài nguyên cho dự án.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AIPlannerModal 
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                projectId={projectId}
                workspaceId={workspaceId}
                projectName={project?.name || 'Dự án'}
            />

            <PhaseModal 
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setModalPhase(null);
                }}
                phase={modalPhase}
                projectId={projectId}
                workspaceId={workspaceId}
            />

            <Dialog open={!!phaseToDelete} onOpenChange={(v: boolean) => !v && setPhaseToDelete(null)}>
                <DialogContent className="rounded-[32px] p-10 max-w-lg border-none shadow-depth-3 bg-white dark:bg-slate-900">
                    <DialogHeader className="text-center space-y-4">
                        <div className="w-20 h-20 bg-amber-100 dark:bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
                            <Trash2 className="w-10 h-10 text-amber-600 dark:text-amber-500" />
                        </div>
                        <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">DI CHUYỂN VÀO THÙNG RÁC</DialogTitle>
                    </DialogHeader>
                    <div className="text-center">
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                            Giai đoạn <span className="text-slate-900 dark:text-white font-bold">"{phaseToDelete?.name}"</span> sẽ được chuyển vào thùng rác.
                            Các công việc bên trong cũng sẽ tạm thời bị ẩn đi.
                        </p>
                    </div>
                    <DialogFooter className="-mx-10 -mb-10 mt-10 p-8 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-white/5 rounded-b-[32px] flex-row gap-4">
                        <Button
                            variant="ghost"
                            className="rounded-full h-12 font-bold flex-1 text-slate-500 hover:bg-slate-100 transition-colors"
                            onClick={() => setPhaseToDelete(null)}
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            className="bg-amber-500 hover:bg-amber-600 text-white rounded-full h-12 font-bold flex-1 shadow-lg shadow-amber-100/20 dark:shadow-none transition-all"
                            onClick={() => phaseToDelete && deleteMutation.mutate(phaseToDelete._id)}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? 'Đang chuyển...' : 'Xác nhận chuyển'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create & Edit Folder Modal */}
            <AssetFolderModal 
                isOpen={isFolderModalOpen}
                onClose={() => {
                    setIsFolderModalOpen(false);
                    setEditingFolder(null);
                }}
                folder={editingFolder}
                projectId={projectId}
                workspaceId={workspaceId}
                phaseId={selectedPhaseId}
                parentFolderId={selectedFolderId}
            />
            {/* File Preview Modal */}
            {/* File Detail Modal */}
            <AssetDetailModal 
                asset={selectedFile}
                isOpen={!!selectedFile}
                onClose={() => setSelectedFile(null)}
                onDelete={(id) => deleteAssetMutation.mutate(id)}
                onRename={(id, newName) => {
                    if (selectedFile && selectedFile._id === id) {
                        setSelectedFile({
                            ...selectedFile,
                            name: newName
                        });
                    }
                }}
            />

            {/* Rename File Modal */}
            <Dialog open={!!renamingFile} onOpenChange={(v) => !v && setRenamingFile(null)}>
                <DialogContent className="sm:max-w-[425px] rounded-[32px] p-8 border-none bg-white dark:bg-slate-900 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <Edit2 className="w-6 h-6" />
                            </div>
                            Đổi tên tài liệu
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                                Tên tài liệu
                            </label>
                            <Input 
                                defaultValue={renamingFile?.name}
                                placeholder="Nhập tên tài liệu mới..."
                                className="h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 focus:ring-brand-primary/20"
                                autoFocus
                                id="rename-file-input"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const val = (e.target as HTMLInputElement).value.trim();
                                        if (val && renamingFile) {
                                            renameAssetMutation.mutate({ assetId: renamingFile._id, name: val });
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-3 sm:gap-0">
                        <Button 
                            variant="ghost" 
                            onClick={() => setRenamingFile(null)}
                            className="rounded-2xl h-12 px-6 font-bold text-slate-500"
                        >
                            Hủy
                        </Button>
                        <Button 
                            onClick={() => {
                                const val = (document.getElementById('rename-file-input') as HTMLInputElement)?.value.trim();
                                if (val && renamingFile) {
                                    renameAssetMutation.mutate({ assetId: renamingFile._id, name: val });
                                }
                            }}
                            disabled={renameAssetMutation.isPending}
                            className="rounded-2xl h-12 px-8 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold shadow-lg shadow-brand-primary/20"
                        >
                            {renameAssetMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
