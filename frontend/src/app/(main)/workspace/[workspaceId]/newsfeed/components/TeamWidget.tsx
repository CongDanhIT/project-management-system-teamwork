'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { workspaceService } from '@/services/workspace.service';
import { Users, Plus } from 'lucide-react';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { useWorkspaceRole } from '@/hooks/useWorkspaceRole';
import { cn } from '@/lib/utils';

export function TeamWidget() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const { isAdminOrOwner } = useWorkspaceRole();

  const { data: membersData, isLoading } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => workspaceService.getMembers(workspaceId),
    enabled: !!workspaceId,
  });

  return (
    <section className="pb-4">
      <div className="p-6 rounded-[32px] bg-white dark:bg-surface-secondary shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)] dark:shadow-none transition-all duration-500 overflow-visible">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[16px] font-black text-slate-800 dark:text-[#C7F964] tracking-tight flex items-center gap-3 uppercase">
            <Users className="w-5 h-5 text-brand-primary" />
            Đội ngũ
          </h3>
          <span className="text-[10px] font-black text-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10 px-3 py-1 rounded-full uppercase tracking-widest">
            {membersData?.members?.length || 0} Nhân sự
          </span>
        </div>
        
        <div className="grid grid-cols-4 gap-x-4 gap-y-8">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))
          ) : membersData?.members ? (
            membersData.members.slice(0, 8).map((member: any, idx: number) => {
              const completedTasks = member.taskStats?.completedTasks || 0;
              const overdueTasks = member.taskStats?.overdueTasks || 0;
              const totalTasks = member.taskStats?.totalTasks || 0;
              // Đang làm = Tổng - Đã xong - Trễ hạn
              const doingTasks = Math.max(0, totalTasks - completedTasks - overdueTasks);

              return (
                <div key={member._id?.toString() || member.userId?._id?.toString() || `member-${idx}`} className="group relative flex flex-col items-center hover:z-[100]">
                  {/* Realistic Contact Shadow */}
                  <div className="absolute bottom-[-6px] w-8 h-1.5 bg-black/15 dark:bg-black/40 blur-[4px] rounded-[50%] transition-all duration-500 group-hover:scale-110 group-hover:opacity-40" />

                  <div className="relative z-10 hover:-translate-y-2 transition-all duration-500">
                    <UserAvatar
                      user={member}
                      size="sm"
                      showShadow={true}
                      className="w-12 h-12 cursor-pointer bg-white dark:bg-slate-800 border-2 border-white dark:border-slate-800 rounded-full shadow-lg"
                    />
                    
                    {/* Task Stats Badges */}
                    {doingTasks + overdueTasks > 0 && (
                      <div className="absolute -top-1 -right-1 flex flex-col gap-0.5 items-end pointer-events-none">
                        {overdueTasks > 0 && (
                          <div className="px-1 py-0.5 rounded-full bg-red-500 text-[7px] font-black text-white shadow-lg border border-white dark:border-slate-900 animate-pulse">
                            {overdueTasks}
                          </div>
                        )}
                        {doingTasks > 0 && (
                          <div className="px-1 py-0.5 rounded-full bg-[#C7F964] text-[7px] font-black text-[#04100E] shadow-lg border border-white dark:border-slate-900">
                            {doingTasks}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="absolute -top-14 left-1/2 -translate-x-1/2 scale-75 group-hover:scale-100 transition-all duration-500 bg-[#191C1E] dark:bg-[#C7F964] text-white dark:text-[#04100E] p-3 rounded-2xl shadow-2xl shadow-black/20 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none tracking-tight z-[110]">
                    <div className="text-[12px] font-black mb-1">{member.userId?.name || member.name || 'Thành viên'}</div>
                    <div className="flex gap-3 text-[9px] font-bold uppercase tracking-widest opacity-80">
                      <span className="flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-blue-400" />
                        {member.taskStats?.totalTasks || 0} Tổng
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-[#C7F964]" />
                        {doingTasks} Đang làm
                      </span>
                      {overdueTasks > 0 && (
                        <span className="flex items-center gap-1 text-red-400">
                          <div className="w-1 h-1 rounded-full bg-red-500" />
                          {overdueTasks} Trễ hạn
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              );
            })
          ) : (
            <p className="col-span-4 text-center text-[10px] text-slate-400 py-2 uppercase font-black tracking-widest">Chưa có nhân sự</p>
          )}

          {isAdminOrOwner && (
            <div className="flex flex-col items-center justify-start group relative hover:z-[100]">
              <div className="absolute bottom-[-6px] w-8 h-1.5 bg-black/15 dark:bg-black/40 blur-[4px] rounded-[50%] transition-all duration-500 group-hover:scale-110 group-hover:opacity-40" />
              <button className="w-12 h-12 rounded-full border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:border-brand-primary hover:text-brand-primary dark:hover:text-[#C7F964] bg-white dark:bg-slate-800 transition-all duration-500 hover:-translate-y-2 z-10 relative shadow-sm hover:shadow-md">
                <Plus className="w-5 h-5 transition-transform duration-500 group-hover:rotate-90" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
