"use client";

import React, { useEffect, useState, useMemo } from "react";
import { format, subDays, startOfToday, eachDayOfInterval, isSameDay } from "date-fns";
import { vi } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { activityService } from "@/services/activity.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Activity } from "lucide-react";

interface ActivityStat {
  date: string;
  count: number;
}

interface ActivityHeatmapProps {
  workspaceId: string;
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ workspaceId }) => {
  const [stats, setStats] = useState<ActivityStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      // Chỉ fetch nếu workspaceId hợp lệ (định dạng MongoDB ObjectId 24 ký tự)
      if (!workspaceId || !/^[0-9a-fA-F]{24}$/.test(workspaceId)) {
        return;
      }

      try {
        setIsLoading(true);
        const response = await activityService.getWorkspaceActivityStatistics(workspaceId);
        if (response.success) {
          setStats(response.stats);
        }
      } catch (error) {
        console.error("Lỗi khi lấy thống kê hoạt động:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [workspaceId]);

  // Tạo danh sách 365 ngày gần nhất
  const days = useMemo(() => {
    const today = startOfToday();
    const startDate = subDays(today, 119); // ~4 tháng (120 ngày bao gồm hôm nay)
    return eachDayOfInterval({ start: startDate, end: today });
  }, []);

  // Hàm lấy màu sắc dựa trên số lượng - Obsidian Meridian Spectrum
  const getColorClass = (count: number) => {
    if (count === 0) return "bg-slate-100/50 dark:bg-white/5";
    if (count <= 2) return "bg-[#035D5B]/20 dark:bg-[#035D5B]/30";
    if (count <= 5) return "bg-[#035D5B]/50 dark:bg-[#035D5B]/60";
    if (count <= 10) return "bg-[#035D5B] dark:bg-[#035D5B]";
    return "bg-[#C7F964] shadow-[0_0_10px_rgba(199,249,100,0.4)]";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 bg-white/40 dark:bg-card/40 backdrop-blur-xl rounded-[40px] border border-slate-100 dark:border-white/5 animate-pulse">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600/50" />
      </div>
    );
  }

  return (
    <div className="group relative isolate">
      {/* Ambient Glow behind the card */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-teal-500/10 via-lime-500/5 to-transparent rounded-[48px] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

      <div className="relative bg-white/40 dark:bg-card/40 backdrop-blur-2xl rounded-[40px] border border-white/40 dark:border-white/5 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-none overflow-hidden">
        {/* Background Texture */}
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-900/20">
                <Activity className="w-4 h-4 text-[#035D5B] dark:text-[#C7F964]" />
              </div>
              <div>
                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em]">
                  Hoạt động nhịp điệu
                </h3>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400/60">
                  Tần suất tương tác (4 tháng qua)
                </p>
              </div>
            </div>

            {/* Chú thích (Legend) */}
            <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              <span>Ít</span>
              <div className="flex gap-1 px-2 py-1 rounded-full bg-slate-50/50 dark:bg-white/5">
                <div className="w-2 h-2 rounded-[2px] bg-slate-100/50 dark:bg-white/5" />
                <div className="w-2 h-2 rounded-[2px] bg-[#035D5B]/30" />
                <div className="w-2 h-2 rounded-[2px] bg-[#035D5B]/60" />
                <div className="w-2 h-2 rounded-[2px] bg-[#035D5B]" />
                <div className="w-2 h-2 rounded-[2px] bg-[#C7F964]" />
              </div>
              <span>Nhiều</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {/* Heatmap Grid */}
            <div className="grid grid-flow-col grid-rows-7 gap-1.5 overflow-x-auto pb-4 scrollbar-hide">
              <TooltipProvider delayDuration={0}>
                {days.map((day, index) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const stat = stats.find(s => s.date === dateStr);
                  const count = stat ? stat.count : 0;

                  return (
                    <Tooltip key={dateStr}>
                      <TooltipTrigger asChild>
                        <div
                          className={`w-[11px] h-[11px] md:w-3.5 md:h-3.5 rounded-[3px] transition-all duration-300 cursor-pointer hover:scale-125 hover:z-10 ${getColorClass(count)}`}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="rounded-xl border-none bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-xl p-3">
                        <div className="flex flex-col gap-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-teal-600 dark:text-[#C7F964]">
                            {count} hoạt động
                          </p>
                          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            {format(day, "EEEE, d 'tháng' M, yyyy", { locale: vi })}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
