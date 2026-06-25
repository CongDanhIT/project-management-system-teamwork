'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { taskService } from '@/services/task.service';
import { Clock, CheckCircle2, CircleDashed } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export function RecentTasksWidget() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;

  const { data, isLoading } = useQuery({
    queryKey: ['workspace-tasks-recent', workspaceId],
    queryFn: () => taskService.getTasksByWorkspace(workspaceId, { limit: 5, sort: 'createdAt', order: 'desc' }),
    enabled: !!workspaceId,
  });

  const tasks = data?.tasks || (Array.isArray(data) ? data : []).slice(0, 5);

  return (
    <section>
      <div className="p-6 rounded-[32px] bg-white dark:bg-surface-secondary shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)] dark:shadow-none transition-all duration-500">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-2xl bg-blue-500/10 dark:bg-blue-500/10">
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <h3 className="text-[16px] font-extrabold text-slate-800 dark:text-white">Mới cập nhật</h3>
        </div>
        
        <div className="space-y-5">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0 mt-1" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                </div>
              </div>
            ))
          ) : tasks.length > 0 ? (
            tasks.map((task: any) => (
                <div key={task._id} className="group relative flex flex-col gap-2.5 p-3.5 -mx-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-all duration-300 border border-transparent hover:border-slate-100 dark:hover:border-white/5 hover:shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5">
                      {task.status === 'COMPLETED' ? (
                        <CheckCircle2 className="w-[18px] h-[18px] text-emerald-500" />
                      ) : (
                        <CircleDashed className="w-[18px] h-[18px] text-slate-300 dark:text-slate-600 group-hover:text-brand-primary transition-colors duration-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-brand-primary transition-colors duration-300" title={task.title || 'Công việc không tên'}>
                        {task.title || 'Công việc không tên'}
                      </p>
                      
                      {/* Context Info */}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {task.projectId && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-brand-primary/[0.04] dark:bg-brand-primary/[0.08] border border-brand-primary/10 dark:border-brand-primary/20 transition-colors">
                            <span className="text-[10px] font-semibold text-brand-primary truncate max-w-[120px]" title={task.projectId.name}>
                              {task.projectId.name}
                            </span>
                          </div>
                        )}
                        {task.phaseId && (
                          <div className="flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                            <span className="text-[10px] text-slate-500 font-medium truncate max-w-[80px]" title={task.phaseId.name}>
                              {task.phaseId.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer Info */}
                  <div className="flex items-center justify-between pl-[30px]">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <p className="text-[10px] font-medium tracking-wide">
                        {task.createdAt ? formatDistanceToNow(new Date(task.createdAt), { addSuffix: true, locale: vi }) : 'Gần đây'}
                      </p>
                    </div>
                    
                    {/* Multi-Assignee Avatars */}
                    {task.assignedTo && task.assignedTo.length > 0 && (
                      <div className="flex -space-x-1.5 shrink-0 hover:z-10 transition-all">
                        {task.assignedTo.slice(0, 3).map((assignee: any) => (
                          <div 
                            key={assignee._id}
                            className="w-5 h-5 rounded-full ring-2 ring-white dark:ring-surface-secondary bg-brand-primary/10 flex items-center justify-center overflow-hidden hover:scale-110 hover:-translate-y-0.5 transition-transform duration-300 shadow-sm"
                            title={assignee.name}
                          >
                            {assignee.profilePicture ? (
                              <img src={assignee.profilePicture} alt={assignee.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[8px] font-black text-brand-primary">{assignee.name?.charAt(0)}</span>
                            )}
                          </div>
                        ))}
                        {task.assignedTo.length > 3 && (
                          <div className="w-5 h-5 rounded-full ring-2 ring-white dark:ring-surface-secondary bg-slate-100 dark:bg-surface-tertiary flex items-center justify-center text-[8px] font-black text-slate-500 shadow-sm hover:scale-110 transition-transform duration-300">
                            +{task.assignedTo.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
            ))
          ) : (
            <p className="text-center text-[12px] text-slate-500 py-2">Chưa có công việc nào</p>
          )}
        </div>
      </div>
    </section>
  );
}
