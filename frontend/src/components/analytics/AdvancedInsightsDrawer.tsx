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
import { Sparkles, Brain, AlertTriangle, Zap, Users, TrendingUp, FileText, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';
import { exportAIInsightsToWord } from "../../utils/export-utils";
import { Button } from '@/components/ui/button';

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
  // Lấy thông tin chi tiết dự án
  const { data: projectData } = useQuery({
    queryKey: ['project', workspaceId, projectId],
    queryFn: async () => {
      const response = await api.get(`/project/workspace/${workspaceId}/${projectId}`);
      return response.data;
    },
    enabled: !!workspaceId && !!projectId && isOpen,
  });

  // Lấy thông tin workspace
  const { data: workspaceData } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: async () => {
      const response = await api.get(`/workspace/${workspaceId}`);
      return response.data;
    },
    enabled: !!workspaceId && isOpen,
  });

  // Tính toán kỳ phân tích (7 ngày gần nhất)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 7);

  const analysisPeriod = {
    from: startDate.toLocaleDateString('vi-VN'),
    to: endDate.toLocaleDateString('vi-VN')
  };

  const project = projectData?.project;
  const workspace = workspaceData?.workspace;

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

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    console.log("Export triggered", { data, projectData, workspaceData });
    
    if (!data || !data.data) {
      console.warn("No analysis data available to export");
      return;
    }

    try {
      setIsExporting(true);
      const project = projectData?.project;
      const workspace = workspaceData?.workspace;
      const currentUser = useAuthStore.getState().user;

      await exportAIInsightsToWord({
        projectName: project?.name || "Dự án",
        workspaceName: workspace?.name || "N/A",
        description: project?.description,
        reporterName: currentUser?.name || "N/A",
        analysisPeriod: analysisPeriod,
        data: data.data
      });
    } catch (error) {
      console.error("Lỗi khi xuất file Word:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-[850px] max-w-[90vw] p-0 overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800">
        <SheetHeader className="p-8 pb-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 relative overflow-hidden">
          {/* Background decorative element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
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
                  Nhận định tự động từ Llama 3 70B dựa trên nhật ký hoạt động 7 ngày gần nhất và dữ liệu tiến độ từ snapshot.
                </SheetDescription>
              </div>
            </div>

            {/* Export Button */}
            {data && data.success && (
              <Button 
                onClick={handleExport}
                variant="outline" 
                className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 h-11 px-5 font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <FileText className="w-4 h-4 text-indigo-500" />
                Xuất báo cáo Word
              </Button>
            )}
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
            <div className="grid grid-cols-1 gap-8 animate-in slide-in-from-bottom-8 duration-700">
              
              {/* Velocity & Risk Forecast - Hai khối quan trọng nhất về xu hướng */}
              <div className="grid grid-cols-2 gap-6">
                {/* Velocity Analysis */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2">Nhịp độ (Velocity)</h3>
                      <p className="text-[14px] leading-relaxed text-slate-600 dark:text-slate-300">
                        {data.data.velocity_analysis}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Risk Forecast */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2">Dự báo rủi ro</h3>
                      <p className="text-[14px] leading-relaxed text-slate-600 dark:text-slate-300">
                        {data.data.risk_forecast || "Chưa có đủ dữ liệu để dự báo rủi ro tiềm ẩn."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottlenecks - Khối về vấn đề tồn đọng */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider mb-3">Điểm nghẽn (Bottlenecks)</h3>
                    <div className="space-y-4">
                      {Array.isArray(data.data.bottlenecks) ? data.data.bottlenecks.map((item: string, i: number) => (
                        <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
                          {item}
                        </div>
                      )) : <p className="text-[15px] text-slate-500 italic">Không có điểm nghẽn nghiêm trọng nào được phát hiện.</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Performance - Khối về con người */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider mb-3">Hiệu suất nhóm (Team Performance)</h3>
                    <div className="space-y-4">
                      {Array.isArray(data.data.team_performance) ? data.data.team_performance.map((item: string, i: number) => (
                        <div key={i} className="flex gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                          <p className="text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
                            {item}
                          </p>
                        </div>
                      )) : <p className="text-[15px] text-slate-500 italic">Chưa có đủ dữ liệu thành viên.</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actionable Recommendations */}
              <div className="bg-gradient-to-br from-indigo-500/5 to-purple-600/5 dark:from-indigo-500/10 dark:to-purple-600/10 rounded-3xl p-8 border border-indigo-500/20 dark:border-indigo-500/20 shadow-inner">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-indigo-500">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-sm font-black text-indigo-900 dark:text-indigo-100 uppercase tracking-widest">Kế hoạch hành động đề xuất</h3>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {(data.data.recommendations || []).map((rec: string, index: number) => (
                    <div key={index} className="flex items-start gap-4 p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-white dark:border-slate-800 shadow-sm">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center flex-shrink-0 font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                        {index + 1}
                      </div>
                      <span className="text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
