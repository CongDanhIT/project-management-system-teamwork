"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getWorkspaceRoadmap } from "@/services/roadmap.service";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay,
  isToday,
  isWeekend,
  differenceInDays,
  startOfDay,
  addDays,
  isWithinInterval,
  getDaysInMonth
} from "date-fns";
import { vi } from "date-fns/locale";
import { 
  Map, 
  ChevronLeft, 
  ChevronRight, 
  PanelRightOpen, 
  Info,
  Calendar as CalendarIcon,
  Filter,
  Search,
  Plus,
  LayoutGrid,
  MoreHorizontal,
  ExternalLink,
  Target,
  Inbox,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import Loader from "@/components/ui/Loader";
import { cn } from "@/lib/utils";

const COLUMN_WIDTH = 40;
const ROW_HEIGHT = 48;

export default function RoadmapPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params?.workspaceId as string;
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["workspace-roadmap", workspaceId],
    queryFn: () => getWorkspaceRoadmap(workspaceId),
  });

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Cuộn đến ngày hiện tại nếu đang ở tháng hiện tại
  useEffect(() => {
    if (isToday(new Date()) && format(currentMonth, 'MM-yyyy') === format(new Date(), 'MM-yyyy')) {
      const todayIndex = new Date().getDate() - 1;
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = (todayIndex * COLUMN_WIDTH) - 200;
      }
    }
  }, [currentMonth, isLoading]);

  const { projects = [], tasks: allTasks = [], unscheduledTasks = [], phases: allPhases = [] } = data || {};
 
  // Lọc task chỉ hiển thị những cái có trong tháng hiện tại để tối ưu không gian
  const tasks = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    return allTasks.filter((task: any) => {
      const startRaw = task.startDate ? new Date(task.startDate) : (task.dueDate ? new Date(task.dueDate) : null);
      const endRaw = task.dueDate ? new Date(task.dueDate) : (task.startDate ? new Date(task.startDate) : null);
      
      if (!startRaw || !endRaw || isNaN(startRaw.getTime()) || isNaN(endRaw.getTime())) return false;
      
      const start = startOfDay(startRaw);
      const end = startOfDay(endRaw);
      
      // Kiểm tra giao thoa với tháng hiện tại
      return start <= monthEnd && end >= monthStart;
    });
  }, [allTasks, currentMonth]);

  const phasesInMonth = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    return allPhases.map((phase: any) => {
      let pStart = phase.startDate ? new Date(phase.startDate) : null;
      let pEnd = phase.endDate ? new Date(phase.endDate) : null;

      // Nếu thiếu ngày, tính toán dựa trên tasks trong phase đó
      if (!pStart || !pEnd) {
        const phaseTasks = allTasks.filter((t: any) => (t.phaseId?._id?.toString() || t.phaseId?.toString()) === phase._id?.toString());
        
        phaseTasks.forEach((t: any) => {
          const tStart = t.startDate ? new Date(t.startDate) : (t.dueDate ? new Date(t.dueDate) : null);
          const tEnd = t.dueDate ? new Date(t.dueDate) : (t.startDate ? new Date(t.startDate) : null);
          
          if (tStart && (!pStart || tStart < pStart)) pStart = tStart;
          if (tEnd && (!pEnd || tEnd > pEnd)) pEnd = tEnd;
        });
      }

      return { ...phase, calculatedStart: pStart, calculatedEnd: pEnd };
    }).filter((phase: any) => {
      if (!phase.calculatedStart || !phase.calculatedEnd) return false;
      const start = startOfDay(phase.calculatedStart);
      const end = startOfDay(phase.calculatedEnd);
      return start <= monthEnd && end >= monthStart;
    });
  }, [allPhases, allTasks, currentMonth]);

  const handleNavigateToProject = (projectId: string) => {
    router.push(`/workspace/${workspaceId}/projects/${projectId}/phases`);
  };

  if (isLoading) return <div className="h-full flex items-center justify-center"><Loader /></div>;

  return (
    <div className="h-full flex flex-col bg-background text-foreground overflow-hidden">
      {/* Header */}
      <header className="p-6 border-b border-border flex items-center justify-between bg-background/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/5 rounded-2xl border border-primary/10">
            <Map className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Lộ trình Workspace</h1>
            <p className="text-sm text-muted-foreground">Tổng quan kế hoạch toàn bộ dự án</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted/50 rounded-xl border border-border p-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="h-8 w-8 hover:bg-background shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="px-4 text-sm font-medium min-w-[140px] text-center">
              {format(currentMonth, "MMMM, yyyy", { locale: vi })}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="h-8 w-8 hover:bg-background shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Button 
            variant="outline" 
            onClick={() => setCurrentMonth(new Date())}
            className="border-border bg-background shadow-sm hover:bg-muted"
          >
            Hôm nay
          </Button>

          <div className="h-6 w-px bg-border mx-2" />

          <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <SheetTrigger 
              render={
                <Button variant="outline" className="gap-2 border-border bg-background shadow-sm hover:bg-muted">
                  <Inbox className="w-4 h-4" />
                  <span>Chưa xếp lịch</span>
                  {unscheduledTasks.length > 0 && (
                    <Badge className="ml-1 bg-primary/10 text-primary border-none px-1.5 h-5 min-w-5 flex items-center justify-center">
                      {unscheduledTasks.length}
                    </Badge>
                  )}
                </Button>
              }
            />
            <SheetContent className="bg-background border-l border-border text-foreground w-[400px]">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-foreground flex items-center gap-2">
                  <Inbox className="w-5 h-5 text-muted-foreground" />
                  Công việc chưa xếp lịch
                </SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-120px)]">
                <div className="space-y-3 pr-4">
                  {unscheduledTasks.length === 0 ? (
                    <div className="py-20 text-center space-y-3 opacity-40">
                      <Clock className="w-12 h-12 mx-auto" />
                      <p>Mọi công việc đã được xếp lịch</p>
                    </div>
                  ) : (
                    unscheduledTasks.map((task: any) => (
                      <div 
                        key={task._id} 
                        className="p-4 rounded-2xl bg-card border border-border hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-muted border-none text-muted-foreground">
                            {task.taskCode}
                          </Badge>
                          <Avatar className="h-6 w-6 border border-background">
                             <AvatarImage src={task.assignedTo?.[0]?.profilePicture} />
                             <AvatarFallback className="text-[8px] bg-primary text-primary-foreground">{task.assignedTo?.[0]?.name?.[0]}</AvatarFallback>
                          </Avatar>
                        </div>
                        <h4 className="text-sm font-medium mb-2 group-hover:text-primary transition-colors">{task.title}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">
                            Dự án: {task.projectId?.name} {task.phaseId && `| Phase: ${task.phaseId.name}`}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Timeline Grid */}
      <div className="flex-1 overflow-hidden relative flex">
        {/* Project List Sidebar (Fixed) */}
        <div className="w-[290px] border-r border-border flex flex-col bg-background z-10 shrink-0">
          <div className="h-12 border-b border-border flex items-center px-6">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Dự án & Công việc</span>
          </div>
          <ScrollArea className="flex-1">
            <div className="py-3">
              {projects.map((project: any) => {
                const projectTasks = tasks.filter((t: any) => (t.projectId?._id?.toString() || t.projectId?.toString()) === project._id?.toString());
                return (
                  <div key={project._id} className="mb-4">
                    <div 
                      className="h-12 px-6 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer group transition-all duration-200 border-l-2 border-l-transparent hover:border-l-primary"
                      onClick={() => handleNavigateToProject(project._id)}
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0 shadow-sm border border-slate-200/10">
                        <span className="text-base">{project.emoji || "🎯"}</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate flex-1">{project.name}</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-opacity text-slate-400" />
                    </div>
                    {/* Tasks of this project */}
                    {projectTasks.map((task: any) => (
                      <div 
                        key={task._id} 
                        className="h-12 ml-6 mr-2 pl-4 pr-3 flex items-center rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 group transition-all duration-200 cursor-pointer border-l-2 border-l-transparent hover:border-l-primary/60"
                        onClick={() => handleNavigateToProject(project._id)}
                      >
                        <Badge 
                          variant="outline" 
                          className="text-[9px] font-bold tracking-tighter px-1.5 py-0.5 rounded-md mr-2.5 shrink-0 bg-slate-100/50 dark:bg-white/5 border-none text-slate-400 dark:text-slate-500 font-mono"
                        >
                          {task.taskCode}
                        </Badge>
                        <span className="text-xs truncate text-slate-500 dark:text-slate-400 font-medium group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors flex-1">
                          {task.title}
                        </span>
                        {task.assignedTo?.[0] && (
                          <Avatar className="h-5 w-5 border border-white dark:border-slate-900 shadow-sm shrink-0 ml-2">
                            <AvatarImage src={task.assignedTo[0].profilePicture} />
                            <AvatarFallback className="text-[7px] bg-slate-200 dark:bg-slate-800 text-slate-500 font-bold">
                              {task.assignedTo[0].name?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Calendar Grid (Scrollable) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea ref={scrollRef} className="flex-1">
            <div 
              className="relative min-h-full" 
              style={{ width: days.length * COLUMN_WIDTH }}
            >
              {/* Day Headers */}
              <div className="h-12 border-b border-border flex sticky top-0 bg-background z-10">
                {days.map((day) => (
                  <div 
                    key={day.toString()} 
                    className={cn(
                      "flex flex-col items-center justify-center border-r border-border",
                      isWeekend(day) && "bg-muted/30"
                    )}
                    style={{ width: COLUMN_WIDTH }}
                  >
                    <span className={cn(
                      "text-[10px] uppercase font-medium",
                      isToday(day) ? "text-primary" : "text-muted-foreground/40"
                    )}>
                      {format(day, "eee", { locale: vi })}
                    </span>
                    <span className={cn(
                      "text-xs font-bold",
                      isToday(day) ? "text-primary" : "text-foreground/60"
                    )}>
                      {format(day, "d")}
                    </span>
                  </div>
                ))}
              </div>

              {/* Vertical Grid Lines */}
              <div className="absolute inset-y-0 left-0 right-0 pointer-events-none flex">
                {days.map((day) => (
                  <div 
                    key={day.toString()} 
                    className={cn(
                      "h-full border-r border-border",
                      isWeekend(day) && "bg-muted/10"
                    )}
                    style={{ width: COLUMN_WIDTH }}
                  />
                ))}
              </div>

              {/* Today Marker */}
              {format(currentMonth, 'MM-yyyy') === format(new Date(), 'MM-yyyy') && (
                <div 
                  className="absolute inset-y-0 z-10 w-px bg-rose-500/30 pointer-events-none"
                  style={{ left: (new Date().getDate() - 1) * COLUMN_WIDTH + (COLUMN_WIDTH / 2) }}
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)] mt-12" />
                </div>
              )}

              {/* Content Rows */}
              <div className="py-2">
                {projects.map((project: any) => (
                  <div key={project._id} className="mb-4 relative">
                    {/* Project timeline background row */}
                    <div className="h-12 relative border-b border-border/30">
                      {/* Phase Shading */}
                      {phasesInMonth
                        .filter((phase: any) => (phase.projectId?._id?.toString() || phase.projectId?.toString()) === project._id?.toString())
                        .map((phase: any) => {
                          const pStart = startOfDay(new Date(phase.calculatedStart));
                          const pEnd = startOfDay(new Date(phase.calculatedEnd));
                          const monthStart = startOfMonth(currentMonth);
                          const monthEnd = endOfMonth(currentMonth);
                          
                          const barStart = pStart < monthStart ? monthStart : pStart;
                          const barEnd = pEnd > monthEnd ? monthEnd : pEnd;
                          
                          const startOffset = differenceInDays(barStart, monthStart);
                          const duration = differenceInDays(barEnd, barStart) + 1;
                          
                          return (
                            <div 
                              key={phase._id}
                              className="absolute inset-y-0 bg-primary/[0.03] border-x border-primary/10 flex items-start justify-start px-2 py-1"
                              style={{ 
                                left: startOffset * COLUMN_WIDTH, 
                                width: duration * COLUMN_WIDTH 
                              }}
                            >
                              <span className="text-[8px] font-bold uppercase text-primary/30 truncate tracking-tighter">
                                {phase.name}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                    
                    {/* Tasks within project */}
                    {tasks.filter((t: any) => (t.projectId?._id?.toString() || t.projectId?.toString()) === project._id?.toString()).map((task: any) => {
                      const startDateRaw = task.startDate ? new Date(task.startDate) : (task.dueDate ? new Date(task.dueDate) : null);
                      const endDateRaw = task.dueDate ? new Date(task.dueDate) : (task.startDate ? new Date(task.startDate) : null);
                      
                      if (!startDateRaw || !endDateRaw || isNaN(startDateRaw.getTime()) || isNaN(endDateRaw.getTime())) return null;

                      const startDate = startOfDay(startDateRaw);
                      const endDate = startOfDay(endDateRaw);

                      // Tháng hiện tại
                      const monthStart = startOfMonth(currentMonth);
                      const monthEnd = endOfMonth(currentMonth);

                      // Logic kiểm tra giao thoa: Task bắt đầu trước khi tháng kết thúc VÀ kết thúc sau khi tháng bắt đầu
                      const isTaskInMonth = startDate <= monthEnd && endDate >= monthStart;

                      if (!isTaskInMonth) return null;

                      // Tính toán vị trí hiển thị thực tế trên thanh timeline (cắt bớt nếu tràn lề tháng)
                      const barStart = startDate < monthStart ? monthStart : startDate;
                      const barEnd = endDate > monthEnd ? monthEnd : endDate;
                      
                      const startOffset = differenceInDays(barStart, monthStart);
                      const displayDuration = differenceInDays(barEnd, barStart) + 1;

                      const isOverdue = task.status !== "DONE" && endDate < startOfDay(new Date());

                      return (
                        <div key={task._id} className="h-12 relative flex items-center border-b border-border/5">
                          <TooltipProvider>
                            <Tooltip delayDuration={0}>
                              <TooltipTrigger asChild>
                                <motion.div 
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className={cn(
                                    "absolute h-7 rounded-full flex items-center px-1 border group cursor-pointer hover:scale-[1.02] transition-transform",
                                    task.status === "DONE" ? "bg-emerald-500/10 border-emerald-500/20" : 
                                    isOverdue ? "bg-amber-500/10 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]" :
                                    task.priority === "HIGH" ? "bg-rose-500/10 border-rose-500/20" : 
                                    "bg-primary/10 border-primary/20"
                                  )}
                                  style={{ 
                                    left: startOffset * COLUMN_WIDTH + 4,
                                    width: displayDuration * COLUMN_WIDTH - 8
                                  }}
                                  onClick={() => handleNavigateToProject(project._id)}
                                >
                                  <div className={cn(
                                    "w-1.5 h-1.5 rounded-full ml-2",
                                    task.status === "DONE" ? "bg-emerald-500" : 
                                    isOverdue ? "bg-amber-500 animate-pulse" :
                                    task.priority === "HIGH" ? "bg-rose-500" : 
                                    "bg-primary"
                                  )} />
                                  <Avatar className="h-5 w-5 ml-auto border border-background">
                                    <AvatarImage src={task.assignedTo?.[0]?.profilePicture} />
                                    <AvatarFallback className="text-[6px] bg-muted text-muted-foreground">
                                      {task.assignedTo?.[0]?.name?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                </motion.div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="bg-popover border-border text-popover-foreground p-3 rounded-xl shadow-2xl">
                                <div className="space-y-2 min-w-[200px]">
                                  <div className="flex items-center justify-between gap-4">
                                    <Badge variant="outline" className="text-[10px] uppercase bg-muted border-none">
                                      {task.taskCode}
                                    </Badge>
                                    <Badge className={cn(
                                      "text-[10px] px-1.5 h-5",
                                      task.status === "DONE" ? "bg-emerald-500/20 text-emerald-400" : "bg-primary/20 text-primary"
                                    )}>
                                      {task.status}
                                    </Badge>
                                  </div>
                                  <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
                                   <div className="flex flex-col gap-1 text-[10px] text-muted-foreground pt-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                        <span>Dự án: <span className="text-foreground/70 font-medium">{task.projectId?.name}</span></span>
                                      </div>
                                      {task.phaseId && (
                                        <div className="flex items-center gap-1.5">
                                          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                          <span>Giai đoạn: <span className="text-foreground/70 font-medium">{task.phaseId.name}</span></span>
                                        </div>
                                      )}
                                   </div>

                                   <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
                                     <div className="flex items-center gap-1">
                                       <CalendarIcon className="w-3 h-3" />
                                       {format(startDate, "d MMM")} - {format(endDate, "d MMM")}
                                     </div>
                                     <div className="flex items-center gap-1">
                                       {task.assignedTo?.[0]?.name}
                                     </div>
                                   </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <ScrollBar orientation="horizontal" className="bg-muted" />
          </ScrollArea>
        </div>
      </div>
      
      {/* Footer Info */}
      <footer className="h-10 px-6 border-t border-border bg-background flex items-center gap-6 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span>Kế hoạch</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rose-500" />
          <span>Ưu tiên cao</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Hoàn thành</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Quá hạn</span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <Info className="w-3 h-3" />
          <span>Di chuột vào thanh công việc để xem chi tiết</span>
        </div>
      </footer>
    </div>
  );
}
