'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { workspaceService } from '@/services/workspace.service';
import { projectService } from '@/services/project.service';
import { PhaseService } from '@/services/phase.service';
import { CreateTaskModal } from '@/components/task/CreateTaskModal';
import { taskService } from '@/services/task.service';
import { tagService } from '@/services/tag.service';
import { toast } from 'sonner';
import { Users, Loader2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspaceRole } from '@/hooks/useWorkspaceRole';
import { useAuthStore } from '@/stores/auth.store';

interface WorkspaceMemberPanelProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
}

const getInitials = (name: string) => {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 
    'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 
    'bg-orange-500', 'bg-indigo-500'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const WorkspaceMemberPanel: React.FC<WorkspaceMemberPanelProps> = ({ workspaceId, isOpen, onClose }) => {
  const { roleName, isAdminOrOwner } = useWorkspaceRole();
  const { user: currentUser } = useAuthStore();

  // States cho Quick Assign
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isPreModalOpen, setIsPreModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>('');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Queries
  const { data: membersData, isLoading: isMembersLoading } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => workspaceService.getMembers(workspaceId),
    enabled: isOpen && !!workspaceId,
  });

  const { data: projectsData } = useQuery({
    queryKey: ['workspace-projects-all', workspaceId],
    queryFn: () => projectService.getProjectsByWorkspace(workspaceId, 1, 100),
    enabled: isPreModalOpen && !!workspaceId,
  });

  const { data: phasesData, isLoading: isPhasesLoading } = useQuery({
    queryKey: ['project-phases', selectedProjectId],
    queryFn: () => PhaseService.getPhases(selectedProjectId),
    enabled: isPreModalOpen && !!selectedProjectId,
  });

  const { data: memberTags = [], isLoading: isMemberTagsLoading } = useQuery({
    queryKey: ['workspace-member-tags', workspaceId],
    queryFn: () => tagService.getTags(workspaceId, 'MEMBER'),
    enabled: isOpen && !!workspaceId,
  });

  const members = membersData?.members || [];
  const projects = projectsData?.projects || [];
  const phases = phasesData?.data || phasesData?.phases || [];

  useEffect(() => {
    setSelectedPhaseId('');
  }, [selectedProjectId]);

  const handleOpenQuickAssign = (memberId: string) => {
    setSelectedMemberId(memberId);
    setIsPreModalOpen(true);
    setSelectedProjectId('');
    setSelectedPhaseId('');
  };

  const handleContinueToTaskModal = () => {
    if (!selectedProjectId || !selectedPhaseId) {
      toast.error('Vui lòng chọn Dự án và Giai đoạn');
      return;
    }
    setIsPreModalOpen(false);
    setIsTaskModalOpen(true);
  };

  const handleCreateTaskSubmit = async (projectId: string, data: any) => {
    await taskService.createTask(workspaceId, projectId, data);
    toast.success('Giao việc thành công!');
  };

  const selectedProjectObj = projects.find((p: any) => String(p._id) === selectedProjectId);
  const selectedPhaseObj = phases.find((p: any) => String(p._id) === selectedPhaseId);

  if (!isAdminOrOwner) return null;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent 
          side="right" 
          className="w-full sm:max-w-md p-0 bg-white dark:bg-slate-950 border-l border-slate-100 dark:border-white/10 shadow-2xl flex flex-col"
        >
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-brand-primary/10 to-transparent pointer-events-none" />
          
          <SheetHeader className="p-6 pb-4 border-b border-ghost relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <SheetTitle className="text-xl font-black text-slate-800 dark:text-white">Thành viên Workspace</SheetTitle>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Quản lý và giao việc nhanh</p>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-2 space-y-2.5 custom-scrollbar pb-6">
            <h3 className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-wider mb-2 px-1">
              Thành viên ({members.length})
            </h3>
            
            {isMembersLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-brand-primary/50" />
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                Không có thành viên nào
              </div>
            ) : (
              members.map((member: any) => {
                const user = member.userId;
                const mId = user?._id || user?.id;
                // Chỉ người dùng hiện tại (chính mình) mới báo online
                const isOnline = (mId === currentUser?.id || mId === (currentUser as any)?._id);

                return (
                  <div 
                    key={mId}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-transparent shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-all group"
                  >
                    <div className="relative shrink-0">
                      <Avatar className="w-10 h-10 border border-black/[0.04] dark:border-white/[0.04] shadow-sm">
                        <AvatarImage src={user?.profilePicture} className="object-cover" />
                        <AvatarFallback className={cn("text-white text-xs font-black", getAvatarColor(user?.name || ''))}>
                          {getInitials(user?.name || '')}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn(
                        "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 shadow-sm",
                        isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-300 dark:bg-slate-600"
                      )} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-[14px] font-bold text-slate-800 dark:text-white truncate">
                          {user?.name}
                        </h4>
                        <span className={cn(
                          "px-1.5 py-0.5 rounded-[6px] text-[9px] font-black uppercase tracking-widest shrink-0 border",
                          member.role?.name === 'OWNER' 
                            ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400"
                            : member.role?.name === 'ADMIN'
                            ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-400"
                            : "bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                        )}>
                          {member.role?.name || 'MEMBER'}
                        </span>
                      </div>
                      
                      {/* Tag Kỹ năng dưới dạng list */}
                      {member.skillTags && member.skillTags.length > 0 ? (
                        <div className="flex items-center gap-2 mt-1.5 overflow-hidden">
                          {member.skillTags.map((skill: any) => {
                            const color = skill.color || '#64748b';
                            return (
                              <div key={skill._id || skill} className="flex items-center gap-1.5 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[100px]">
                                  {skill.name || skill}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 italic font-medium">
                          Chưa cập nhật kỹ năng
                        </p>
                      )}
                    </div>

                    <Button
                      onClick={() => handleOpenQuickAssign(mId)}
                      variant="outline"
                      className="h-8 px-3 rounded-full border border-transparent bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 hover:text-brand-primary shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] text-[11px] font-bold transition-all shrink-0"
                    >
                      Giao việc
                    </Button>
                  </div>
                );
              })
            )}

            {/* Phần hiển thị danh sách Vai trò & Kỹ năng (chỉ đọc) */}
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-wider mb-4 px-1">
                Kỹ năng chuyên môn
              </h3>
              
              {isMemberTagsLoading ? (
                <div className="flex items-center justify-center h-20">
                  <Loader2 className="w-5 h-5 animate-spin text-brand-primary/50" />
                </div>
              ) : memberTags.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic px-1">
                  Chưa có dữ liệu vai trò / kỹ năng
                </p>
              ) : (
                <div className="space-y-4 px-1">
                  {memberTags.map((tag: any) => {
                    const tagColor = tag.color || '#64748b';
                    return (
                      <div 
                        key={tag._id} 
                        className="relative rounded-3xl p-4 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-white/80 dark:border-white/10 overflow-hidden hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] group"
                        style={{ 
                          backgroundColor: `${tagColor}15`
                        }}
                      >
                        {/* Shine overlay for depth */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/30 to-transparent dark:from-white/10 dark:via-white/5 pointer-events-none shadow-[inset_0_2px_8px_rgba(255,255,255,0.7)] dark:shadow-none" />
                        
                        <div className="relative z-10">
                          <div className="flex items-center gap-2.5 mb-3.5">
                            <span className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor] opacity-80" style={{ backgroundColor: tagColor, color: tagColor }} />
                            <span className="text-[15px] font-bold text-slate-800 dark:text-slate-200 tracking-tight drop-shadow-sm">
                              {tag.name}
                            </span>
                          </div>
                          
                          {tag.taskTags && tag.taskTags.length > 0 ? (
                            <div className="flex flex-wrap gap-2.5">
                              {tag.taskTags.map((subTag: any) => (
                                <span 
                                  key={subTag._id} 
                                  className="px-3 py-1.5 bg-white/90 backdrop-blur-sm dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 rounded-full text-[11px] font-bold border border-white dark:border-white/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex items-center gap-2 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all cursor-default"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full opacity-80" style={{ backgroundColor: tagColor }} />
                                  {subTag.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic">Chưa có công việc chi tiết</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isPreModalOpen} onOpenChange={setIsPreModalOpen}>
        <DialogContent className="sm:max-w-[400px] p-6 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-ghost shadow-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-800 dark:text-white">
              Giao việc nhanh
            </DialogTitle>
            <p className="text-sm text-slate-500 font-medium">
              Vui lòng chọn Dự án và Giai đoạn trước khi đi vào chi tiết.
            </p>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Dự án
              </label>
              <Select value={selectedProjectId} onValueChange={(val) => setSelectedProjectId(val || '')}>
                <SelectTrigger className="h-12 border-ghost bg-slate-50 dark:bg-slate-900 rounded-xl font-bold">
                  {selectedProjectObj ? (
                    <span className="flex items-center gap-2 truncate">
                      {selectedProjectObj.emoji && <span>{selectedProjectObj.emoji}</span>}
                      {selectedProjectObj.name}
                    </span>
                  ) : (
                    <span className="text-slate-500 font-normal">Chọn dự án...</span>
                  )}
                </SelectTrigger>
                <SelectContent className="rounded-xl border-ghost shadow-depth-3">
                  {projects.map((p: any) => (
                    <SelectItem key={p._id} value={String(p._id)} className="font-bold py-2.5">
                      {p.emoji && <span className="mr-2">{p.emoji}</span>}
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProjectId && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                  Giai đoạn (Phase)
                </label>
                <Select value={selectedPhaseId} onValueChange={(val) => setSelectedPhaseId(val || '')}>
                  <SelectTrigger className="h-12 border-ghost bg-slate-50 dark:bg-slate-900 rounded-xl font-bold">
                    {selectedPhaseObj ? (
                      <span className="truncate">{selectedPhaseObj.name}</span>
                    ) : (
                      <span className="text-slate-500 font-normal">{isPhasesLoading ? "Đang tải..." : "Chọn giai đoạn..."}</span>
                    )}
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-ghost shadow-depth-3">
                    {phases.map((p: any) => (
                      <SelectItem key={p._id} value={String(p._id)} className="font-bold py-2.5">
                        {p.name}
                      </SelectItem>
                    ))}
                    {phases.length === 0 && !isPhasesLoading && (
                      <div className="p-3 text-xs text-slate-500 text-center font-medium">
                        Dự án này chưa có giai đoạn nào.
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsPreModalOpen(false)} className="rounded-xl font-bold text-slate-500">
              Hủy
            </Button>
            <Button 
              onClick={handleContinueToTaskModal}
              disabled={!selectedProjectId || !selectedPhaseId}
              className="rounded-xl font-bold bg-brand-primary hover:bg-brand-primary/90 text-white shadow-glow"
            >
              Tiếp tục
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Task Modal */}
      {selectedProjectId && selectedPhaseId && (
        <CreateTaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          projects={projects}
          workspaceId={workspaceId}
          phaseId={selectedPhaseId}
          defaultProjectId={selectedProjectId}
          projectName={selectedProjectObj?.name}
          phaseName={selectedPhaseObj?.name}
          isAdminOrOwner={isAdminOrOwner}
          defaultAssigneeId={selectedMemberId || undefined}
          onSubmit={handleCreateTaskSubmit}
        />
      )}
    </>
  );
};
