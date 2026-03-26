'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar as CalendarIcon, 
  User, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Save 
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from '../shared/StatusBadge';
import { PriorityBadge } from '../shared/PriorityBadge';
import { useQueryClient } from '@tanstack/react-query';
import { taskService } from '@/services/task.service';
import { toast } from 'sonner';

interface SubtaskEditModalProps {
  subtask: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void; // Refresh parent
  members: any[];
}

export const SubtaskEditModal: React.FC<SubtaskEditModalProps> = ({
  subtask,
  isOpen,
  onClose,
  onUpdate,
  members,
}) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODO);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [estimatedHours, setEstimatedHours] = useState<number>(0);
  const [loggedHours, setLoggedHours] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (subtask) {
      setTitle(subtask.title);
      setDescription(subtask.description || '');
      setStatus(subtask.status);
      setPriority(subtask.priority);
      setEstimatedHours(subtask.estimatedHours || 0);
      setLoggedHours(subtask.loggedHours || 0);
      
      const id = typeof subtask.assignedTo === 'object' ? subtask.assignedTo?._id : subtask.assignedTo;
      setAssigneeId(id || 'unassigned');
    }
  }, [subtask]);

  const handleSave = async () => {
    if (!subtask) return;
    setIsUpdating(true);
    const projId = typeof subtask.projectId === 'object' ? subtask.projectId?._id : subtask.projectId;
    if (!projId) {
      toast.error("Không tìm thấy ID dự án");
      setIsUpdating(false);
      return;
    }

    try {
      await taskService.updateTask(subtask.workspaceId, projId, subtask._id, {
        title,
        description,
        status,
        priority,
        assignedTo: (assigneeId === 'unassigned' ? null : assigneeId) as any,
        estimatedHours,
        loggedHours,
        dueDate: null, // Clear due date for subtasks as requested
      });

      queryClient.invalidateQueries({ queryKey: ['workspace-tasks-list', subtask.workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks', subtask.workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', subtask.workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics', subtask.workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-projects', subtask.workspaceId] });

      toast.success("Đã cập nhật nhiệm vụ con");
      onUpdate();
      onClose();
    } catch (error) {
      toast.error("Lỗi khi cập nhật");
    } finally {
      setIsUpdating(false);
    }
  };

  const activeAssignee = members.find(m => {
    const mUserId = m.userId?._id || (typeof m.userId === 'string' ? m.userId : null);
    return mUserId === assigneeId;
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-[24px] border-none shadow-2xl">
        <ScrollArea className="max-h-[85vh]">
          <div className="p-8 space-y-8 bg-white/80 backdrop-blur-md">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-mono font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded">
                   {subtask?.taskCode}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nhiệm vụ con</span>
              </div>
              <DialogTitle>
                 <Input 
                   value={title} 
                   onChange={(e) => setTitle(e.target.value)}
                   className="text-xl font-bold border-none p-0 focus-visible:ring-0 shadow-none bg-transparent h-auto max-w-full placeholder:text-slate-300"
                 />
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col gap-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                  <CheckCircle2 className="w-3 h-3" /> Trạng thái
                </label>
                <Select value={status} onValueChange={(val) => setStatus(val as TaskStatus)}>
                  <SelectTrigger className="border-none bg-transparent hover:bg-white/50 transition-colors p-0 h-auto shadow-none focus:ring-0">
                     <StatusBadge status={status} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TaskStatus.TODO}>Cần làm</SelectItem>
                    <SelectItem value={TaskStatus.IN_PROGRESS}>Đang làm</SelectItem>
                    <SelectItem value={TaskStatus.INREVIEW}>Đang duyệt</SelectItem>
                    <SelectItem value={TaskStatus.DONE}>Hoàn thành</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col gap-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                  <AlertCircle className="w-3 h-3" /> Ưu tiên
                </label>
                <Select value={priority} onValueChange={(val) => setPriority(val as TaskPriority)}>
                  <SelectTrigger className="border-none bg-transparent hover:bg-white/50 transition-colors p-0 h-auto shadow-none focus:ring-0">
                     <PriorityBadge priority={priority} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TaskPriority.LOW}>Thấp</SelectItem>
                    <SelectItem value={TaskPriority.MEDIUM}>Trung bình</SelectItem>
                    <SelectItem value={TaskPriority.HIGH}>Cao</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col gap-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                  <User className="w-3 h-3" /> Assignee
                </label>
                <Select value={assigneeId} onValueChange={(val) => setAssigneeId(val || 'unassigned')}>
                  <SelectTrigger className="border-none bg-transparent hover:bg-white/50 p-0 h-auto shadow-none focus:ring-0">
                    <div className="flex items-center gap-2">
                       {activeAssignee ? (
                         <div className="flex items-center gap-2">
                            <Avatar className="w-5 h-5">
                               <AvatarImage src={activeAssignee.userId?.profilePicture} />
                               <AvatarFallback className="text-[8px]">{activeAssignee.userId?.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-bold text-slate-700">{activeAssignee.userId?.name}</span>
                         </div>
                       ) : <span className="text-xs text-slate-400">Chưa gán</span>}
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="unassigned">Bỏ gán</SelectItem>
                     {members.map(m => (
                       <SelectItem key={m.userId?._id} value={m.userId?._id}>
                          <div className="flex items-center gap-2 text-xs">
                             <Avatar className="w-4 h-4">
                                <AvatarImage src={m.userId?.profilePicture} />
                                <AvatarFallback>{m.userId?.name?.[0]}</AvatarFallback>
                             </Avatar>
                             {m.userId?.name}
                          </div>
                       </SelectItem>
                     ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col gap-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                  <Clock className="w-3 h-3" /> Ước tính (Giờ)
                </label>
                <Input 
                   type="number"
                   value={estimatedHours}
                   step="any"
                   onChange={(e) => setEstimatedHours(Number(e.target.value))}
                   className="h-8 border-none bg-transparent hover:bg-white/50 p-0 shadow-none focus-visible:ring-0 text-xs font-bold"
                />
              </div>

              <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col gap-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                  <Clock className="w-3 h-3" /> Đã làm (Giờ)
                </label>
                <Input 
                   type="number"
                   value={loggedHours}
                   step="any"
                   onChange={(e) => setLoggedHours(Number(e.target.value))}
                   className="h-8 border-none bg-transparent hover:bg-white/50 p-0 shadow-none focus-visible:ring-0 text-xs font-bold"
                />
              </div>
            </div>

            <div className="space-y-3">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Mô tả</label>
               <Textarea 
                 value={description}
                 onChange={(e) => setDescription(e.target.value)}
                 className="min-h-[120px] bg-white border-slate-200/60 rounded-xl py-4"
                 placeholder="Thêm mô tả nhỏ..."
               />
            </div>

            <div className="flex items-center gap-3">
               <Button 
                onClick={handleSave} 
                disabled={isUpdating}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 rounded-xl shadow-lg transition-all active:scale-95"
               >
                 {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                 Lưu Thay Đổi
               </Button>
               <Button 
                variant="outline" 
                onClick={async () => {
                  if (!subtask) return;
                  if (!window.confirm("Bạn có chắc chắn muốn xóa nhiệm vụ con này?")) return;
                  setIsUpdating(true);
                  try {
                    const projId = typeof subtask.projectId === 'object' ? subtask.projectId?._id : subtask.projectId;
                    await taskService.deleteTask(subtask.workspaceId, projId || '', subtask._id);

                    queryClient.invalidateQueries({ queryKey: ['workspace-tasks-list', subtask.workspaceId] });
                    queryClient.invalidateQueries({ queryKey: ['project-tasks', subtask.workspaceId] });
                    queryClient.invalidateQueries({ queryKey: ['workspace-tasks', subtask.workspaceId] });
                    queryClient.invalidateQueries({ queryKey: ['workspace-analytics', subtask.workspaceId] });
                    queryClient.invalidateQueries({ queryKey: ['workspace-projects', subtask.workspaceId] });

                    toast.success("Đã xóa nhiệm vụ con");
                    onUpdate();
                    onClose();
                  } catch (error) {
                    toast.error("Lỗi khi xóa nhiệm vụ con");
                  } finally {
                    setIsUpdating(false);
                  }
                }}
                disabled={isUpdating}
                className="h-11 px-4 rounded-xl border-red-200 text-red-500 hover:bg-red-50 font-bold"
               >
                 <Trash2 className="w-4 h-4" />
               </Button>
               <Button 
                variant="outline" 
                onClick={onClose}
                className="h-11 px-6 rounded-xl border-slate-200 text-slate-600 font-bold"
               >
                 Hủy
               </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
