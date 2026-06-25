'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { workspaceService } from '@/services/workspace.service';
import { BarChart3, CheckCircle, Clock } from 'lucide-react';

export function QuickStatsWidget() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['workspace-analytics', workspaceId],
    queryFn: () => workspaceService.getWorkspaceAnalytics(workspaceId),
    enabled: !!workspaceId,
  });

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-2xl bg-brand-primary/10 dark:bg-brand-primary/10">
          <BarChart3 className="w-5 h-5 text-brand-primary" />
        </div>
        <h3 className="text-[16px] font-extrabold text-slate-800 dark:text-white">Tổng quan</h3>
      </div>
      
      <div className="p-6 rounded-[32px] bg-white dark:bg-surface-secondary shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)] dark:shadow-none transition-all duration-500 overflow-hidden relative">
        {/* Decorative Background */}
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-brand-primary/10 rounded-full blur-2xl pointer-events-none" />
        
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl w-full" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl" />
              <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            </div>
          </div>
        ) : (
          <div className="space-y-5 relative z-10">
            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[12px] font-bold">
                <span className="text-slate-600 dark:text-slate-300">Tiến độ</span>
                <span className="text-brand-primary">{Math.round(analytics?.summary?.completionRate || 0)}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-primary rounded-full transition-all duration-1000 relative"
                  style={{ width: `${analytics?.summary?.completionRate || 0}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]" />
                </div>
              </div>
            </div>

            {/* Stat Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 dark:bg-emerald-500/5 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-500/10 transition-transform hover:scale-105 cursor-default">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Đã xong</span>
                </div>
                <div className="text-2xl font-black text-slate-800 dark:text-white">
                  {analytics?.completedTasks || 0}
                </div>
              </div>
              
              <div className="bg-amber-50 dark:bg-amber-500/5 rounded-2xl p-4 border border-amber-100 dark:border-amber-500/10 transition-transform hover:scale-105 cursor-default">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Đang làm</span>
                </div>
                <div className="text-2xl font-black text-slate-800 dark:text-white">
                  {analytics?.inProgressTasks || 0}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
