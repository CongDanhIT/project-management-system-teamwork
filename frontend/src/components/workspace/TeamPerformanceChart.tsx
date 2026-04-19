import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  Cell,
  LabelList
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Activity, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamPerformanceChartProps {
  members: any[];
  className?: string;
}

const TeamPerformanceChart = ({ members, className }: TeamPerformanceChartProps) => {
  // Transform data for the chart
  const chartData = members
    .filter(m => (m.taskStats?.totalTasks || 0) > 0)
    .map(member => {
      const total = member.taskStats?.totalTasks || 0;
      const completedOnTime = member.taskStats?.completedTasks || 0;
      const completedLate = member.taskStats?.completedLateTasks || 0;
      const overdue = member.taskStats?.overdueTasks || 0;
      const inProgress = Math.max(0, total - (completedOnTime + completedLate) - overdue);
      
      return {
        name: member.userId?.name || member.name || 'Thành viên',
        completedOnTime,
        completedLate,
        overdue,
        inProgress,
        total,
        completionRate: total > 0 ? Math.round(((completedOnTime + completedLate) / total) * 100) : 0
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload[0].payload.total;
      return (
        <div className="bg-[#191C1E]/95 dark:bg-[#172925]/95 p-4 rounded-2xl shadow-depth-3 border-none backdrop-blur-md">
          <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
            <p className="text-[12px] font-black text-[#C7F964] uppercase tracking-tight">{label}</p>
            <span className="text-[10px] font-bold text-white/40">TỔNG: {total}</span>
          </div>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-8 text-[10px] font-bold uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-white/60">{entry.name}:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white">{entry.value}</span>
                  <span className="text-white/30 lowercase font-medium">({total > 0 ? Math.round((entry.value / total) * 100) : 0}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={cn(
      "rounded-[48px] border-none bg-white/40 dark:bg-[#071613]/40 backdrop-blur-md shadow-ambient overflow-hidden",
      className
    )}>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-12 px-10 pt-10">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#035D5B]/10 dark:bg-[#C7F964]/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#035D5B] dark:text-[#C7F964]" />
            </div>
            <div>
              <CardTitle className="text-xl font-black text-[#035D5B] dark:text-[#C7F964] uppercase tracking-tighter leading-none">
                Bản đồ tải trọng đội ngũ
              </CardTitle>
              <p className="text-[10px] font-bold text-slate-400 dark:text-[#E5F4EF]/40 uppercase tracking-[0.2em] mt-1">
                Phân tích mật độ công việc & hiệu suất thành viên
              </p>
            </div>
          </div>
        </div>

        {/* Improved Legend directly in Header for faster comprehension */}
        <div className="flex flex-wrap gap-5 bg-slate-500/5 dark:bg-white/5 p-3 px-5 rounded-3xl backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span className="text-[8px] font-black uppercase text-slate-500 dark:text-white/60 tracking-widest">Đúng hạn</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#6366F1]" />
            <span className="text-[8px] font-black uppercase text-slate-500 dark:text-white/60 tracking-widest">Xong trễ</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
            <span className="text-[8px] font-black uppercase text-slate-500 dark:text-white/60 tracking-widest">Đang chạy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
            <span className="text-[8px] font-black uppercase text-slate-500 dark:text-white/60 tracking-widest">Quá hạn</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-8 pb-10">
        <div className="h-[400px] w-full relative">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={chartData}
                margin={{ top: 0, right: 60, left: 40, bottom: 0 }}
                barGap={8}
              >
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.9}/>
                  </linearGradient>
                  <linearGradient id="colorLate" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.9}/>
                  </linearGradient>
                  <linearGradient id="colorInProgress" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#FBBC05" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#EA8600" stopOpacity={0.9}/>
                  </linearGradient>
                  <linearGradient id="colorOverdue" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#FF4D4D" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#D92D2D" stopOpacity={0.9}/>
                  </linearGradient>
                </defs>
                
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.03)" />
                
                <XAxis type="number" hide />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={11} 
                  fontWeight={800}
                  tickLine={false}
                  axisLine={false}
                  width={110}
                  tick={({ x, y, payload }: any) => (
                    <g transform={`translate(${x},${y})`}>
                      <text 
                        x={-10} 
                        y={0} 
                        dy={4} 
                        textAnchor="end" 
                        fill="currentColor" 
                        className="text-slate-600 dark:text-[#E5F4EF]/80 font-bold tracking-tight"
                      >
                        {payload.value.length > 15 ? `${payload.value.substring(0, 12)}...` : payload.value}
                      </text>
                    </g>
                  )}
                />
                
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)', radius: 8 }} 
                  content={<CustomTooltip />} 
                />
                
                <Bar 
                  dataKey="completedOnTime" 
                  name="Đúng hạn" 
                  stackId="performance" 
                  fill="url(#colorCompleted)" 
                  barSize={20}
                />
                <Bar 
                  dataKey="completedLate" 
                  name="Xong trễ" 
                  stackId="performance" 
                  fill="url(#colorLate)" 
                  barSize={20}
                />
                <Bar 
                  dataKey="inProgress" 
                  name="Đang thực hiện" 
                  stackId="performance" 
                  fill="url(#colorInProgress)" 
                  barSize={20}
                />
                <Bar 
                  dataKey="overdue" 
                  name="Quá hạn" 
                  stackId="performance" 
                  fill="url(#colorOverdue)" 
                  barSize={20}
                  radius={[0, 10, 10, 0]}
                >
                  <LabelList 
                    dataKey="total" 
                    position="right" 
                    offset={15}
                    content={(props: any) => {
                      const { x, y, width, value } = props;
                      return (
                        <g transform={`translate(${x + width},${y})`}>
                          <rect 
                            x={10} 
                            y={0} 
                            width={34} 
                            height={20} 
                            rx={10} 
                            fill="rgba(0,0,0,0.05)" 
                            className="dark:fill-white/10"
                          />
                          <text 
                            x={27} 
                            y={14} 
                            textAnchor="middle" 
                            fontSize={10} 
                            fontWeight={900} 
                            className="fill-[#035D5B] dark:fill-[#C7F964]"
                          >
                            {value}
                          </text>
                          <text 
                            x={48} 
                            y={14} 
                            fontSize={8} 
                            fontWeight={600} 
                            className="fill-slate-400 dark:fill-white/30 uppercase tracking-tighter"
                          >
                            tasks
                          </text>
                        </g>
                      );
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-slate-50/10 dark:bg-white/5 rounded-[40px] border-2 border-dashed border-slate-100 dark:border-white/5">
              <Activity className="w-12 h-12 text-slate-200 dark:text-white/10 mb-4" />
              <p className="text-sm font-bold text-slate-400 dark:text-white/20 uppercase tracking-widest text-center">
                Chưa có dữ liệu phân bổ công việc<br />
                <span className="text-[10px] font-medium opacity-60 normal-case mt-2 block">Hãy gán công việc cho các thành viên để bắt đầu theo dõi.</span>
              </p>
            </div>
          )}
        </div>

        {/* Summary Footer */}
        {chartData.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex flex-wrap gap-8 justify-center sm:justify-start">
             <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Thành viên nòng cốt</span>
                <span className="text-sm font-bold text-[#035D5B] dark:text-[#C7F964]">{chartData.length} nhân sự</span>
             </div>
             <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Khối lượng lớn nhất</span>
                <span className="text-sm font-bold text-slate-700 dark:text-white/80">{chartData[0].name} ({chartData[0].total} CV)</span>
             </div>
             <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tỷ lệ hoàn thành</span>
                <span className="text-sm font-bold text-emerald-500">
                  {Math.round(chartData.reduce((acc, curr) => acc + curr.completionRate, 0) / chartData.length)}%
                </span>
             </div>
             <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Chỉ số đúng hạn</span>
                <span className="text-sm font-bold text-[#6366F1]">
                  {(() => {
                    const totalCompleted = chartData.reduce((acc, curr) => acc + curr.completedOnTime + curr.completedLate, 0);
                    const onTime = chartData.reduce((acc, curr) => acc + curr.completedOnTime, 0);
                    return totalCompleted > 0 ? Math.round((onTime / totalCompleted) * 100) : 0;
                  })()}%
                </span>
             </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamPerformanceChart;

