'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PhaseService } from '@/services/phase.service';
import { AssetService } from '@/services/asset.service';
import { projectService, Project } from '@/services/project.service';
import { 
    Loader2, 
    LayoutGrid, 
    BarChart3, 
    Settings, 
    Layout, 
    Calendar as CalendarIcon,
    Plus,
    FolderPlus,
    FilePlus,
    MoreVertical,
    ChevronRight,
    Clock,
    CheckCircle2,
    Lock,
    Files,
    Layers,
    Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Loader from "@/components/ui/Loader";
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Phase, AssetFolder, ProjectAsset } from '@/types/phase';
import { PhaseModal } from '@/components/project/PhaseModal';
import { AssetFolderModal } from '@/components/project/AssetFolderModal';
import { AIPlannerModal } from '@/components/project/AIPlannerModal';
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from '@/stores/auth.store';
import { 
    Pencil, 
    Trash2, 
    Download,
    ExternalLink,
    AlertCircle
} from 'lucide-react';

export default function ProjectPhasesPage() {
    const params = useParams();
    const workspaceId = params.workspaceId as string;
    const projectId = params.projectId as string;
    const queryClient = useQueryClient();
    
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [folderPath, setFolderPath] = useState<{id: string, name: string}[]>([]);
    
    const { user: currentUser } = useAuthStore();
    const [userRole, setUserRole] = useState<string | null>(null);

    // Modal states
    const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false);
    const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);

    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState<AssetFolder | null>(null);

    const [isAIModalOpen, setIsAIModalOpen] = useState(false);

    const [isUploading, setIsUploading] = useState(false);

    // Fetch Project Data
    useEffect(() => {
        const fetchProject = async () => {
            try {
                const data = await projectService.getProjectById(workspaceId, projectId);
                setProject(data);
                
                // Determine current user's role in the project
                if (data.members && currentUser) {
                    const member = data.members.find(m => m.userId?._id === currentUser.id);
                    if (member) {
                        setUserRole(member.role);
                    }
                }
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
    });

    // Fetch Assets for selected phase and folder
    const { data: assetsData, isLoading: isAssetsLoading } = useQuery({
        queryKey: ['project-assets', projectId, selectedPhaseId, currentFolderId],
        queryFn: () => AssetService.listAssets(projectId, currentFolderId, selectedPhaseId).then(res => res.data),
        enabled: !!projectId,
    });

    // Handlers
    const handlePhaseSelect = (phaseId: string | null) => {
        setSelectedPhaseId(phaseId);
        setCurrentFolderId(null);
        setFolderPath([]);
    };

    const handleFolderClick = (folder: AssetFolder) => {
        setCurrentFolderId(folder._id);
        setFolderPath(prev => [...prev, { id: folder._id, name: folder.name }]);
    };

    const navigateToBreadcrumb = (index: number) => {
        if (index === -1) {
            setCurrentFolderId(null);
            setFolderPath([]);
        } else {
            const newPath = folderPath.slice(0, index + 1);
            setFolderPath(newPath);
            setCurrentFolderId(newPath[index].id);
        }
    };

    const handleAddPhase = () => {
        setSelectedPhase(null);
        setIsPhaseModalOpen(true);
    };

    const handleEditPhase = (e: React.MouseEvent, phase: Phase) => {
        e.stopPropagation();
        setSelectedPhase(phase);
        setIsPhaseModalOpen(true);
    };

    const handleDeletePhase = async (phaseId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa giai đoạn này?')) return;
        try {
            await PhaseService.deletePhase(phaseId);
            toast.success('Đã xóa giai đoạn');
            queryClient.invalidateQueries({ queryKey: ['project-phases', projectId] });
            if (selectedPhaseId === phaseId) handlePhaseSelect(null);
        } catch (error) {
            toast.error('Không thể xóa giai đoạn');
        }
    };

    const handleAddFolder = () => {
        setSelectedFolder(null);
        setIsFolderModalOpen(true);
    };

    const handleEditFolder = (folder: AssetFolder) => {
        setSelectedFolder(folder);
        setIsFolderModalOpen(true);
    };

    const handleDeleteFolder = async (folderId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa thư mục này và tất cả tài liệu bên trong?')) return;
        try {
            await AssetService.deleteFolder(folderId);
            toast.success('Đã xóa thư mục');
            queryClient.invalidateQueries({ queryKey: ['project-assets', projectId, selectedPhaseId, currentFolderId] });
        } catch (error) {
            toast.error('Không thể xóa thư mục');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const toastId = toast.loading(`Đang tải lên ${file.name}...`);

        try {
            // 1. Get Presigned URL
            const { uploadUrl, storageKey, fileUrl } = await AssetService.getUploadUrl(file.name, file.type);

            // 2. Upload to R2
            await AssetService.uploadToR2(uploadUrl, file);

            // 3. Confirm with Backend
            await AssetService.confirmUpload({
                workspaceId,
                projectId,
                phaseId: selectedPhaseId,
                folderId: currentFolderId,
                name: file.name,
                storageKey,
                fileUrl,
                fileSize: file.size,
                fileType: file.type
            });

            toast.success('Tải lên thành công', { id: toastId });
            queryClient.invalidateQueries({ queryKey: ['project-assets', projectId, selectedPhaseId, currentFolderId] });
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error(error.message || 'Lỗi khi tải lên tệp tin', { id: toastId });
        } finally {
            setIsUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    const handleDeleteAsset = async (assetId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) return;
        try {
            await AssetService.deleteAsset(assetId);
            toast.success('Đã xóa tài liệu');
            queryClient.invalidateQueries({ queryKey: ['project-assets', projectId, selectedPhaseId, currentFolderId] });
        } catch (error) {
            toast.error('Không thể xóa tài liệu');
        }
    };

    const isProjectCompleted = project?.status === 'COMPLETED';

    if (loading) return <div className="flex items-center justify-center h-[calc(100vh-200px)]"><Loader size="lg" /></div>;

    if (!project) return <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-slate-500"><p>Không tìm thấy dự án.</p></div>;

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Project Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-brand-primary/5 flex items-center justify-center text-2xl border border-brand-primary/10 shadow-sm">
                        {project.emoji || '🎯'}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                            {project.name}
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
                            {project.description || 'Không có mô tả dự án'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-100/50 dark:bg-slate-800/40 p-1 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-inner overflow-hidden">
                    <Link 
                        href={`/workspace/${workspaceId}/projects/${projectId}/board`}
                        className="px-4 py-1.5 text-slate-500 dark:text-slate-400 hover:text-brand-primary dark:hover:text-brand-secondary transition-all text-xs font-bold uppercase tracking-wider flex items-center rounded-lg hover:bg-white/80 dark:hover:bg-white/5"
                    >
                        <LayoutGrid className="w-3.5 h-3.5 mr-2" />
                        Board
                    </Link>
                    <Link 
                        href={`/workspace/${workspaceId}/projects/${projectId}/table`}
                        className="px-4 py-1.5 text-slate-500 dark:text-slate-400 hover:text-brand-primary dark:hover:text-brand-secondary transition-all text-xs font-bold uppercase tracking-wider flex items-center rounded-lg hover:bg-white/80 dark:hover:bg-white/5"
                    >
                        <Layout className="w-3.5 h-3.5 mr-2" />
                        Table
                    </Link>
                    <div
                        className="px-4 py-1.5 bg-white dark:bg-brand-primary text-brand-primary dark:text-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-glow-combined border border-slate-200/50 dark:border-white/10 transition-all text-xs font-black uppercase tracking-wider flex items-center rounded-lg ring-1 ring-slate-900/5 dark:ring-white/5"
                    >
                        <Layers className="w-3.5 h-3.5 mr-2" />
                        Phases
                    </div>
                    <Link 
                        href={`/workspace/${workspaceId}/projects/${projectId}/analytics`}
                        className="px-4 py-1.5 text-slate-500 dark:text-slate-400 hover:text-brand-primary dark:hover:text-brand-secondary transition-all text-xs font-bold uppercase tracking-wider flex items-center rounded-lg hover:bg-white/80 dark:hover:bg-white/5"
                    >
                        <BarChart3 className="w-3.5 h-3.5 mr-2" />
                        Analytics
                    </Link>
                    <div className="w-px h-6 bg-slate-200/60 dark:bg-white/10 mx-1" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 dark:text-slate-500 hover:text-brand-primary dark:hover:text-brand-secondary transition-colors">
                        <Settings className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 pb-6">
                {/* Left Sidebar: Phase Timeline */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                    <div className="bg-white dark:bg-slate-900/50 rounded-[24px] border border-slate-200/60 dark:border-white/5 flex flex-col overflow-hidden shadow-sm h-full">
                        <div className="p-5 border-b border-slate-200/60 dark:border-white/5 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Clock className="w-4 h-4 text-brand-primary" />
                                Giai đoạn Dự án
                            </h3>
                            <div className="flex items-center gap-1.5">
                                {(userRole === 'OWNER' || userRole === 'ADMIN') && (
                                    <Button 
                                        onClick={() => setIsAIModalOpen(true)}
                                        size="sm" className="rounded-full h-8 px-3 bg-gradient-to-r from-brand-primary to-purple-600 border-none shadow-lg shadow-brand-primary/20 text-white font-bold"
                                    >
                                        <Sparkles className="w-3.5 h-3.5 mr-1" />
                                        AI Plan
                                    </Button>
                                )}
                                <Button 
                                    onClick={handleAddPhase}
                                    size="sm" variant="outline" className="rounded-full h-8 px-3 border-brand-primary/20 hover:bg-brand-primary/5 text-brand-primary"
                                >
                                    <Plus className="w-3.5 h-3.5 mr-1" />
                                    Thêm
                                </Button>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            <button 
                                onClick={() => handlePhaseSelect(null)}
                                className={`w-full text-left p-4 rounded-2xl transition-all border ${!selectedPhaseId ? 'bg-brand-primary/5 border-brand-primary/20 shadow-sm' : 'border-transparent hover:bg-slate-50 dark:hover:bg-white/5'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${!selectedPhaseId ? 'bg-brand-primary text-white border-transparent' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-white/5'}`}>
                                        <Files className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className={`font-bold ${!selectedPhaseId ? 'text-brand-primary' : 'text-slate-700 dark:text-slate-200'}`}>Tài liệu Chung</p>
                                        <p className="text-xs text-slate-500">Toàn bộ tệp tin dự án</p>
                                    </div>
                                </div>
                            </button>

                            <AnimatePresence>
                                {phases.map((phase: Phase, index: number) => (
                                    <motion.button
                                        key={phase._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => handlePhaseSelect(phase._id)}
                                        className={`w-full text-left p-4 rounded-2xl transition-all border group ${selectedPhaseId === phase._id ? 'bg-brand-primary/5 border-brand-primary/20 shadow-sm' : 'border-transparent hover:bg-slate-50 dark:hover:bg-white/5'}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${selectedPhaseId === phase._id ? 'bg-brand-primary text-white border-transparent shadow-lg shadow-brand-primary/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-white/5'}`}>
                                                    <span className="text-sm font-bold">{index + 1}</span>
                                                </div>
                                                <div>
                                                    <p className={`font-bold transition-all ${selectedPhaseId === phase._id ? 'text-brand-primary' : 'text-slate-700 dark:text-slate-200'}`}>
                                                        {phase.name}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        {phase.isLocked && (
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest bg-slate-500/10 text-slate-500 flex items-center gap-1">
                                                                <Lock className="w-2.5 h-2.5" />
                                                                LOCKED
                                                            </span>
                                                        )}
                                                        {phase.startDate && <span className="text-[10px] text-slate-400">{(new Date(phase.startDate)).toLocaleDateString()}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-1">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger onClick={(e) => e.stopPropagation()}>
                                                        <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${selectedPhaseId === phase._id ? 'opacity-100' : ''}`}>
                                                            <MoreVertical className="w-4 h-4 text-slate-400" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-2xl border-slate-200/60 dark:border-white/10 p-1.5 min-w-[160px] shadow-xl">
                                                        <DropdownMenuItem onClick={(e) => handleEditPhase(e, phase)} className="rounded-xl flex items-center gap-2 py-2.5 cursor-pointer">
                                                            <Pencil className="w-4 h-4 text-slate-500" />
                                                            <span className="font-bold text-slate-700 dark:text-slate-200">Chỉnh sửa</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-slate-100 dark:bg-white/5 my-1" />
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeletePhase(phase._id); }} className="rounded-xl flex items-center gap-2 py-2.5 cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                            <span className="font-bold">Xóa giai đoạn</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <ChevronRight className={`w-4 h-4 text-slate-300 transition-all ${selectedPhaseId === phase._id ? 'translate-x-1 text-brand-primary' : 'opacity-0 group-hover:opacity-100'}`} />
                                            </div>
                                        </div>
                                    </motion.button>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Right Content: Files & Resources Hub */}
                <div className="lg:col-span-8 flex flex-col min-h-0">
                    <div className="bg-white dark:bg-slate-900/50 rounded-[32px] border border-slate-200/60 dark:border-white/5 flex-1 flex flex-col overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-none">
                        <div className="p-6 border-b border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-transparent">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                                        <button onClick={() => navigateToBreadcrumb(-1)} className="hover:text-brand-primary transition-colors">Root</button>
                                        {folderPath.map((folder, index) => (
                                            <React.Fragment key={folder.id}>
                                                <ChevronRight className="w-3 h-3" />
                                                <button 
                                                    onClick={() => navigateToBreadcrumb(index)}
                                                    className={`hover:text-brand-primary transition-colors ${index === folderPath.length - 1 ? 'text-slate-900 dark:text-white font-bold' : ''}`}
                                                >
                                                    {folder.name}
                                                </button>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                        {folderPath.length === 0 
                                            ? (!selectedPhaseId ? 'Tài liệu Chung' : phases.find((p: Phase) => p._id === selectedPhaseId)?.name)
                                            : folderPath[folderPath.length - 1].name
                                        }
                                    </h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button 
                                        onClick={handleAddFolder}
                                        variant="outline" className="rounded-xl border-slate-200/60 dark:border-white/10 h-10"
                                    >
                                        <FolderPlus className="w-4 h-4 mr-2" />
                                        Thư mục
                                    </Button>
                                    <div className="relative">
                                        <input 
                                            type="file" 
                                            id="file-upload" 
                                            className="hidden" 
                                            onChange={handleFileUpload}
                                            disabled={isUploading}
                                        />
                                        <Button 
                                            disabled={isUploading}
                                            className="rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white shadow-lg shadow-brand-primary/20 border-none h-10 cursor-pointer"
                                        >
                                            <label htmlFor="file-upload" className="flex items-center cursor-pointer">
                                                {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FilePlus className="w-4 h-4 mr-2" />}
                                                Tải lên
                                            </label>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {isAssetsLoading ? (
                                <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-primary/20" /></div>
                            ) : assetsData && (assetsData.folders.length > 0 || assetsData.files.length > 0) ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {/* List Folders */}
                                    {assetsData.folders.map((folder: AssetFolder) => (
                                        <div 
                                            key={folder._id} 
                                            onClick={() => handleFolderClick(folder)}
                                            className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-white/5 hover:border-brand-primary/30 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                    <svg className="w-7 h-7 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M10 4L12 6H20C21.1 6 22 6.9 22 8V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4H10Z" />
                                                    </svg>
                                                </div>
                                                
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger onClick={(e) => e.stopPropagation()}>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <MoreVertical className="w-4 h-4 text-slate-400" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-2xl border-slate-200/60 dark:border-white/10 p-1.5 min-w-[160px] shadow-xl">
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditFolder(folder); }} className="rounded-xl flex items-center gap-2 py-2.5 cursor-pointer">
                                                            <Pencil className="w-4 h-4 text-slate-500" />
                                                            <span className="font-bold text-slate-700 dark:text-slate-200">Đổi tên</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-slate-100 dark:bg-white/5 my-1" />
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder._id); }} className="rounded-xl flex items-center gap-2 py-2.5 cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                            <span className="font-bold">Xóa thư mục</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                            <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">{folder.name}</h4>
                                            <p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-widest">Thư mục</p>
                                        </div>
                                    ))}

                                    {/* List Files */}
                                    {assetsData.files.map((file: ProjectAsset) => (
                                        <div key={file._id} className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-white/5 hover:border-brand-primary/30 transition-all group shadow-sm hover:shadow-md">
                                            <div className="flex items-start justify-between">
                                                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                    <Files className="w-6 h-6 text-blue-500" />
                                                </div>
                                                
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <MoreVertical className="w-4 h-4 text-slate-400" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-2xl border-slate-200/60 dark:border-white/10 p-1.5 min-w-[180px] shadow-xl">
                                                        <DropdownMenuItem className="rounded-xl flex items-center gap-2 py-2.5 cursor-pointer p-0">
                                                            <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 w-full h-full px-1.5">
                                                                <Download className="w-4 h-4 text-slate-500" />
                                                                <span className="font-bold text-slate-700 dark:text-slate-200">Tải xuống</span>
                                                            </a>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDeleteAsset(file._id)} className="rounded-xl flex items-center gap-2 py-2.5 cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                            <span className="font-bold">Xóa tệp tin</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                            <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">{file.name}</h4>
                                            <div className="flex items-center justify-between mt-2">
                                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{file.fileType.split('/')[1]?.toUpperCase() || 'FILE'}</p>
                                                <p className="text-[10px] text-slate-500 font-bold">{(file.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-96 text-center">
                                    <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                                        <Files className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Thư mục này còn trống</h3>
                                    <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">
                                        Bắt đầu bằng việc tải lên các tệp tin quan trọng hoặc tạo thư mục để tổ chức công việc.
                                    </p>
                                    <div className="mt-8 flex gap-3">
                                        <Button 
                                            onClick={handleAddFolder}
                                            variant="outline" className="rounded-full px-6"
                                        >
                                            Tạo Thư mục
                                        </Button>
                                        <Button className="rounded-full px-6 bg-brand-primary cursor-pointer">
                                            <label htmlFor="file-upload" className="cursor-pointer">Tải lên ngay</label>
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <PhaseModal 
                isOpen={isPhaseModalOpen}
                onClose={() => setIsPhaseModalOpen(false)}
                phase={selectedPhase}
                projectId={projectId}
                workspaceId={workspaceId}
            />

            <AssetFolderModal 
                isOpen={isFolderModalOpen}
                onClose={() => setIsFolderModalOpen(false)}
                folder={selectedFolder}
                projectId={projectId}
                workspaceId={workspaceId}
                phaseId={selectedPhaseId}
                parentFolderId={currentFolderId}
            />

            <AIPlannerModal 
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                projectId={projectId}
                workspaceId={workspaceId}
                projectName={project.name}
            />
        </div>
    );
}
