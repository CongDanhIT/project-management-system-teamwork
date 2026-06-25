import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar, LayoutGrid, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface ProjectOverviewTableProps {
  projects: any[];
}

const ProjectOverviewTable: React.FC<ProjectOverviewTableProps> = ({ projects }) => {
  if (!projects || projects.length === 0) {
    return (
      <div className="bg-white/40 dark:bg-card/40 backdrop-blur-md rounded-[40px] border border-slate-100 dark:border-white/5 p-12 text-center">
        <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <LayoutGrid className="w-8 h-8 text-slate-300" />
        </div>
        <p className="text-slate-400 font-medium">Chưa có dự án nào trong Workspace này</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-[#035D5B] rounded-full" />
            <h2 className="text-2xl font-black text-[#035D5B] tracking-tight uppercase">Tổng quan theo dự án</h2>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-4 opacity-70">
            Theo dõi tiến độ và tình trạng vận hành của từng mảnh ghép chiến lược
          </p>
        </div>
        <div className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full uppercase">
          {projects.length} Dự án
        </div>
      </div>

      <div className="bg-white/40 dark:bg-card/40 backdrop-blur-md rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-none overflow-hidden">
        <div className="h-[450px] overflow-y-auto scrollbar-hide">
          <Table>
            <TableHeader className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-20">
              <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-white/5">
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-14 pl-8">Dự án</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-14 text-center">Tổng việc</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-14 text-center">Đang làm</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-14 text-center text-emerald-500">Hoàn thành</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-14 text-center text-red-500">Hết hạn</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-14 min-w-[150px]">Tiến độ</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-14">Hạn chót</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-14 pr-8">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => {
                const total = project.totalTasks || 0;
                const completed = project.completedTasks || 0;
                const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
                
                return (
                  <TableRow 
                    key={project._id} 
                    className="group border-b border-slate-50 dark:border-white/[0.02] hover:bg-[#035D5B]/[0.02] transition-colors duration-300"
                  >
                    <TableCell className="py-5 pl-8">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{project.emoji || '🎯'}</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200 tracking-tight line-clamp-1">{project.name}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <span className="font-mono font-bold text-slate-500">{total}</span>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5 text-sky-500">
                        <Clock size={12} strokeWidth={3} />
                        <span className="font-mono font-bold">{project.inProgressTasks || 0}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5 text-emerald-500">
                        <CheckCircle2 size={12} strokeWidth={3} />
                        <span className="font-mono font-bold">{completed}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5 text-red-500">
                        <AlertCircle size={12} strokeWidth={3} />
                        <span className="font-mono font-bold">{project.overdueTasks || 0}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1.5 pr-4">
                        <div className="flex justify-between text-[9px] font-black uppercase tracking-tighter text-slate-400">
                          <span>{progress}%</span>
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity">{completed}/{total}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-1000 ease-out",
                              progress === 100 ? "bg-emerald-500" : "bg-gradient-to-r from-teal-500 to-emerald-400"
                            )}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar size={12} />
                        <span className="text-[11px] font-medium whitespace-nowrap">
                          {project.endDate 
                            ? format(new Date(project.endDate), 'dd MMM, yyyy', { locale: vi })
                            : 'Không thời hạn'
                          }
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="pr-8">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[9px] font-black uppercase tracking-widest border-none px-2.5 py-0.5",
                          project.status === 'COMPLETED' ? "bg-emerald-500/10 text-emerald-600" :
                          project.status === 'FROZEN' ? "bg-blue-500/10 text-blue-600" :
                          "bg-teal-500/10 text-teal-600"
                        )}
                      >
                        {project.status === 'ACTIVE' ? 'Đang chạy' :
                         project.status === 'COMPLETED' ? 'Hoàn thành' :
                         project.status === 'FROZEN' ? 'Đóng băng' : project.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default ProjectOverviewTable;
