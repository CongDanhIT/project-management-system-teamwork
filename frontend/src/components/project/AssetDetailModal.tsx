'use client';

import React from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProjectAsset } from '@/types/phase';
import { 
    FileText, 
    Image as ImageIcon, 
    File as FileIcon, 
    Download, 
    Trash2, 
    Calendar, 
    User, 
    Database,
    HardDrive,
    ExternalLink,
    ShieldCheck,
    Check,
    X,
    Edit2
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/shared/UserAvatar';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AssetService } from '@/services/asset.service';
import { toast } from 'sonner';

interface AssetDetailModalProps {
    asset: ProjectAsset | null;
    isOpen: boolean;
    onClose: () => void;
    onDelete?: (assetId: string) => void;
    onRename?: (assetId: string, newName: string) => void;
}

export function AssetDetailModal({ asset, isOpen, onClose, onDelete, onRename }: AssetDetailModalProps) {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = React.useState(false);
    const [newName, setNewName] = React.useState('');

    React.useEffect(() => {
        if (asset) {
            setNewName(asset.name);
            setIsEditing(false);
        }
    }, [asset]);

    const renameMutation = useMutation({
        mutationFn: async (name: string) => {
            if (!asset) throw new Error('Asset is null');
            return AssetService.updateAsset(asset._id, { name });
        },
        onSuccess: () => {
            if (!asset) return;
            queryClient.invalidateQueries({ queryKey: ['project-assets', asset.projectId] });
            toast.success('Đã đổi tên tài liệu');
            setIsEditing(false);
            if (onRename) {
                onRename(asset._id, newName.trim());
            }
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Không thể đổi tên tài liệu');
        }
    });

    if (!asset) return null;

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return <ImageIcon className="w-12 h-12 text-blue-500" />;
        if (type.includes('pdf')) return <FileText className="w-12 h-12 text-red-500" />;
        return <FileIcon className="w-12 h-12 text-gray-500" />;
    };

    const handleDownload = () => {
        // Construct download URL using backend proxy for R2
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
        const downloadUrl = `${apiBase}/upload/download?key=${encodeURIComponent(asset.storageKey)}`;
        window.open(downloadUrl, '_blank');
    };

    const isImage = asset.fileType.startsWith('image/');

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[620px] p-0 overflow-hidden bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-[32px]">
                <DialogHeader className="p-6 pb-0 text-left">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900">
                            {getFileIcon(asset.fileType)}
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                            {isEditing ? (
                                <div className="flex items-center gap-1.5 mt-1">
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="w-full text-base font-bold bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && newName.trim() && newName.trim() !== asset.name) {
                                                renameMutation.mutate(newName.trim());
                                            } else if (e.key === 'Escape') {
                                                setIsEditing(false);
                                                setNewName(asset.name);
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            if (newName.trim() && newName.trim() !== asset.name) {
                                                renameMutation.mutate(newName.trim());
                                            }
                                        }}
                                        disabled={renameMutation.isPending || !newName.trim() || newName.trim() === asset.name}
                                        className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 cursor-pointer"
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setNewName(asset.name);
                                        }}
                                        className="p-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 group/title">
                                    <DialogTitle className="text-lg font-bold break-all whitespace-pre-wrap leading-tight">
                                        {asset.name}
                                    </DialogTitle>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-all opacity-0 group-hover/title:opacity-100 focus:opacity-100 cursor-pointer"
                                        title="Đổi tên tài liệu"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                            <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 mt-1 truncate" title={asset.fileType}>
                                {asset.fileType.includes('spreadsheetml') ? 'Microsoft Excel (XLSX)' : 
                                 asset.fileType.includes('wordprocessingml') ? 'Microsoft Word (DOCX)' : 
                                 asset.fileType.includes('presentationml') ? 'Microsoft PowerPoint (PPTX)' :
                                 asset.fileType}
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    {/* Visual Preview for Images */}
                    {isImage && (
                        <div className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 group">
                            <img 
                                src={asset.fileUrl} 
                                alt={asset.name}
                                className="w-full h-full object-contain"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </div>
                    )}

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-2xl border border-zinc-100 dark:border-zinc-900 space-y-1">
                            <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                                <Database className="w-3 h-3" />
                                Kích thước
                            </div>
                            <div className="text-sm font-semibold">
                                {formatSize(asset.fileSize)}
                            </div>
                        </div>
                        <div className="p-3 rounded-2xl border border-zinc-100 dark:border-zinc-900 space-y-1">
                            <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                                <Calendar className="w-3 h-3" />
                                Ngày tải lên
                            </div>
                            <div className="text-sm font-semibold">
                                {asset.createdAt ? format(new Date(asset.createdAt), 'dd MMM yyyy', { locale: vi }) : 'N/A'}
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 space-y-3">
                            <div className="flex items-center gap-2 text-zinc-400">
                                <HardDrive className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Lưu trữ</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-widest">{asset.storageProvider || 'R2 Storage'}</span>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 space-y-3">
                            <div className="flex items-center gap-2 text-zinc-400">
                                <ShieldCheck className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Trạng thái</span>
                            </div>
                            <div className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-xl border shadow-sm",
                                asset.status === 'APPROVED' ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20" :
                                asset.status === 'PENDING' ? "bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20" :
                                "bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20"
                            )}>
                                <span className={cn(
                                    "text-xs font-black uppercase tracking-widest",
                                    asset.status === 'APPROVED' ? "text-emerald-600 dark:text-emerald-400" :
                                    asset.status === 'PENDING' ? "text-amber-600 dark:text-amber-400" :
                                    "text-red-600 dark:text-red-400"
                                )}>
                                    {asset.status === 'APPROVED' ? 'Đã duyệt' : asset.status}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-900 mt-4">
                        <div className="flex items-center gap-3">
                            <UserAvatar 
                                user={asset.createdBy && typeof asset.createdBy === 'object' ? asset.createdBy : undefined}
                                name={typeof asset.createdBy === 'string' ? `User ${asset.createdBy.substring(0, 4)}` : asset.createdBy?.name || 'N/A'}
                                size="sm" 
                                className="ring-2 ring-zinc-100 dark:ring-zinc-800"
                            />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Người tải lên</span>
                                <span className="text-sm font-bold text-zinc-900 dark:text-white leading-none">
                                    {asset.createdBy && typeof asset.createdBy === 'object' ? asset.createdBy.name : asset.createdBy ? `ID: ${asset.createdBy.substring(0, 8)}...` : 'N/A'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
                            <ExternalLink className="w-3 h-3 text-zinc-400" />
                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-tight">ID: {asset._id.substring(0, 8)}</span>
                        </div>
                    </div>
                </div>

                <div className="p-6 pt-0 flex items-center justify-between gap-3">
                    {onDelete && (
                        <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl h-10 px-4 font-bold"
                            onClick={() => {
                                onDelete(asset._id);
                                onClose();
                            }}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Xóa file
                        </Button>
                    )}
                    <div className="flex-1" />
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={onClose} 
                            className="rounded-2xl h-10 px-5 font-bold border-zinc-200 dark:border-zinc-800"
                        >
                            Đóng
                        </Button>
                        <Button 
                            size="sm" 
                            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-2xl h-10 px-6 font-bold shadow-lg shadow-zinc-900/10 dark:shadow-none" 
                            onClick={handleDownload}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Tải xuống
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
