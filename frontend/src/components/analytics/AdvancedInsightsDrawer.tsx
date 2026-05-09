'use client';

import React, { useEffect, useState } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet';
import Loader from '@/components/ui/Loader';
import { Sparkles, Brain, AlertTriangle, Zap, Users, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { useWorkspaceStore } from '@/stores/workspace.store';

interface AdvancedInsightsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  projectId: string;
}

export function AdvancedInsightsDrawer({
  isOpen,
  onClose,
  workspaceId,
  projectId
}: AdvancedInsightsDrawerProps) {
  // Use Tanstack Query to fetch the insights, enabled only when the drawer is open
  const { data, isLoading, error } = useQuery({
    queryKey: ['advanced-insights', workspaceId, projectId],
    queryFn: async () => {
      const response = await api.get(
        `/analytics/workspace/${workspaceId}/project/${projectId}/advanced-insights`
      );
      return response.data;
    },
    enabled: isOpen && !!workspaceId && !!projectId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-5xl p-0 overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800">
        <SheetHeader className="p-8 pb-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 relative overflow-hidden">
          {/* Background decorative element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <SheetTitle className="text-2xl font-black tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
                Phân Tích Chuyên Sâu
                <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-600/10 border border-indigo-500/20 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  AI Powered
                </span>
              </SheetTitle>
              <SheetDescription className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                Nhận định tự động từ Llama 3 70B dựa trên lịch sử hoạt động dự án.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6 animate-in fade-in duration-1000">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500 blur-[40px] opacity-20 rounded-full" />
                <Loader size="lg" />
              </div>
              <div className="space-y-2 text-center">
                <p className="text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                  AI đang phân tích dữ liệu...
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Quá trình này có thể mất vài giây do hệ thống đang tổng hợp hàng ngàn bản ghi hoạt động.
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-2">
                <AlertTriangle className="w-8 h-8 text-rose-500" />
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">Không thể tải phân tích</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                Đã xảy ra lỗi khi kết nối tới dịch vụ AI. Vui lòng thử lại sau.
              </p>
            </div>
          ) : data && data.success && data.data ? (
            <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
              {/* Bottlenecks */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2">Điểm nghẽn (Bottlenecks)</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {Array.isArray(data.data.bottlenecks) ? data.data.bottlenecks.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      )) : <li>{data.data.bottlenecks || "Không có điểm nghẽn"}</li>}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Velocity Analysis */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2">Đánh giá Tốc độ (Velocity)</h3>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {data.data.velocity_analysis}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actionable Recommendations */}
              <div className="bg-gradient-to-br from-indigo-500/5 to-purple-600/5 dark:from-indigo-500/10 dark:to-purple-600/10 rounded-3xl p-6 border border-indigo-500/20 dark:border-indigo-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-black text-indigo-900 dark:text-indigo-100 uppercase tracking-widest">Khuyến nghị từ AI</h3>
                </div>
                <ul className="space-y-3">
                  {(data.data.recommendations || []).map((rec: string, index: number) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{index + 1}</span>
                      </div>
                      <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
