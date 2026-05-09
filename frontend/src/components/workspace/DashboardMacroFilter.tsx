import React from 'react';
import { 
  Calendar, 
  ChevronDown, 
  Layers, 
  Activity,
  CheckCircle2,
  Filter,
  X
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface FilterState {
  year: number;
  periodType: 'month' | 'quarter';
  periodValue: number; // 1-12 for month, 1-4 for quarter
  projectIds: string[];
  healthStatus: 'all' | 'active' | 'at-risk' | 'completed';
}

interface DashboardMacroFilterProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  projects: any[];
}

export const DashboardMacroFilter: React.FC<DashboardMacroFilterProps> = ({
  filters,
  setFilters,
  projects
}) => {
  const years = [2024, 2025, 2026];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const quarters = [1, 2, 3, 4];

  const handleYearChange = (year: number) => {
    setFilters(prev => ({ ...prev, year }));
  };

  const handlePeriodTypeChange = (type: 'month' | 'quarter') => {
    setFilters(prev => ({ 
      ...prev, 
      periodType: type, 
      periodValue: type === 'month' ? new Date().getMonth() + 1 : Math.ceil((new Date().getMonth() + 1) / 3)
    }));
  };

  const handlePeriodValueChange = (value: number) => {
    setFilters(prev => ({ ...prev, periodValue: value }));
  };

  const toggleProject = (projectId: string) => {
    setFilters(prev => ({
      ...prev,
      projectIds: prev.projectIds.includes(projectId)
        ? prev.projectIds.filter(id => id !== projectId)
        : [...prev.projectIds, projectId]
    }));
  };

  const selectAllProjects = () => {
    setFilters(prev => ({ ...prev, projectIds: projects.map(p => p._id) }));
  };

  const clearProjects = () => {
    setFilters(prev => ({ ...prev, projectIds: [] }));
  };

  return (
    <div className="flex flex-wrap items-center gap-4 p-2 bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-[32px] shadow-depth-1">
      {/* Year Selector */}
      <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="inline-flex items-center justify-center rounded-full h-10 px-4 font-bold text-[#035D5B] dark:text-[#C7F964] hover:bg-white/40 dark:hover:bg-white/5 cursor-pointer transition-colors">
          <Calendar className="w-4 h-4 mr-2 opacity-60" />
          Năm {filters.year}
          <ChevronDown className="w-4 h-4 ml-2 opacity-40" />
        </div>
      </DropdownMenuTrigger>
        <DropdownMenuContent className="rounded-2xl border-none shadow-depth-3 bg-white dark:bg-[#1C2322]">
          {years.map(y => (
            <DropdownMenuItem key={y} onClick={() => handleYearChange(y)} className="rounded-xl font-bold">
              Năm {y}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="h-6 w-[1px] bg-slate-300/30 mx-1 hidden md:block" />

      {/* Period Type Switcher */}
      <div className="flex bg-slate-200/50 dark:bg-white/5 p-1 rounded-full border border-white/10">
        <button
          onClick={() => handlePeriodTypeChange('month')}
          className={cn(
            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
            filters.periodType === 'month' 
              ? "bg-white dark:bg-[#C7F964] text-[#035D5B] shadow-sm" 
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
          )}
        >
          Tháng
        </button>
        <button
          onClick={() => handlePeriodTypeChange('quarter')}
          className={cn(
            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
            filters.periodType === 'quarter' 
              ? "bg-white dark:bg-[#C7F964] text-[#035D5B] shadow-sm" 
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
          )}
        >
          Quý
        </button>
      </div>

      {/* Period Value Selector */}
      <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="inline-flex items-center justify-center rounded-full h-10 px-4 font-bold text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/5 cursor-pointer transition-colors">
          {filters.periodType === 'month' 
            ? (filters.periodValue === 0 ? 'Cả năm' : `Tháng ${filters.periodValue}`) 
            : `Quý ${filters.periodValue}`}
          <ChevronDown className="w-4 h-4 ml-2 opacity-40" />
        </div>
      </DropdownMenuTrigger>
        <DropdownMenuContent className="rounded-2xl border-none shadow-depth-3 bg-white dark:bg-[#1C2322] max-h-[300px] overflow-y-auto min-w-[120px]">
          {filters.periodType === 'month' && (
            <DropdownMenuItem 
              onClick={() => handlePeriodValueChange(0)} 
              className="rounded-xl font-bold text-brand-primary"
            >
              Cả năm
            </DropdownMenuItem>
          )}
          {(filters.periodType === 'month' ? months : quarters).map(v => (
            <DropdownMenuItem key={v} onClick={() => handlePeriodValueChange(v)} className="rounded-xl font-bold">
              {filters.periodType === 'month' ? `Tháng ${v}` : `Quý ${v}`}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="h-6 w-[1px] bg-slate-300/30 mx-1 hidden md:block" />

      {/* Project Multi-selector */}
      <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="inline-flex items-center justify-center rounded-full h-10 px-4 font-bold text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/5 cursor-pointer transition-colors">
          <Layers className="w-4 h-4 mr-2 opacity-60" />
          Dự án ({filters.projectIds.length === 0 ? 'Tất cả' : filters.projectIds.length})
          <ChevronDown className="w-4 h-4 ml-2 opacity-40" />
        </div>
      </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 rounded-2xl border-none shadow-depth-3 bg-white dark:bg-[#1C2322] p-2">
          <div className="flex items-center justify-between p-2 mb-1">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Chọn dự án</span>
            <div className="flex gap-2">
              <button onClick={selectAllProjects} className="text-[10px] font-bold text-teal-600 hover:underline">Tất cả</button>
              <button onClick={clearProjects} className="text-[10px] font-bold text-slate-400 hover:underline">Xóa</button>
            </div>
          </div>
          <DropdownMenuSeparator className="bg-slate-100 dark:bg-white/5" />
          <div className="max-h-[250px] overflow-y-auto py-1">
            {projects.map(project => (
              <DropdownMenuCheckboxItem
                key={project._id}
                checked={filters.projectIds.includes(project._id)}
                onCheckedChange={() => toggleProject(project._id)}
                className="rounded-xl py-2.5 font-medium"
              >
                {project.name}
              </DropdownMenuCheckboxItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Health Status Chips */}
      <div className="flex items-center gap-2 ml-auto pr-2">
        {['all', 'active', 'at-risk', 'completed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilters({ ...filters, healthStatus: status as any })}
            className={cn(
              "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all border",
              filters.healthStatus === status 
                ? "bg-[#035D5B] dark:bg-[#C7F964] text-white dark:text-[#035D5B] border-transparent shadow-glow-sm" 
                : "bg-transparent text-slate-400 border-slate-200 dark:border-white/10 hover:border-slate-400"
            )}
          >
            {status === 'all' ? 'Tất cả sức khỏe' : status}
          </button>
        ))}
      </div>
    </div>
  );
};
