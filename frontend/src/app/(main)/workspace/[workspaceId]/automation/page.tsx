'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/services/project.service';
import { Zap, ArrowRight, FolderKanban } from 'lucide-react';
import Loader from '@/components/ui/Loader';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function AutomationIndexPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params?.workspaceId as string;

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['workspace-projects-automation', workspaceId],
    queryFn: () => projectService.getProjectsByWorkspace(workspaceId, 1, 100),
    enabled: !!workspaceId,
  });

  const projects = projectsData?.projects || [];

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-10 px-6">
      <div className="mb-10 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/10">
          <Zap className="h-7 w-7 text-brand-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Tự động hóa</h1>
          <p className="text-slate-500 mt-1">Chọn một dự án để thiết lập các kịch bản tự động hóa (BPA Engine).</p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderKanban className="h-16 w-16 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-700">Chưa có dự án nào</h3>
          <p className="text-slate-500 max-w-sm mt-2">
            Bạn cần tạo ít nhất một dự án trong workspace để có thể thiết lập tính năng tự động hóa.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project: any) => (
            <Card
              key={project._id}
              onClick={() => router.push(`/workspace/${workspaceId}/projects/${project._id}/automation`)}
              className={cn(
                "group relative rounded-[32px] bg-white dark:bg-slate-900/40 backdrop-blur-md flex flex-col p-6 cursor-pointer border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-glow-combined",
                "transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-[0_40px_60px_-10px_rgba(0,68,66,0.08)] dark:hover:shadow-glow-combined"
              )}
            >
              {/* Detached Shadow Element (V6) */}
              <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-16 h-1.5 bg-black/10 dark:bg-black/40 rounded-[50%] blur-[4px] opacity-0 scale-75 transition-all duration-500 group-hover:opacity-100 group-hover:scale-100 pointer-events-none" />

              <div className="flex flex-col h-full relative z-10">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-2xl shadow-sm border-none">
                    {project.emoji || '🎯'}
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50/50 text-slate-400 opacity-0 transition-all group-hover:bg-brand-primary/10 group-hover:text-brand-primary group-hover:opacity-100 dark:bg-white/5 dark:group-hover:bg-brand-secondary/10 dark:group-hover:text-brand-secondary">
                    <ArrowRight className="h-4 w-4 -rotate-45 transition-transform duration-500 group-hover:rotate-0" />
                  </div>
                </div>
                
                <h3 className="mb-2 text-[20px] leading-tight font-black tracking-tight text-slate-900 dark:text-white line-clamp-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {project.name}
                </h3>
                
                <p className="text-[14px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-6 flex-1 font-medium leading-relaxed">
                  {project.description || 'Chưa có mô tả'}
                </p>
                
                {/* Tonal Shift Divider instead of solid line */}
                <div className="mt-auto pt-4 flex items-center text-[11px] font-black text-brand-primary dark:text-brand-secondary uppercase tracking-[0.2em] relative before:absolute before:top-0 before:left-0 before:right-0 before:h-[1px] before:bg-gradient-to-r before:from-brand-primary/10 before:to-transparent dark:before:from-white/10">
                  <Zap className="mr-2 h-3.5 w-3.5" />
                  Thiết lập Workflow
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
