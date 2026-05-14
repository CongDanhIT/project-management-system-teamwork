import React from 'react';
import { 
  Calendar, 
  ChevronDown, 
  Layers, 
  CheckCircle2,
  Infinity
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface FilterState {
  year: number; // 0 = ALL (toàn bộ lịch sử workspace)
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
  const currentYear = new Date().getFullYear();
  // Sinh danh sách năm động: từ 2020 đến năm hiện tại + 1
  const years = React.useMemo(() => {
    const startYear = 2020;
    const endYear = currentYear + 1;
    return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
  }, [currentYear]);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const quarters = [1, 2, 3, 4];

  const isAllMode = filters.year === 0;

  // State tạm thời để chọn nhiều dự án trước khi áp dụng
  const [tempProjectIds, setTempProjectIds] = React.useState<string[]>(filters.projectIds);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = React.useState(false);

  // Đồng bộ lại tempProjectIds mỗi khi dropdown mở
  React.useEffect(() => {
    if (isProjectDropdownOpen) {
      setTempProjectIds(filters.projectIds);
    }
  }, [isProjectDropdownOpen, filters.projectIds]);

  const handleAllMode = () => {
    if (isAllMode) {
      // Nếu đang ở chế độ All, thoát ra bằng cách quay về năm và kỳ hiện tại
      setFilters(prev => ({
        ...prev,
        year: currentYear,
        periodValue: prev.periodType === 'month' 
          ? new Date().getMonth() + 1 
          : Math.ceil((new Date().getMonth() + 1) / 3)
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        year: 0,
        periodValue: 0
      }));
    }
  };

  const handleYearChange = (year: number) => {
    setFilters(prev => ({
      ...prev,
      year,
      // Khi chuyển từ All sang năm cụ thể, reset period về hiện tại
      periodValue: year === currentYear
        ? (prev.periodType === 'month' ? new Date().getMonth() + 1 : Math.ceil((new Date().getMonth() + 1) / 3))
        : (prev.periodType === 'month' ? 1 : 1)
    }));
  };

  const handlePeriodTypeChange = (type: 'month' | 'quarter') => {
    if (isAllMode) return;
    setFilters(prev => ({ 
      ...prev, 
      periodType: type, 
      periodValue: type === 'month' ? new Date().getMonth() + 1 : Math.ceil((new Date().getMonth() + 1) / 3)
    }));
  };

  const handlePeriodValueChange = (value: number) => {
    if (isAllMode) return;
    setFilters(prev => ({ ...prev, periodValue: value }));
  };

  const toggleProject = (projectId: string) => {
    setTempProjectIds(prev => 
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const selectAllProjects = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTempProjectIds(projects.map(p => p._id));
  };

  const clearProjects = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTempProjectIds([]);
  };

  const applyProjectFilter = () => {
    setFilters(prev => ({ ...prev, projectIds: tempProjectIds }));
    setIsProjectDropdownOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-4 p-2 bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-[32px] shadow-depth-1">
      {/* ALL Mode Toggle */}
      <button
        onClick={handleAllMode}
        className={cn(
          "inline-flex items-center justify-center rounded-full h-10 px-5 font-black text-[10px] uppercase tracking-widest transition-all border",
          isAllMode
            ? "bg-[#035D5B] dark:bg-[#C7F964] text-white dark:text-[#035D5B] border-transparent shadow-glow-sm"
            : "bg-transparent text-slate-400 border-slate-200 dark:border-white/10 hover:border-[#035D5B]/40 hover:text-[#035D5B] dark:hover:text-[#C7F964]"
        )}
        title={isAllMode ? "Click để thoát chế độ xem toàn bộ" : "Lấy toàn bộ dữ liệu từ khi workspace được tạo"}
      >
        <Infinity className="w-4 h-4 mr-2" />
        {isAllMode ? "Đang xem tất cả" : "Tất cả"}
      </button>

      <div className="h-6 w-[1px] bg-slate-300/30 mx-1 hidden md:block" />

      {/* Year Selector */}
      <DropdownMenu>
      <DropdownMenuTrigger disabled={isAllMode}>
        <div className={cn(
          "inline-flex items-center justify-center rounded-full h-10 px-4 font-bold transition-colors",
          isAllMode
            ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
            : "text-[#035D5B] dark:text-[#C7F964] hover:bg-white/40 dark:hover:bg-white/5 cursor-pointer"
        )}>
          <Calendar className="w-4 h-4 mr-2 opacity-60" />
          {isAllMode ? 'Toàn bộ' : `Năm ${filters.year}`}
          {!isAllMode && <ChevronDown className="w-4 h-4 ml-2 opacity-40" />}
        </div>
      </DropdownMenuTrigger>
        <DropdownMenuContent className="rounded-2xl border-none shadow-depth-3 bg-white dark:bg-[#1C2322] max-h-[300px] overflow-y-auto min-w-[140px]">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">
              Chọn năm
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-100 dark:bg-white/5" />
            {years.map(y => (
              <DropdownMenuItem 
                key={y} 
                onClick={() => handleYearChange(y)} 
                className={cn(
                  "rounded-xl font-bold",
                  filters.year === y && "text-[#035D5B] dark:text-[#C7F964] bg-teal-50 dark:bg-teal-900/20"
                )}
              >
                Năm {y}
                {y === currentYear && (
                  <Badge className="ml-auto text-[7px] font-black bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 border-none px-1.5 py-0">
                    Hiện tại
                  </Badge>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="h-6 w-[1px] bg-slate-300/30 mx-1 hidden md:block" />

      {/* Period Type Switcher */}
      <div className={cn(
        "flex p-1 rounded-full border",
        isAllMode
          ? "bg-slate-100/30 dark:bg-white/[0.02] border-slate-100 dark:border-white/5"
          : "bg-slate-200/50 dark:bg-white/5 border-white/10"
      )}>
        <button
          onClick={() => handlePeriodTypeChange('month')}
          disabled={isAllMode}
          className={cn(
            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
            isAllMode
              ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
              : filters.periodType === 'month' 
                ? "bg-white dark:bg-[#C7F964] text-[#035D5B] shadow-sm" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
          )}
        >
          Tháng
        </button>
        <button
          onClick={() => handlePeriodTypeChange('quarter')}
          disabled={isAllMode}
          className={cn(
            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
            isAllMode
              ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
              : filters.periodType === 'quarter' 
                ? "bg-white dark:bg-[#C7F964] text-[#035D5B] shadow-sm" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
          )}
        >
          Quý
        </button>
      </div>

      {/* Period Value Selector */}
      <DropdownMenu>
      <DropdownMenuTrigger disabled={isAllMode}>
        <div className={cn(
          "inline-flex items-center justify-center rounded-full h-10 px-4 font-bold transition-colors",
          isAllMode
            ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
            : "text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/5 cursor-pointer"
        )}>
          {isAllMode
            ? 'Toàn kỳ'
            : filters.periodType === 'month' 
              ? (filters.periodValue === 0 ? 'Cả năm' : `Tháng ${filters.periodValue}`) 
              : `Quý ${filters.periodValue}`
          }
          {!isAllMode && <ChevronDown className="w-4 h-4 ml-2 opacity-40" />}
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
      <DropdownMenu open={isProjectDropdownOpen} onOpenChange={setIsProjectDropdownOpen}>
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
              <button onClick={(e) => selectAllProjects(e)} className="text-[10px] font-bold text-teal-600 hover:underline">Tất cả</button>
              <button onClick={(e) => clearProjects(e)} className="text-[10px] font-bold text-slate-400 hover:underline">Xóa</button>
            </div>
          </div>
          <DropdownMenuSeparator className="bg-slate-100 dark:bg-white/5" />
          <div className="max-h-[250px] overflow-y-auto py-1">
            {projects.map(project => (
              <DropdownMenuCheckboxItem
                key={String(project._id)}
                checked={tempProjectIds.includes(String(project._id))}
                onCheckedChange={() => toggleProject(String(project._id))}
                onSelect={(e) => e.preventDefault()} // Ngăn menu đóng khi chọn
                className="rounded-xl py-2.5 font-medium cursor-pointer"
              >
                {project.name}
              </DropdownMenuCheckboxItem>
            ))}
          </div>
          <DropdownMenuSeparator className="bg-slate-100 dark:bg-white/5" />
          <div className="p-2">
            <Button 
              onClick={applyProjectFilter}
              className="w-full rounded-xl bg-[#035D5B] dark:bg-[#C7F964] text-white dark:text-[#035D5B] font-black uppercase text-[10px] tracking-widest h-9 hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-glow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Áp dụng thay đổi
            </Button>
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
