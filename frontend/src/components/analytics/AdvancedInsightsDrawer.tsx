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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { DateRange } from "react-day-picker";

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

  // Trạng thái bộ lọc thời gian
  const [dateFilterType, setDateFilterType] = useState<string>('30');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>({
    from: (() => {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return d;
    })(),
    to: new Date()
  });

  const getEffectiveDateRange = () => {
    const to = new Date();
    if (dateFilterType === '7') {
      const from = new Date();
      from.setDate(from.getDate() - 7);
      return { from, to };
    }
    if (dateFilterType === '15') {
      const from = new Date();
      from.setDate(from.getDate() - 15);
      return { from, to };
    }
    if (dateFilterType === '30') {
      const from = new Date();
      from.setDate(from.getDate() - 30);
      return { from, to };
    }
    if (dateFilterType === 'custom' && customDateRange?.from && customDateRange?.to) {
      return customDateRange as { from: Date, to: Date };
    }
    // Default 30
    const from = new Date();
    from.setDate(from.getDate() - 30);
    return { from, to };
  }

  const effectiveRange = getEffectiveDateRange();

  const analysisPeriod = {
    from: effectiveRange.from.toLocaleDateString('vi-VN'),
    to: effectiveRange.to.toLocaleDateString('vi-VN')
  };

  const project = projectData?.project;
  const workspace = workspaceData?.workspace;

  const [selectedModel, setSelectedModel] = useState<string>('llama-3.3-70b-versatile');
  const [hasStartedAnalysis, setHasStartedAnalysis] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setHasStartedAnalysis(false), 300);
    }
  }, [isOpen]);

  // Use Tanstack Query to fetch the insights, enabled only when the drawer is open AND user clicks start
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['advanced-insights', workspaceId, projectId, selectedModel, dateFilterType, customDateRange],
    queryFn: async () => {
      const response = await api.get(
        `/analytics/workspace/${workspaceId}/project/${projectId}/advanced-insights?modelId=${selectedModel}&startDate=${effectiveRange.from.toISOString()}&endDate=${effectiveRange.to.toISOString()}`
      );
      return response.data;
    },
    enabled: isOpen && !!workspaceId && !!projectId && hasStartedAnalysis,
    staleTime: 0, // Disable cache to always fetch fresh data during development
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

      const insightsData = data.data.insights || data.data;
      const reportStatsData = data.data.reportStats;
      const filteredReportStatsData = data.data.filteredReportStats;

      await exportAIInsightsToWord({
        projectName: project?.name || "Dự án",
        workspaceName: workspace?.name || "N/A",
        description: project?.description,
        reporterName: currentUser?.name || "N/A",
        analysisPeriod: analysisPeriod,
        data: {
          insights: insightsData,
          reportStats: reportStatsData,
          filteredReportStats: filteredReportStatsData
        }
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
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-sm">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <SheetTitle className="text-2xl font-black tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
                  Phân Tích Chuyên Sâu
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary">
                    AI Powered
                  </span>
                </SheetTitle>
                <SheetDescription className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                  Nhận định tự động từ Llama 3 70B dựa trên nhật ký hoạt động {dateFilterType === 'custom' ? 'khoảng thời gian tuỳ chỉnh' : `${dateFilterType} ngày gần nhất`} và dữ liệu tiến độ từ snapshot.
                </SheetDescription>
              </div>
            </div>

            {/* Export Button & Model Select */}
            <div className="flex items-center gap-3 relative z-10 flex-wrap justify-end">
              <div className="flex items-center gap-2">
                <Select value={dateFilterType} onValueChange={(val) => val && setDateFilterType(val as string)}>
                  <SelectTrigger className="h-11 w-[150px] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl font-bold focus:ring-indigo-500 shadow-sm">
                    <SelectValue placeholder="Thời gian" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 shadow-xl font-medium">
                    <SelectItem value="7" className="cursor-pointer">7 Ngày gần nhất</SelectItem>
                    <SelectItem value="15" className="cursor-pointer">15 Ngày gần nhất</SelectItem>
                    <SelectItem value="30" className="cursor-pointer">30 Ngày gần nhất</SelectItem>
                    <SelectItem value="custom" className="cursor-pointer">Tuỳ chỉnh</SelectItem>
                  </SelectContent>
                </Select>
                {dateFilterType === 'custom' && (
                  <DatePickerWithRange date={customDateRange} setDate={setCustomDateRange} />
                )}
              </div>

              <Select value={selectedModel} onValueChange={(val) => val && setSelectedModel(val as string)}>
                <SelectTrigger className="h-11 w-[220px] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl font-bold focus:ring-indigo-500 shadow-sm">
                  <SelectValue placeholder="Chọn Model AI" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 shadow-xl font-medium">
                  <SelectItem value="llama-3.3-70b-versatile" className="cursor-pointer">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Llama 3 70B</span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Groq (Siêu Tốc)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="openai/gpt-oss-120b:free" className="cursor-pointer">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">GPT-OSS 120B</span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">OpenRouter (Dự Phòng - Ổn Định)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="meta-llama/Llama-3.3-70B-Instruct-Turbo" className="cursor-pointer">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-bold text-sky-600 dark:text-sky-400">Llama 3 70B</span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Together AI (Dự phòng tốc độ cao)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="google/gemma-4-31B-it" className="cursor-pointer">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Gemma 4 31B-it FP8</span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Together AI (Đôi khi bị kẹt do Rate Limit)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="google/gemma-4-31b-it:free" className="cursor-pointer">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-bold text-teal-600 dark:text-teal-400">Gemma 4 31B</span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">OpenRouter (Bản Free - Đáng thử)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="deepseek-ai/deepseek-v4-pro" className="cursor-pointer">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-bold text-amber-600 dark:text-amber-400">Deepseek V4 Pro</span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Together AI (Vua Suy Luận - Khuyên Dùng)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="poolside/laguna-m.1:free" className="cursor-pointer">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-bold text-teal-600 dark:text-teal-400">Laguna M.1 (Poolside)</span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Mới - Chuyên Gia Logic</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="meta-llama/llama-3.3-70b-instruct:free" className="cursor-pointer">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">Llama 3.3 70B</span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">OpenRouter (Rất Dễ Quá Tải)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="google/gemma-4-31b-it" className="cursor-pointer">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">Gemma 4 31B (Paid)</span>
                      <span className="text-[10px] text-emerald-600 uppercase tracking-wider font-semibold">OpenRouter (Bản Trả Phí - Ổn Định)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {data && data.success && (
                <Button 
                  onClick={handleExport}
                  variant="outline" 
                  className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 h-11 px-5 font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
                >
                  <FileText className="w-4 h-4 text-indigo-500" />
                  Xuất báo cáo Word
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {!hasStartedAnalysis ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] space-y-8 animate-in fade-in zoom-in duration-700 mt-10">
              <div className="w-24 h-24 rounded-[32px] bg-primary flex items-center justify-center shadow-md">
                <Brain className="w-12 h-12 text-primary-foreground" />
              </div>
              <div className="text-center space-y-3 max-w-md">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Sẵn Sàng Phân Tích?</h2>
                <p className="text-[15px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  Vui lòng chọn Mô hình AI ở góc trên bên phải. Sau đó, hệ thống sẽ quét toàn bộ dữ liệu 30 ngày qua để tìm ra điểm nghẽn và rủi ro tiềm ẩn.
                </p>
              </div>
              <Button 
                onClick={() => setHasStartedAnalysis(true)}
                className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg shadow-sm hover:scale-105 transition-all"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Bắt Đầu Phân Tích
              </Button>
            </div>
          ) : isLoading || (isFetching && !data) ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6 animate-in fade-in duration-1000">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-[40px] opacity-20 rounded-full" />
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
            <div className="flex flex-col gap-8 animate-in slide-in-from-bottom-8 duration-700 pb-10">
              
              {(() => {
                const insightsData = data.data.insights || data.data;
                const reportStats = data.data.reportStats;
                
                return (
                  <>
                    {/* 0. CRITICAL INCIDENTS - Báo động đỏ nếu có EXTREME_ANOMALY */}
                    {insightsData.criticalIncidents && insightsData.criticalIncidents.length > 0 && (
                      <div className="relative group animate-in slide-in-from-bottom-4 duration-500">
                        <div className="relative bg-white dark:bg-card rounded-[32px] p-8 border border-red-200 dark:border-red-500/30 shadow-sm overflow-hidden">
                          <div className="absolute top-0 right-0 p-8 opacity-5">
                            <AlertTriangle className="w-48 h-48 text-red-500" />
                          </div>
                          
                          <div className="flex items-center gap-3 mb-6 relative z-10">
                            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
                              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                      <div>
                        <h3 className="text-xl font-black text-red-600 dark:text-red-400 tracking-tight">
                          Cảnh Báo Nghiêm Trọng (Extreme Anomaly)
                        </h3>
                        <p className="text-xs font-bold text-red-500 uppercase tracking-[0.2em]">Phát hiện bất thường cấp độ cao</p>
                      </div>
                    </div>
                    
                    <div className="relative z-10 space-y-4">
                      {insightsData.criticalIncidents.map((incident: string, i: number) => (
                        <div key={i} className="p-4 rounded-2xl bg-red-50/50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 text-[15px] leading-relaxed text-red-700 dark:text-red-300 font-medium flex gap-4 items-start">
                          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                          <p>{incident}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 1. DEEP INSIGHTS - Thẻ Tự do suy luận siêu việt (Nổi bật nhất) */}
              {insightsData.deep_insights && (
                <div className="relative group">
                  <div className="relative bg-white dark:bg-card rounded-[32px] p-8 border border-primary/20 shadow-sm overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <Brain className="w-48 h-48 text-primary" />
                    </div>
                    
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                      <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
                        <Sparkles className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-primary tracking-tight">
                          Góc Nhìn Chuyên Sâu
                        </h3>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Khám phá rủi ro ngầm & Xu hướng</p>
                      </div>
                    </div>
                    
                    <div className="relative z-10 text-[16px] leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
                      <p className="italic border-l-4 border-violet-500 pl-4 py-1">
                        "{insightsData.deep_insights}"
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. VELOCITY & RISK FORECAST - Grid 2 cột */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Velocity */}
                <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[32px] p-8 border border-slate-200 dark:border-white/5 shadow-ambient hover:border-emerald-500/30 transition-all group">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Zap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Nhịp Độ Dự Án</h3>
                      <p className="text-xs text-slate-500">Velocity Analysis</p>
                    </div>
                  </div>
                  <div className="text-[15px] leading-relaxed text-slate-600 dark:text-slate-300 font-medium">
                    {insightsData.velocity_analysis}
                  </div>
                </div>

                {/* Risk */}
                <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[32px] p-8 border border-slate-200 dark:border-white/5 shadow-ambient hover:border-amber-500/30 transition-all group">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Dự Báo Rủi Ro</h3>
                      <p className="text-xs text-slate-500">Risk Forecast</p>
                    </div>
                  </div>
                  <div className="text-[15px] leading-relaxed text-slate-600 dark:text-slate-300 font-medium">
                    {insightsData.risk_forecast || "Chưa có đủ dữ liệu để dự báo rủi ro tiềm ẩn."}
                  </div>
                </div>
              </div>

              {/* 3. BOTTLENECKS & TEAM PERFORMANCE - Grid 2 cột */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bottlenecks */}
                <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[32px] p-8 border border-slate-200 dark:border-white/5 shadow-ambient hover:border-rose-500/30 transition-all">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Điểm Nghẽn</h3>
                      <p className="text-xs text-slate-500">Bottlenecks & Blockers</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {Array.isArray(insightsData.bottlenecks) && insightsData.bottlenecks.length > 0 ? (
                      insightsData.bottlenecks.map((item: string, i: number) => (
                        <div key={i} className="flex gap-3 items-start group/item">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 flex-shrink-0 group-hover/item:scale-150 transition-transform" />
                          <p className="text-[15px] leading-relaxed text-slate-600 dark:text-slate-300 font-medium">{item}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-[15px] italic text-slate-500">Không có điểm nghẽn nghiêm trọng nào được phát hiện.</p>
                    )}
                  </div>
                </div>

                {/* Team Performance */}
                <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[32px] p-8 border border-slate-200 dark:border-white/5 shadow-ambient hover:border-blue-500/30 transition-all">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Hiệu Suất Nhóm</h3>
                      <p className="text-xs text-slate-500">Team Performance</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {Array.isArray(insightsData.team_performance) && insightsData.team_performance.length > 0 ? (
                      insightsData.team_performance.map((item: string, i: number) => (
                        <div key={i} className="flex gap-4 items-start">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                          <p className="text-[14px] leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
                            {item}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-[15px] text-slate-500 italic">Chưa có đủ dữ liệu thành viên.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 4. RECOMMENDATIONS - Thẻ Action Plan chuyên nghiệp */}
              <div className="relative overflow-hidden bg-slate-50 dark:bg-slate-900/50 rounded-[32px] p-8 border border-slate-200 dark:border-white/10 shadow-sm">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-sm">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">Kế Hoạch Hành Động</h3>
                        <p className="text-sm text-slate-500">AI Recommendations & Next Steps</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4 relative z-10">
                    {(insightsData.recommendations || []).map((rec: string, index: number) => (
                      <div 
                        key={index} 
                        className="group/rec flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all hover:shadow-md"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm border border-indigo-100 dark:border-indigo-500/20 group-hover/rec:bg-indigo-500 group-hover/rec:text-white transition-colors">
                          {index + 1}
                        </div>
                        <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300 font-medium pt-1">
                          {rec}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Optional Table for reportStats can go here later */}

            </>
          );
        })()}
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
