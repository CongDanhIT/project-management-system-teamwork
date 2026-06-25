import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MemberPerformanceEvaluationProps {
  members: any[];
}

const MemberPerformanceEvaluation: React.FC<MemberPerformanceEvaluationProps> = ({ members }) => {
  // 1. Xử lý và đồng bộ dữ liệu cho 4 biểu đồ
  const chartData = useMemo(() => {
    if (!members || !Array.isArray(members)) return [];

    return members
      .map((m: any) => {
        const total = m.taskStats?.totalTasks || 0;
        const completed = m.taskStats?.completedTasks || 0;
        const overdue = m.taskStats?.overdueTasks || 0;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        return {
          name: m.userId?.name || 'Thành viên',
          userId: String(m.userId?._id || m.userId),
          total,
          completed,
          overdue,
          rate,
          avatar: m.userId?.profilePicture
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [members]);

  const CustomTooltip = ({ active, payload, label, suffix = "công việc" }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-white/10 p-3 rounded-2xl shadow-xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].fill }} />
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {payload[0].value} <span className="text-[10px] font-medium text-slate-400">{suffix}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderChartCard = (
    title: string, 
    dataKey: string, 
    gradientColors: [string, string], 
    suffix?: string, 
    subtitle?: string,
    usePattern?: boolean
  ) => {
    const gradientId = `grad-${dataKey}`;
    return (
    <div className="bg-white/40 dark:bg-card/40 backdrop-blur-md rounded-[32px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-none transition-all duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em]">{title}</h3>
          {subtitle && <p className="text-[10px] font-bold text-slate-300 mt-1 uppercase">{subtitle}</p>}
        </div>
        <div className={cn(
          "text-[10px] font-bold px-3 py-1 rounded-full",
          "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400"
        )}>
          {suffix === "%" ? "Tỷ lệ %" : "Số lượng"}
        </div>
      </div>
      
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 40, left: 40, bottom: 5 }}
            barSize={16}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={gradientColors[0]} stopOpacity={0.8} />
                <stop offset="100%" stopColor={gradientColors[1]} stopOpacity={1} />
              </linearGradient>
              {usePattern && (
                <pattern id="overdue-pattern" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="8" height="8" fill={gradientColors[0]} />
                  <line x1="0" y1="0" x2="0" y2="8" stroke={gradientColors[1]} strokeWidth="4" />
                </pattern>
              )}
            </defs>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#cbd5e1" strokeOpacity={0.4} />
            <XAxis 
              type="number" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#cbd5e1', fontSize: 10, fontWeight: 600 }}
              tickFormatter={(value) => suffix === "%" ? `${value}%` : value}
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={80}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
            />
            <Tooltip content={<CustomTooltip suffix={suffix} />} cursor={{ fill: 'rgba(203, 213, 225, 0.1)' }} />
            <Bar 
              dataKey={dataKey} 
              radius={[0, 10, 10, 0]}
              animationDuration={1500}
            >
              {chartData.map((entry, index) => {
                const opacity = Math.max(0.3, 1 - index * 0.15); // Fade out theo rank
                const fill = usePattern ? "url(#overdue-pattern)" : `url(#${gradientId})`;
                // Parse the hex to rgb for shadow if needed, or just use the raw color + hex alpha
                // gradientColors[1] is the end color, e.g., #10b981. Append '66' for ~40% opacity glow.
                const shadowColor = gradientColors[1] + '66';
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={fill} 
                    fillOpacity={opacity}
                    style={{ filter: `drop-shadow(0 4px 6px ${shadowColor})` }}
                  />
                );
              })}
              <LabelList 
                dataKey={dataKey} 
                position="right" 
                fill="#94a3b8" 
                fontSize={10} 
                fontWeight={700}
                formatter={(value: any) => suffix === "%" ? `${value}%` : value}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-700">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-[#035D5B] rounded-full" />
            <h2 className="text-2xl font-black text-[#035D5B] tracking-tight uppercase">Đánh giá và so sánh thành viên</h2>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-4 opacity-70">
            Dữ liệu dựa trên trách nhiệm cá nhân (Multi-assignee tasks được tính cho mỗi thành viên)
          </p>
        </div>
        <div className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full uppercase">
          {members.length} Thành viên
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-white/5 rounded-[40px] border border-dashed border-slate-200 dark:border-white/10">
          <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
            <Activity className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-400 font-medium">Chưa có dữ liệu thống kê cho thành viên trong dự án này</p>
          <p className="text-[10px] text-slate-400/60 uppercase mt-2">Thử thay đổi bộ lọc dự án hoặc gán công việc cho thành viên</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Row 1 */}
          {renderChartCard("Khối lượng công việc", "total", ["#035D5B", "#0d9488"], "công việc", "Tổng số task được giao")}
          {renderChartCard("Công việc hoàn thành", "completed", ["#059669", "#10b981"], "công việc", "Số task đã về trạng thái Done")}

          {/* Row 2 */}
          {renderChartCard("Công việc quá hạn", "overdue", ["#fca5a5", "#ef4444"], "công việc", "Task chưa xong và đã trễ hạn", true)}
          {renderChartCard("Tỉ lệ hoàn thành", "rate", ["#7c3aed", "#8b5cf6"], "%", "Hiệu suất hoàn thành (%)")}
        </div>
      )}
    </div>
  );
};

export default MemberPerformanceEvaluation;
