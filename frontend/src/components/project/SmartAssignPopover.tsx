'use client';

import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScanSearch, UserPlus, Star, Loader2, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '@/services/task.service';
import { Task } from '@/types/task';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SmartAssignPopoverProps {
  task: Task;
  workspaceId: string;
  projectId: string;
}

export const SmartAssignPopover: React.FC<SmartAssignPopoverProps> = ({ task, workspaceId, projectId }) => {
  const [open, setOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['smart-assign', workspaceId, projectId, task._id],
    queryFn: () => taskService.getSmartAssign(workspaceId, projectId, task._id),
    enabled: open,
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });

  const assignMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      // Merge current assigned with new ones if we want, or replace. The plan said "phân công", so replace is good.
      // Wait, we need an array of string IDs.
      const assignedToIds = userIds; 
      return taskService.updateTask(workspaceId, projectId, task._id, {
        assignedTo: assignedToIds as any
      });
    },
    onSuccess: () => {
      toast.success('Đã phân công thành công');
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks'] });
      setOpen(false);
    },
    onError: () => {
      toast.error('Phân công thất bại');
    }
  });

  const toggleUser = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleAssign = () => {
    if (selectedUserIds.length === 0) return;
    assignMutation.mutate(selectedUserIds);
  };

  return (
    <Popover open={open} onOpenChange={(val) => {
      setOpen(val);
      if (val) {
        // Pre-fill selected users from current task
        setSelectedUserIds(task.assignedTo?.map(u => typeof u === 'string' ? u : u._id) || []);
      }
    }}>
      <PopoverTrigger 
        className={cn(
          "w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-lg shadow-brand-primary/30",
          "hover:scale-110 transition-transform active:scale-95",
          open ? "ring-2 ring-brand-primary ring-offset-2" : ""
        )}
        title="Smart Scanner"
      >
        <ScanSearch className="w-4 h-4 animate-pulse" />
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-2xl overflow-hidden border-none shadow-depth-3" side="right" align="start">
        <div className="bg-gradient-to-r from-brand-primary/10 to-brand-primary/5 p-4 border-b border-brand-primary/10">
          <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <ScanSearch className="w-4 h-4 text-brand-primary" />
            AI Smart Scanner
          </h4>
          <p className="text-[11px] text-slate-500 mt-1">Đề xuất thành viên phù hợp nhất dựa trên kỹ năng và khối lượng công việc hiện tại.</p>
        </div>

        <div className="p-3 max-h-[300px] overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
              <p className="text-[10px] text-slate-400 font-medium tracking-wide animate-pulse">Đang phân tích...</p>
            </div>
          ) : data?.suggestions && data.suggestions.length > 0 ? (
            <div className="space-y-2">
              {data.suggestions.map((item: any, idx: number) => {
                const isSelected = selectedUserIds.includes(item.userId);
                // Top 2 được làm nổi bật (nếu score cao), còn lại làm mờ (dimmed)
                const isTop = idx < 2 && item.score > 0;
                
                return (
                  <div 
                    key={item.userId}
                    onClick={() => toggleUser(item.userId)}
                    className={cn(
                      "flex items-start gap-3 p-2 rounded-xl cursor-pointer transition-all border border-transparent",
                      isSelected ? "bg-brand-primary/5 border-brand-primary/20" : "hover:bg-slate-50",
                      !isTop && !isSelected ? "opacity-60 grayscale-[50%]" : ""
                    )}
                  >
                    <div className="relative">
                      <Avatar className="w-10 h-10 border shadow-sm">
                        <AvatarImage src={item.profilePicture} />
                        <AvatarFallback className="text-xs">{item.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {isSelected && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-brand-primary text-white rounded-full flex items-center justify-center border-2 border-white">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-700 truncate">{item.name}</p>
                        <span className="text-[10px] font-black text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-brand-primary" />
                          {Math.round(item.score)}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                        {item.matchReasons?.join(" • ")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
             <div className="text-center py-6 text-[11px] text-slate-500">
                Không tìm thấy thành viên phù hợp.
             </div>
          )}
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
          <Button 
            className="w-full rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white font-bold h-9 text-xs"
            onClick={handleAssign}
            disabled={selectedUserIds.length === 0 || assignMutation.isPending}
          >
            {assignMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <>
                <UserPlus className="w-4 h-4 mr-1.5" />
                Phân công ngay
              </>
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
