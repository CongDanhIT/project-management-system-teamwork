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

  // Hàm lấy màu sắc dựa trên số lượng
  const getColorClass = (count: number) => {
    if (count === 0) return "bg-muted/30 dark:bg-muted/10";
    if (count <= 2) return "bg-emerald-200 dark:bg-emerald-900/40";
    if (count <= 5) return "bg-emerald-400 dark:bg-emerald-700/60";
    if (count <= 10) return "bg-emerald-600 dark:bg-emerald-500/80";
    return "bg-emerald-800 dark:bg-emerald-400";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 border rounded-xl bg-muted/10 animate-pulse">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500" />
          Tần suất hoạt động (4 tháng qua)
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="flex flex-col gap-2">
          {/* Heatmap Grid */}
          <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-2 scrollbar-hide">
             <TooltipProvider delayDuration={0}>
              {days.map((day, index) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const stat = stats.find(s => s.date === dateStr);
                const count = stat ? stat.count : 0;

                return (
                  <Tooltip key={dateStr}>
                    <TooltipTrigger asChild>
                      <div
                        className={`w-[10px] h-[10px] md:w-3 md:h-3 rounded-sm transition-colors cursor-pointer hover:ring-2 hover:ring-primary/50 ${getColorClass(count)}`}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p className="font-semibold">
                        {count} hoạt động
                      </p>
                      <p className="text-muted-foreground">
                        {format(day, "EEEE, d 'tháng' M, yyyy", { locale: vi })}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>

          {/* Chú thích (Legend) */}
          <div className="flex items-center justify-end gap-2 text-[10px] text-muted-foreground mt-1">
            <span>Ít</span>
            <div className="w-2.5 h-2.5 rounded-sm bg-muted/30" />
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-200" />
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-600" />
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-800" />
            <span>Nhiều</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
