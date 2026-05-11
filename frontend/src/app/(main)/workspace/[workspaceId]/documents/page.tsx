"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getWorkspaceExplorer } from "@/services/explorer.service";
import { 
  Files, 
  Folder, 
  File, 
  Search, 
  LayoutGrid, 
  List as ListIcon, 
  MoreVertical, 
  Download, 
  Share2, 
  Trash2, 
  Clock,
  HardDrive,
  Filter,
  ChevronRight,
  FolderOpen,
  FileText,
  Image as ImageIcon,
  FileCode,
  FileArchive,
  Star,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import Loader from "@/components/ui/Loader";
import { cn } from "@/lib/utils";

const getFileIcon = (fileType: string) => {
  if (fileType.includes("image")) return <ImageIcon className="w-4 h-4 text-pink-500" />;
  if (fileType.includes("pdf") || fileType.includes("document")) return <FileText className="w-4 h-4 text-blue-500" />;
  if (fileType.includes("zip") || fileType.includes("archive")) return <FileArchive className="w-4 h-4 text-amber-500" />;
  if (fileType.includes("code") || fileType.includes("javascript") || fileType.includes("typescript")) return <FileCode className="w-4 h-4 text-emerald-500" />;
  return <File className="w-4 h-4 text-muted-foreground/40" />;
};

const formatSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export default function DocumentsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const workspaceId = params.workspaceId as string;
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedProjectId, setSelectedProjectId] = useState<string | "all">(searchParams.get("projectId") || "all");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(searchParams.get("folderId") || null);

  useEffect(() => {
    const projectId = searchParams.get("projectId");
    const folderId = searchParams.get("folderId");
    if (projectId) setSelectedProjectId(projectId);
    if (folderId) setSelectedFolderId(folderId);
  }, [searchParams]);

  const updateFilters = (projectId: string | "all", folderId: string | null = null) => {
    setSelectedProjectId(projectId);
    setSelectedFolderId(folderId);
    
    const params = new URLSearchParams();
    if (projectId !== "all") params.set("projectId", projectId);
    if (folderId) params.set("folderId", folderId);
    
    const query = params.toString();
    const newPath = query 
      ? `/workspace/${workspaceId}/documents?${query}`
      : `/workspace/${workspaceId}/documents`;
    window.history.pushState(null, "", newPath);
  };
  
  const handleDownload = (e: React.MouseEvent, fileUrl: string, fileName: string) => {
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenFile = (fileUrl: string) => {
    window.open(fileUrl, "_blank");
  };

  const handleFolderClick = (folder: any) => {
    updateFilters(folder.projectId, folder._id);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["workspace-explorer", workspaceId],
    queryFn: () => getWorkspaceExplorer(workspaceId),
  });

  const { projects = [], folders = [], assets = [] } = data || {};

  const filteredAssets = useMemo(() => {
    return assets.filter((asset: any) => {
      const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProject = selectedProjectId === "all" || asset.projectId === selectedProjectId;
      const matchesFolder = !selectedFolderId || asset.folderId?.toString() === selectedFolderId.toString();
      return matchesSearch && matchesProject && matchesFolder;
    });
  }, [assets, searchQuery, selectedProjectId, selectedFolderId]);

  const filteredFolders = useMemo(() => {
    return folders.filter((folder: any) => {
      const matchesSearch = folder.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProject = selectedProjectId === "all" || folder.projectId === selectedProjectId;
      // Nếu đã chọn một folder, chúng ta có thể show subfolders ở đây nếu có parentFolderId
      const matchesParent = !selectedFolderId 
        ? !folder.parentFolderId 
        : folder.parentFolderId?.toString() === selectedFolderId.toString();
      return matchesSearch && matchesProject && matchesParent;
    });
  }, [folders, searchQuery, selectedProjectId, selectedFolderId]);

  const selectedProject = useMemo(() => {
    if (selectedProjectId === "all") return null;
    return projects.find((p: any) => p._id === selectedProjectId);
  }, [projects, selectedProjectId]);

  const selectedFolder = useMemo(() => {
    if (!selectedFolderId) return null;
    return folders.find((f: any) => f._id === selectedFolderId);
  }, [folders, selectedFolderId]);

  if (isLoading) return <div className="h-full flex items-center justify-center"><Loader /></div>;

  return (
    <div className="h-full flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="p-6 border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/5 rounded-2xl border border-primary/10">
              <Files className="w-6 h-6 text-primary" />
            </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-semibold tracking-tight">Thư viện tài liệu</h1>
                  {selectedProject && (
                    <>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                      <span className={cn("text-xl font-semibold", !selectedFolder ? "text-primary" : "text-muted-foreground/50")}>
                        {selectedProject.name}
                      </span>
                    </>
                  )}
                  {selectedFolder && (
                    <>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                      <span className="text-xl font-semibold text-primary">{selectedFolder.name}</span>
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedProject 
                    ? `Đang xem tài liệu trong dự án ${selectedProject.name}`
                    : "Quản lý toàn bộ tài nguyên trong workspace"}
                </p>
              </div>
            </div>

          <div className="flex items-center gap-3">
             <div className="relative w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
               <Input 
                placeholder="Tìm kiếm tài liệu..." 
                className="pl-10 bg-muted/50 border-border focus:border-primary/50 rounded-xl h-10 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
               />
             </div>
             
             <div className="h-8 w-px bg-border mx-2" />

             <div className="flex items-center bg-muted/50 rounded-xl border border-border p-1">
               <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setViewMode("grid")}
                className={cn("h-8 w-8 rounded-lg", viewMode === "grid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground/60")}
               >
                 <LayoutGrid className="w-4 h-4" />
               </Button>
               <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setViewMode("list")}
                className={cn("h-8 w-8 rounded-lg", viewMode === "list" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground/60")}
               >
                 <ListIcon className="w-4 h-4" />
               </Button>
             </div>
          </div>
        </div>

        {/* Filters/Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => updateFilters("all")}
            className={cn(
              "rounded-full px-4 h-8 text-xs font-medium border transition-all",
              selectedProjectId === "all" 
                ? "bg-primary/10 text-primary border-primary/20" 
                : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
            )}
          >
            Tất cả dự án
          </Button>
          {projects.map((project: any) => (
            <Button 
              key={project._id}
              variant="ghost" 
              size="sm"
              onClick={() => updateFilters(project._id)}
              className={cn(
                "rounded-full px-4 h-8 text-xs font-medium border transition-all whitespace-nowrap gap-2",
                selectedProjectId === project._id 
                  ? "bg-primary/10 text-primary border-primary/20" 
                  : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
              )}
            >
              <span>{project.emoji}</span>
              {project.name}
            </Button>
          ))}
        </div>
      </header>
      
      {/* Project Breadcrumb */}
      {(selectedProjectId !== "all" || selectedFolderId) && (
        <div className="px-8 py-3 bg-muted/20 border-b border-border/40 flex items-center gap-2 text-xs font-medium">
          <button 
            onClick={() => updateFilters("all")}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Tất cả dự án
          </button>
          {selectedProject && (
            <>
              <ChevronRight className="w-3 h-3 text-muted-foreground/30" />
              <button 
                onClick={() => updateFilters(selectedProject._id)}
                className={cn("transition-colors", !selectedFolder ? "text-foreground" : "text-muted-foreground hover:text-primary")}
              >
                {selectedProject.name}
              </button>
            </>
          )}
          {selectedFolder && (
            <>
              <ChevronRight className="w-3 h-3 text-muted-foreground/30" />
              <span className="text-foreground font-semibold">{selectedFolder.name}</span>
            </>
          )}
        </div>
      )}

      {/* Main Content */}
      <ScrollArea className="flex-1">
        <div className="p-8">
          {/* Section: Folders */}
          {filteredFolders.length > 0 && (
            <section className="mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
                  {selectedFolderId ? "Thư mục con" : "Thư mục"} ({filteredFolders.length})
                </h2>
                <div className="h-px flex-1 bg-border/50" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredFolders.map((folder: any) => (
                  <motion.div 
                    key={folder._id}
                    whileHover={{ y: -4 }}
                    onClick={() => handleFolderClick(folder)}
                    className="p-4 bg-card border border-border rounded-2xl hover:bg-muted/50 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all group cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-2.5 bg-amber-500/10 rounded-xl group-hover:scale-110 transition-transform">
                        <Folder className="w-5 h-5 text-amber-500 fill-amber-500/20" />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/40 hover:text-foreground">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground">
                           <DropdownMenuItem className="gap-2">
                             <Share2 className="w-4 h-4" /> Chia sẻ
                           </DropdownMenuItem>
                           <DropdownMenuItem className="gap-2 text-rose-500 focus:text-rose-500 focus:bg-rose-500/10">
                             <Trash2 className="w-4 h-4" /> Xóa
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm truncate group-hover:text-primary transition-colors">{folder.name}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] grayscale group-hover:grayscale-0 transition-all">
                          {projects.find((p: any) => p._id === folder.projectId)?.emoji || "📁"}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider">
                          {projects.find((p: any) => p._id === folder.projectId)?.name}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Section: Files */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Tệp tin ({filteredAssets.length})</h2>
              <div className="h-px flex-1 bg-border/50" />
            </div>

            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredAssets.map((asset: any) => (
                  <motion.div 
                    key={asset._id}
                    whileHover={{ y: -4 }}
                    onClick={() => handleOpenFile(asset.fileUrl)}
                    className="flex flex-col bg-card border border-border rounded-2xl hover:bg-muted/50 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all group cursor-pointer"
                  >
                    <div className="aspect-[4/3] bg-muted/30 rounded-t-2xl flex items-center justify-center overflow-hidden relative group-hover:bg-muted/50 transition-colors">
                       {asset.fileType.includes("image") ? (
                         <img src={asset.fileUrl} alt={asset.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                       ) : (
                         <div className="scale-[2] opacity-40">{getFileIcon(asset.fileType)}</div>
                       )}
                       <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            size="icon" 
                            onClick={(e) => handleDownload(e, asset.fileUrl, asset.name)}
                            className="h-8 w-8 bg-background/80 backdrop-blur-md rounded-full shadow-lg text-foreground hover:text-primary transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                       </div>
                    </div>
                    <div className="p-4">
                       <div className="flex items-center gap-2 mb-1">
                         {getFileIcon(asset.fileType)}
                         <div className="flex flex-col min-w-0">
                            <span className="font-bold text-sm truncate group-hover:text-primary transition-colors">{asset.name}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-muted-foreground/40 font-medium">{formatSize(asset.fileSize)}</span>
                              <div className="w-1 h-1 rounded-full bg-border" />
                              <div className="flex items-center gap-1">
                                <span className="text-[10px]">
                                  {projects.find((p: any) => p._id === asset.projectId)?.emoji}
                                </span>
                                <span className="text-[10px] text-primary/60 font-bold uppercase tracking-tight">
                                  {projects.find((p: any) => p._id === asset.projectId)?.name}
                                </span>
                              </div>
                            </div>
                          </div>
                       </div>
                       <div className="flex items-center justify-between">
                         <Badge variant="outline" className="text-[9px] uppercase bg-muted border-none text-muted-foreground/60">
                           {asset.category}
                         </Badge>
                       </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Tên tệp</th>
                      <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Dự án</th>
                      <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Kích thước</th>
                      <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Loại</th>
                      <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssets.map((asset: any) => (
                      <tr 
                        key={asset._id} 
                        onClick={() => handleOpenFile(asset.fileUrl)}
                        className="border-b border-border/50 hover:bg-muted/20 transition-colors group cursor-pointer"
                      >
                        <td className="py-4 px-6">
                           <div className="flex items-center gap-3">
                             {getFileIcon(asset.fileType)}
                             <span className="text-sm font-medium">{asset.name}</span>
                           </div>
                        </td>
                        <td className="py-4 px-6">
                           <span className="text-xs text-muted-foreground">{projects.find((p: any) => p._id === asset.projectId)?.name}</span>
                        </td>
                        <td className="py-4 px-6">
                           <span className="text-xs text-muted-foreground">{formatSize(asset.fileSize)}</span>
                        </td>
                        <td className="py-4 px-6">
                           <Badge variant="outline" className="text-[9px] uppercase bg-muted border-none text-muted-foreground/60">
                             {asset.category}
                           </Badge>
                        </td>
                        <td className="py-4 px-6 text-right">
                           <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               onClick={(e) => handleDownload(e, asset.fileUrl, asset.name)}
                               className="h-8 w-8"
                             >
                               <Download className="w-4 h-4 text-muted-foreground" />
                             </Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8"><Share2 className="w-4 h-4 text-muted-foreground" /></Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4 text-muted-foreground" /></Button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {filteredAssets.length === 0 && (
               <div className="py-32 text-center flex flex-col items-center gap-4 opacity-40">
                 <Files className="w-16 h-16 text-muted-foreground/40" />
                 <div className="space-y-1">
                   <p className="text-lg font-medium">Không tìm thấy tài liệu nào</p>
                   <p className="text-sm text-muted-foreground">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                 </div>
               </div>
            )}
          </section>
        </div>
      </ScrollArea>

      {/* Footer Info */}
      <footer className="h-12 px-8 border-t border-border bg-background flex items-center justify-between text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold">
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2">
             <HardDrive className="w-3 h-3" />
             <span>Tổng dung lượng: {formatSize(assets.reduce((sum: number, a: any) => sum + a.fileSize, 0))}</span>
           </div>
           <div className="flex items-center gap-2">
             <File className="w-3 h-3" />
             <span>{assets.length} Tệp tin</span>
           </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             <span>Tự động đồng bộ hóa với R2 Storage</span>
           </div>
        </div>
      </footer>
    </div>
  );
}
