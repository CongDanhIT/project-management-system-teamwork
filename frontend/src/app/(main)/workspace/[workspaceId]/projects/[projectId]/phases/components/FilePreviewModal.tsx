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
    ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface FilePreviewModalProps {
    file: ProjectAsset | null;
    isOpen: boolean;
    onClose: () => void;
    onDelete?: (fileId: string) => void;
}

export function FilePreviewModal({ file, isOpen, onClose, onDelete }: FilePreviewModalProps) {
    if (!file) return null;

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
        const downloadUrl = `${apiBase}/upload/download?key=${encodeURIComponent(file.storageKey)}`;
        window.open(downloadUrl, '_blank');
    };

    const isImage = file.fileType.startsWith('image/');

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                <DialogHeader className="p-6 pb-0 text-left">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900">
                            {getFileIcon(file.fileType)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <DialogTitle className="text-xl font-bold truncate">
                                {file.name}
                            </DialogTitle>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                {file.fileType}
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    {/* Visual Preview for Images */}
                    {isImage && (
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 group">
                            <img 
                                src={file.fileUrl} 
                                alt={file.name}
                                className="w-full h-full object-contain"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </div>
                    )}

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg border border-zinc-100 dark:border-zinc-900 space-y-1">
                            <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                                <Database className="w-3 h-3" />
                                Kích thước
                            </div>
                            <div className="text-sm font-semibold">
                                {formatSize(file.fileSize)}
                            </div>
                        </div>
                        <div className="p-3 rounded-lg border border-zinc-100 dark:border-zinc-900 space-y-1">
                            <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                                <Calendar className="w-3 h-3" />
                                Ngày tải lên
                            </div>
                            <div className="text-sm font-semibold">
                                {format(new Date(file.createdAt), 'dd MMM yyyy', { locale: vi })}
                            </div>
                        </div>
                        <div className="p-3 rounded-lg border border-zinc-100 dark:border-zinc-900 space-y-1">
                            <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                                <HardDrive className="w-3 h-3" />
                                Lưu trữ
                            </div>
                            <div className="text-sm font-semibold flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-green-500" />
                                {file.storageProvider}
                            </div>
                        </div>
                        <div className="p-3 rounded-lg border border-zinc-100 dark:border-zinc-900 space-y-1">
                            <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                                <User className="w-3 h-3" />
                                Trạng thái
                            </div>
                            <div className="text-sm font-semibold">
                                <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px]",
                                    file.status === 'APPROVED' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                    file.status === 'PENDING' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                )}>
                                    {file.status}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-2">
                        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                            <ExternalLink className="w-3 h-3" />
                            File ID: <span className="font-mono text-[10px]">{file._id}</span>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 pt-0 flex flex-row items-center gap-2">
                    {onDelete && (
                        <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                            onClick={() => {
                                onDelete(file._id);
                                onClose();
                            }}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Xóa file
                        </Button>
                    )}
                    <div className="flex-1" />
                    <Button variant="outline" size="sm" onClick={onClose}>
                        Đóng
                    </Button>
                    <Button size="sm" className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100" onClick={handleDownload}>
                        <Download className="w-4 h-4 mr-2" />
                        Tải xuống
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
