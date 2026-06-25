"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getWorkspaceRoadmap } from "@/services/roadmap.service";
import { workspaceService } from "@/services/workspace.service";
import { taskService } from "@/services/task.service";
import { toast } from "sonner";
import { toast } from "sonner";
import dynamic from 'next/dynamic';
import { Rnd } from 'react-rnd';
import { DndContext, DragEndEvent, useDroppable, useDraggable, DragOverlay } from '@dnd-kit/core';

const TaskDetailModal = dynamic(() => import('@/components/task/TaskDetailModal').then(mod => mod.TaskDetailModal), {
  ssr: false,
});
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
  getDaysInMonth,
  startOfWeek,
  endOfWeek,
  startOfQuarter,
  endOfQuarter,
  addWeeks,
  subWeeks,
  addQuarters,
  subQuarters
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Loader from "@/components/ui/Loader";
import { cn } from "@/lib/utils";
const ROW_HEIGHT = 48;

function DroppableRow({ id, children, className }: any) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={cn(className, isOver && "bg-primary/5")}>
      {children}
    </div>
  );
}

function DraggableTask({ task, onClick }: any) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task._id,
    data: task,
  });
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";
  let badgeColorClass = "bg-blue-100/80 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400";
  if (task.status === "DONE") badgeColorClass = "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400";
  else if (isOverdue) badgeColorClass = "bg-amber-100/80 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400";
  else if (task.priority === "HIGH") badgeColorClass = "bg-rose-100/80 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "p-3 rounded-xl bg-card border hover:border-primary/20 hover:shadow-md transition-all cursor-grab active:cursor-grabbing group flex flex-col gap-1.5",
        isDragging ? "shadow-xl border-primary ring-2 ring-primary/20 opacity-50 z-50" : "border-border"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant="outline" className={cn("text-[9px] uppercase tracking-wider border-none px-1.5 py-0 h-5 flex items-center", badgeColorClass)}>
            {task.taskCode}
          </Badge>
          <h4 className="text-xs font-semibold group-hover:text-primary transition-colors truncate">{task.title}</h4>
        </div>
        {task.assignedTo?.[0] && (
          <Avatar className="h-5 w-5 border border-background shrink-0">
            <AvatarImage src={task.assignedTo[0].profilePicture} />
            <AvatarFallback className="text-[7px] bg-primary text-primary-foreground font-bold">{task.assignedTo[0].name?.[0]}</AvatarFallback>
          </Avatar>
        )}
      </div>
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground pointer-events-none">
        <span className="truncate">
          <span className="font-medium text-foreground/70">{task.projectId?.name}</span> {task.phaseId && `| ${task.phaseId.name}`}
        </span>
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params?.workspaceId as string;
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [zoomLevel, setZoomLevel] = useState<'week' | 'month' | 'quarter'>('month');
  const [groupBy, setGroupBy] = useState<'project' | 'resource'>('project');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  const getColWidth = () => {
    if (zoomLevel === 'week') return 150;
    if (zoomLevel === 'quarter') return 80;
    return 40; // month
  };
  const COLUMN_WIDTH = getColWidth();

  const scrollRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const { data: membersData } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => workspaceService.getMembers(workspaceId),
    enabled: !!workspaceId,
  });

  const handleDragResizeTask = async (task: any, newStartDate: Date, newDueDate: Date) => {
    // Optimistic Update
    queryClient.setQueryData(["workspace-roadmap", workspaceId], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        tasks: oldData.tasks.map((t: any) => 
          t._id === task._id 
            ? { ...t, startDate: newStartDate.toISOString(), dueDate: newDueDate.toISOString() } 
            : t
        )
      };
    });

    try {
      const pId = typeof task.projectId === 'object' ? task.projectId._id : task.projectId;
      await taskService.updateTask(workspaceId, pId || 'any', task._id, {
        startDate: newStartDate.toISOString(),
        dueDate: newDueDate.toISOString()
      });
      queryClient.invalidateQueries({ queryKey: ["workspace-roadmap", workspaceId] });
      toast.success("Đã cập nhật lịch trình");
    } catch (error) {
      toast.error("Không thể cập nhật lịch trình");
      queryClient.invalidateQueries({ queryKey: ["workspace-roadmap", workspaceId] });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, pointerCoordinates } = event;
    if (!over || !pointerCoordinates) return;
    
    const container = document.getElementById("timeline-grid-container");
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    // Use absolute X coordinate offset by scroll position
    const localX = pointerCoordinates.x - rect.left;
    
    let dayIndex = Math.floor(localX / COLUMN_WIDTH);
    if (dayIndex < 0) dayIndex = 0;
    if (dayIndex >= days.length) dayIndex = days.length - 1;

    const targetDay = startOfDay(days[dayIndex]);
    const taskId = String(active.id);
    const targetGroup = String(over.id).replace('row-', '');

    const task = unscheduledTasks.find((t: any) => t._id === taskId);
    if (!task) return;

    const newStartDate = targetDay;
    let newEndDate = addDays(newStartDate, zoomLevel === 'quarter' ? 7 : 1);

    const updates: any = {
      startDate: newStartDate.toISOString(),
      dueDate: newEndDate.toISOString()
    };
    
    if (groupBy === 'project') {
      updates.projectId = targetGroup;
    } else {
      updates.assignedTo = [targetGroup];
    }

    handleUpdateTask(taskId, updates);
  };

  const handleUpdateTask = async (taskId: string, data: any) => {
    try {
      const pId = typeof selectedTask?.projectId === 'object' ? selectedTask.projectId._id : selectedTask?.projectId;
      await taskService.updateTask(workspaceId, pId || 'any', taskId, data);
      queryClient.invalidateQueries({ queryKey: ["workspace-roadmap", workspaceId] });
      toast.success("Đã cập nhật công việc");
    } catch (error) {
      toast.error("Không thể cập nhật công việc");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const pId = typeof selectedTask?.projectId === 'object' ? selectedTask.projectId._id : selectedTask?.projectId;
      await taskService.deleteTask(workspaceId, pId || 'any', taskId);
      queryClient.invalidateQueries({ queryKey: ["workspace-roadmap", workspaceId] });
      setIsTaskModalOpen(false);
      toast.success("Đã xóa công việc");
    } catch (error) {
      toast.error("Không thể xóa công việc");
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ["workspace-roadmap", workspaceId],
    queryFn: () => getWorkspaceRoadmap(workspaceId),
  });

  const days = useMemo(() => {
    if (zoomLevel === 'week') {
      const start = startOfWeek(currentMonth, { weekStartsOn: 1 });
      const end = endOfWeek(currentMonth, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    }
    if (zoomLevel === 'month') {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      return eachDayOfInterval({ start, end });
    }
    if (zoomLevel === 'quarter') {
      const start = startOfQuarter(currentMonth);
      const end = endOfQuarter(currentMonth);
      const weeks = [];
      let current = startOfWeek(start, { weekStartsOn: 1 });
      while (current <= end) {
        weeks.push(current);
        current = addWeeks(current, 1);
      }
      return weeks;
    }
    return [];
  }, [currentMonth, zoomLevel]);

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

  const filteredProjects = useMemo(() => {
    if (selectedProjectIds.length === 0) return projects;
    return projects.filter((p: any) => selectedProjectIds.includes(String(p._id)));
  }, [projects, selectedProjectIds]);

  const filteredUnscheduledTasks = useMemo(() => {
    if (selectedProjectIds.length === 0) return unscheduledTasks;
    return unscheduledTasks.filter((t: any) => {
      const pId = typeof t.projectId === 'object' && t.projectId !== null
        ? (t.projectId._id || t.projectId.$oid)
        : t.projectId;
      return selectedProjectIds.includes(String(pId));
    });
  }, [unscheduledTasks, selectedProjectIds]);

  const { viewStart, viewEnd } = useMemo(() => {
    if (!days.length) return { viewStart: startOfMonth(currentMonth), viewEnd: endOfMonth(currentMonth) };
    const vs = days[0];
    let ve = days[days.length - 1];
    if (zoomLevel === 'quarter') {
      ve = endOfWeek(ve, { weekStartsOn: 1 });
    }
    return { viewStart: startOfDay(vs), viewEnd: endOfDay(ve) };
  }, [days, zoomLevel, currentMonth]);

  // Lọc task chỉ hiển thị những cái có trong khoảng thời gian hiện tại để tối ưu không gian
  const tasks = useMemo(() => {
    return allTasks.filter((task: any) => {
      const startRaw = task.startDate ? new Date(task.startDate) : (task.dueDate ? new Date(task.dueDate) : null);
      const endRaw = task.dueDate ? new Date(task.dueDate) : (task.startDate ? new Date(task.startDate) : null);

      if (!startRaw || !endRaw || isNaN(startRaw.getTime()) || isNaN(endRaw.getTime())) return false;

      const start = startOfDay(startRaw);
      const end = startOfDay(endRaw);

      // Kiểm tra giao thoa với khoảng thời gian hiện tại
      return start <= viewEnd && end >= viewStart;
    });
  }, [allTasks, viewStart, viewEnd]);

  const phasesInMonth = useMemo(() => {
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
      return start <= viewEnd && end >= viewStart;
    });
  }, [allPhases, allTasks, viewStart, viewEnd]);

  const displayGroups = useMemo(() => {
    if (groupBy === 'project') {
      return filteredProjects.map((project: any) => {
        const projectTasks = tasks.filter((t: any) => (t.projectId?._id?.toString() || t.projectId?.toString()) === project._id?.toString());
        return {
          id: project._id,
          name: project.name,
          icon: project.icon || "🎯",
          tasks: projectTasks,
          type: 'project'
        };
      });
    } else {
      const userMap = new Map();
      if (membersData) {
        membersData.forEach((m: any) => {
          userMap.set(m._id, {
            id: m._id,
            name: m.name,
            avatar: m.profilePicture,
            tasks: [],
            type: 'resource'
          });
        });
      }

      tasks.forEach((task: any) => {
        if (task.assignedTo && task.assignedTo.length > 0) {
          const user = task.assignedTo[0];
          const userId = user._id?.toString() || user.toString();
          if (!userMap.has(userId)) {
            userMap.set(userId, {
              id: userId,
              name: user.name || 'Unknown',
              avatar: user.profilePicture,
              tasks: [],
              type: 'resource'
            });
          }
          userMap.get(userId).tasks.push(task);
        } else {
          if (!userMap.has('unassigned')) {
            userMap.set('unassigned', {
              id: 'unassigned',
              name: 'Chưa phân công',
              avatar: null,
              tasks: [],
              type: 'resource'
            });
          }
          userMap.get('unassigned').tasks.push(task);
        }
      });

      return Array.from(userMap.values());
    }
  }, [groupBy, filteredProjects, tasks, membersData]);

  const getBarPosition = (startDate: Date, endDate: Date) => {
    const barStart = startDate < viewStart ? viewStart : startDate;
    const barEnd = endDate > viewEnd ? viewEnd : endDate;

    let startOffset = differenceInDays(barStart, viewStart);
    let duration = differenceInDays(barEnd, barStart) + 1;

    if (zoomLevel === 'quarter') {
      startOffset = startOffset / 7;
      duration = duration / 7;
    }

    return {
      left: startOffset * COLUMN_WIDTH,
      width: duration * COLUMN_WIDTH
    };
  };

  const handlePrevDate = () => {
    if (zoomLevel === 'week') setCurrentMonth(prev => subWeeks(prev, 1));
    else if (zoomLevel === 'month') setCurrentMonth(prev => subMonths(prev, 1));
    else if (zoomLevel === 'quarter') setCurrentMonth(prev => subQuarters(prev, 1));
  };

  const handleNextDate = () => {
    if (zoomLevel === 'week') setCurrentMonth(prev => addWeeks(prev, 1));
    else if (zoomLevel === 'month') setCurrentMonth(prev => addMonths(prev, 1));
    else if (zoomLevel === 'quarter') setCurrentMonth(prev => addQuarters(prev, 1));
  };

  const getDisplayDateText = () => {
    if (zoomLevel === 'week') {
      const start = startOfWeek(currentMonth, { weekStartsOn: 1 });
      const end = endOfWeek(currentMonth, { weekStartsOn: 1 });
      return `${format(start, "dd/MM")} - ${format(end, "dd/MM, yyyy")}`;
    }
    if (zoomLevel === 'quarter') {
      const q = Math.floor(currentMonth.getMonth() / 3) + 1;
      return `Quý ${q}, ${currentMonth.getFullYear()}`;
    }
    return format(currentMonth, "MMMM, yyyy", { locale: vi });
  };

  const handleNavigateToProject = (projectId: string) => {
    router.push(`/workspace/${workspaceId}/projects/${projectId}/phases`);
  };

  if (isLoading) return <div className="h-full flex items-center justify-center"><Loader /></div>;

  return (
    <DndContext onDragEnd={handleDragEnd}>
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
              onClick={handlePrevDate}
              className="h-8 w-8 hover:bg-background shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="px-4 text-sm font-medium min-w-[140px] text-center">
              {getDisplayDateText()}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextDate}
              className="h-8 w-8 hover:bg-background shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center bg-muted/50 rounded-xl border border-border p-1">
            <Button
              variant={zoomLevel === 'week' ? 'secondary' : 'ghost'}
              onClick={() => setZoomLevel('week')}
              className={cn("h-8 px-3 text-xs shadow-sm", zoomLevel === 'week' ? "bg-background text-foreground" : "hover:bg-background/50 text-muted-foreground")}
            >
              Tuần
            </Button>
            <Button
              variant={zoomLevel === 'month' ? 'secondary' : 'ghost'}
              onClick={() => setZoomLevel('month')}
              className={cn("h-8 px-3 text-xs shadow-sm", zoomLevel === 'month' ? "bg-background text-foreground" : "hover:bg-background/50 text-muted-foreground")}
            >
              Tháng
            </Button>
            <Button
              variant={zoomLevel === 'quarter' ? 'secondary' : 'ghost'}
              onClick={() => setZoomLevel('quarter')}
              className={cn("h-8 px-3 text-xs shadow-sm", zoomLevel === 'quarter' ? "bg-background text-foreground" : "hover:bg-background/50 text-muted-foreground")}
            >
              Quý
            </Button>
          </div>

          <div className="flex items-center bg-muted/50 rounded-xl border border-border p-1 mr-2">
            <Button
              variant={groupBy === 'project' ? 'secondary' : 'ghost'}
              onClick={() => setGroupBy('project')}
              className={cn("h-8 px-3 text-xs shadow-sm gap-2", groupBy === 'project' ? "bg-background text-primary" : "hover:bg-background/50 text-muted-foreground")}
            >
              <Target className="w-3.5 h-3.5" /> Dự án
            </Button>
            <Button
              variant={groupBy === 'resource' ? 'secondary' : 'ghost'}
              onClick={() => setGroupBy('resource')}
              className={cn("h-8 px-3 text-xs shadow-sm gap-2", groupBy === 'resource' ? "bg-background text-primary" : "hover:bg-background/50 text-muted-foreground")}
            >
              <Avatar className="w-4 h-4"><AvatarImage src="" /><AvatarFallback className="bg-primary/20 text-primary text-[8px]"><MoreHorizontal className="w-2 h-2"/></AvatarFallback></Avatar>
              Thành viên
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger className="w-[180px] h-9 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-xs shadow-sm flex items-center px-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 w-full min-w-0">
                <Filter className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="flex-1 text-left truncate">
                  {selectedProjectIds.length === 0
                    ? "Tất cả dự án"
                    : selectedProjectIds.length === 1 
                      ? projects.find((p: any) => String(p._id) === selectedProjectIds[0])?.name || "1 dự án"
                      : `${selectedProjectIds.length} dự án`}
                </span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px] rounded-2xl border-none shadow-lg bg-popover p-2 z-[9999]">
              <DropdownMenuCheckboxItem
                checked={selectedProjectIds.length === 0}
                onCheckedChange={() => setSelectedProjectIds([])}
                className="rounded-lg py-2.5 font-medium text-xs"
              >
                Tất cả dự án
              </DropdownMenuCheckboxItem>
              {projects.map((p: any) => (
                <DropdownMenuCheckboxItem
                  key={String(p._id)}
                  checked={selectedProjectIds.includes(String(p._id))}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedProjectIds((prev) => [...prev, String(p._id)]);
                    } else {
                      setSelectedProjectIds((prev) => prev.filter((id) => id !== String(p._id)));
                    }
                  }}
                  className="rounded-lg py-2.5 font-medium text-xs"
                >
                  {p.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

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
                  {filteredUnscheduledTasks.length > 0 && (
                    <Badge className="ml-1 bg-primary/10 text-primary border-none px-1.5 h-5 min-w-5 flex items-center justify-center">
                      {filteredUnscheduledTasks.length}
                    </Badge>
                  )}
                </Button>
              }
            />
            <SheetContent className="bg-background border-l border-border text-foreground !w-[400px] sm:!w-[400px] !max-w-[400px]">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-foreground flex items-center gap-2">
                  <Inbox className="w-5 h-5 text-muted-foreground" />
                  Công việc chưa xếp lịch
                </SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-120px)]">
                <div className="space-y-2 pr-4">
                  {filteredUnscheduledTasks.length === 0 ? (
                    <div className="py-20 text-center space-y-3 opacity-40">
                      <Clock className="w-12 h-12 mx-auto" />
                      <p>Mọi công việc đã được xếp lịch</p>
                    </div>
                  ) : (
                    filteredUnscheduledTasks.map((task: any) => (
                      <DraggableTask 
                        key={task._id} 
                        task={task} 
                        onClick={() => { setSelectedTask({ ...task, workspaceId }); setIsTaskModalOpen(true); }} 
                      />
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
              {displayGroups.map((group: any) => {
                const groupTasks = group.tasks;
                return (
                  <div key={group.id} className="mb-4">
                    <div
                      className="h-12 px-6 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer group transition-all duration-200 border-l-2 border-l-transparent hover:border-l-primary relative overflow-hidden"
                      onClick={() => group.type === 'project' && handleNavigateToProject(group.id)}
                    >
                      {group.type === 'resource' && group.avatar !== undefined ? (
                        <Avatar className="w-6 h-6 border border-white dark:border-slate-900 shadow-sm shrink-0 relative z-10">
                          <AvatarImage src={group.avatar} />
                          <AvatarFallback className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-500 font-bold">
                            {group.name?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0 relative z-10" />
                      )}
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate flex-1 relative z-10">{group.name}</span>
                      {group.type === 'project' && <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-opacity text-slate-400 relative z-10" />}
                      
                      {group.type === 'project' && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[44px] opacity-[0.03] group-hover:opacity-10 group-hover:scale-110 group-hover:-translate-x-2 transition-all duration-500 ease-out pointer-events-none select-none z-0 grayscale group-hover:grayscale-0">
                          {group.icon}
                        </div>
                      )}
                    </div>
                    {/* Tasks of this project/resource */}
                    <div className="relative">
                    {groupTasks.map((task: any, index: number) => {
                      const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";
                      let badgeColorClass = "bg-blue-100/80 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400";
                      if (task.status === "DONE") badgeColorClass = "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400";
                      else if (isOverdue) badgeColorClass = "bg-amber-100/80 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400";
                      else if (task.priority === "HIGH") badgeColorClass = "bg-rose-100/80 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400";

                      return (
                        <div
                          key={task._id}
                          className="h-12 ml-10 mr-2 pl-3 pr-3 flex items-center rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 group transition-all duration-200 cursor-pointer relative"
                          onClick={() => group.type === 'project' && handleNavigateToProject(group.id)}
                        >
                          {/* Tree guide lines */}
                          <div className={cn(
                            "absolute left-[-13px] top-0 w-px bg-border",
                            index === groupTasks.length - 1 ? "bottom-1/2" : "bottom-0"
                          )} />
                          <div className="absolute left-[-13px] top-1/2 w-3 h-px bg-border" />

                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] font-bold tracking-tighter px-1.5 py-0.5 rounded-md mr-2.5 shrink-0 border-none font-mono",
                              badgeColorClass
                            )}
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
                      );
                    })}
                    </div>
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
              id="timeline-grid-container"
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
                  className="absolute inset-y-0 z-10 w-[1.5px] bg-primary/30 pointer-events-none"
                  style={{ left: (new Date().getDate() - 1) * COLUMN_WIDTH + (COLUMN_WIDTH / 2) }}
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-primary text-[9px] font-bold text-white shadow-[0_0_10px_rgba(3,93,91,0.4)] mt-2 tracking-widest uppercase">
                    Hôm nay
                  </div>
                </div>
              )}

              {/* Content Rows */}
              <div className="py-2">
                {displayGroups.map((group: any) => (
                  <DroppableRow id={`row-${group.id}`} key={group.id} className="mb-4 relative">
                    {/* Project timeline background row */}
                    <div className="h-12 relative border-b border-border/30">
                      {/* Phase Shading */}
                      {group.type === 'project' && phasesInMonth
                        .filter((phase: any) => (phase.projectId?._id?.toString() || phase.projectId?.toString()) === group.id?.toString())
                        .map((phase: any) => {
                          const pStart = startOfDay(new Date(phase.calculatedStart));
                          const pEnd = startOfDay(new Date(phase.calculatedEnd));
                          
                          const pos = getBarPosition(pStart, pEnd);

                          return (
                            <div
                              key={phase._id}
                              className="absolute inset-y-0 bg-primary/[0.03] border-x border-primary/10 flex items-start justify-start px-2 py-1"
                              style={{
                                left: pos.left,
                                width: pos.width
                              }}
                            >
                              <span className="text-[8px] font-bold uppercase text-primary/30 truncate tracking-tighter">
                                {phase.name}
                              </span>
                            </div>
                          );
                        })}

                      {/* Resource Overload Heatmap */}
                      {group.type === 'resource' && days.map((day) => {
                        const dayStart = startOfDay(day);
                        let dayEnd = endOfDay(day);
                        if (zoomLevel === 'quarter') {
                          dayEnd = endOfDay(endOfWeek(day, { weekStartsOn: 1 }));
                        }

                        // Tính số task song song
                        const activeTasks = group.tasks.filter((t: any) => {
                          const tStartRaw = t.startDate ? new Date(t.startDate) : (t.dueDate ? new Date(t.dueDate) : null);
                          const tEndRaw = t.dueDate ? new Date(t.dueDate) : (t.startDate ? new Date(t.startDate) : null);
                          if (!tStartRaw || !tEndRaw || isNaN(tStartRaw.getTime()) || isNaN(tEndRaw.getTime())) return false;
                          
                          const tStart = startOfDay(tStartRaw);
                          const tEnd = startOfDay(tEndRaw);
                          
                          return tStart <= dayEnd && tEnd >= dayStart;
                        });

                        // 3 tasks song song là quá tải
                        if (activeTasks.length >= 3) {
                          const pos = getBarPosition(dayStart, dayEnd);
                          return (
                            <div
                              key={`heat-${day.toString()}`}
                              className="absolute inset-y-0 bg-rose-500/10 border-x border-rose-500/20"
                              style={{
                                left: pos.left,
                                width: pos.width
                              }}
                            >
                              <div className="absolute inset-x-0 bottom-1 flex justify-center">
                                <span className="text-[9px] font-bold text-rose-500 opacity-60">Overload</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>

                    {/* Tasks within project/resource */}
                    {group.tasks.map((task: any) => {
                      const startDateRaw = task.startDate ? new Date(task.startDate) : (task.dueDate ? new Date(task.dueDate) : null);
                      const endDateRaw = task.dueDate ? new Date(task.dueDate) : (task.startDate ? new Date(task.startDate) : null);

                      if (!startDateRaw || !endDateRaw || isNaN(startDateRaw.getTime()) || isNaN(endDateRaw.getTime())) return null;

                      const startDate = startOfDay(startDateRaw);
                      const endDate = startOfDay(endDateRaw);

                      // Logic kiểm tra giao thoa: Task bắt đầu trước khi viewEnd VÀ kết thúc sau khi viewStart
                      const isTaskInView = startDate <= viewEnd && endDate >= viewStart;

                      if (!isTaskInView) return null;

                      const pos = getBarPosition(startDate, endDate);
                      const isOverdue = task.status !== "DONE" && endDate < startOfDay(new Date());

                      return (
                        <div key={task._id} className="h-12 relative flex items-center border-b border-border/5">
                          <TooltipProvider>
                            <Tooltip delayDuration={0}>
                              <TooltipTrigger asChild>
                                <div className="absolute inset-y-0" style={{ left: pos.left, width: pos.width }}>
                                  <Rnd
                                    dragAxis="x"
                                    bounds="parent"
                                    enableResizing={{ left: true, right: true, top: false, bottom: false, topLeft: false, topRight: false, bottomLeft: false, bottomRight: false }}
                                    position={{ x: 4, y: 10 }}
                                    size={{ width: pos.width - 8, height: 28 }}
                                    onDragStop={(e, d) => {
                                      const deltaX = d.x - 4;
                                      let daysShifted = Math.round(deltaX / COLUMN_WIDTH);
                                      if (zoomLevel === 'quarter') daysShifted *= 7;
                                      
                                      if (daysShifted !== 0) {
                                        const newStart = addDays(startDate, daysShifted);
                                        const newEnd = addDays(endDate, daysShifted);
                                        handleDragResizeTask(task, newStart, newEnd);
                                      }
                                    }}
                                    onResizeStop={(e, direction, ref, delta, position) => {
                                      let newStart = startDate;
                                      let newEnd = endDate;
                                      
                                      if (direction === 'left') {
                                        const deltaX = position.x - 4;
                                        let daysShifted = Math.round(deltaX / COLUMN_WIDTH);
                                        if (zoomLevel === 'quarter') daysShifted *= 7;
                                        newStart = addDays(startDate, daysShifted);
                                      } else if (direction === 'right') {
                                        const deltaWidth = parseInt(ref.style.width, 10) - (pos.width - 8);
                                        let daysAdded = Math.round(deltaWidth / COLUMN_WIDTH);
                                        if (zoomLevel === 'quarter') daysAdded *= 7;
                                        newEnd = addDays(endDate, daysAdded);
                                      }
                                      
                                      if (newStart.getTime() !== startDate.getTime() || newEnd.getTime() !== endDate.getTime()) {
                                        handleDragResizeTask(task, newStart, newEnd);
                                      }
                                    }}
                                    className="z-10 group"
                                  >
                                    <div
                                      className={cn(
                                        "h-full w-full rounded-md flex items-center px-1 border cursor-pointer hover:scale-[1.02] transition-all shadow-sm",
                                        task.status === "DONE" ? "bg-gradient-to-r from-emerald-100 to-emerald-50/50 dark:from-emerald-500/20 dark:to-emerald-500/5 border-emerald-200 dark:border-emerald-500/20 shadow-emerald-500/10" :
                                          isOverdue ? "bg-gradient-to-r from-amber-100 to-amber-50/50 dark:from-amber-500/20 dark:to-amber-500/5 border-amber-200 dark:border-amber-500/20 shadow-amber-500/10" :
                                            task.priority === "HIGH" ? "bg-gradient-to-r from-rose-100 to-rose-50/50 dark:from-rose-500/20 dark:to-rose-500/5 border-rose-200 dark:border-rose-500/20 shadow-rose-500/10" :
                                              "bg-gradient-to-r from-blue-100 to-blue-50/50 dark:from-blue-500/20 dark:to-blue-500/5 border-blue-200 dark:border-blue-500/20 shadow-blue-500/10"
                                      )}
                                      onDoubleClick={() => group.type === 'project' && handleNavigateToProject(group.id)}
                                    >
                                      <div className={cn(
                                        "w-1.5 h-1.5 rounded-full ml-2",
                                        task.status === "DONE" ? "bg-emerald-500" :
                                          isOverdue ? "bg-amber-500 animate-pulse" :
                                            task.priority === "HIGH" ? "bg-rose-500" :
                                              "bg-blue-500"
                                      )} />
                                      <Avatar className="h-5 w-5 ml-auto border border-background pointer-events-none">
                                        <AvatarImage src={task.assignedTo?.[0]?.profilePicture} />
                                        <AvatarFallback className="text-[6px] bg-muted text-muted-foreground">
                                          {task.assignedTo?.[0]?.name?.[0]}
                                        </AvatarFallback>
                                      </Avatar>
                                    </div>
                                  </Rnd>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="bg-popover border-border text-popover-foreground p-3 rounded-xl shadow-2xl z-50">
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
                                    {task.priority && (
                                      <div className="flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                        <span>Độ ưu tiên: <span className={cn(
                                          "font-medium",
                                          task.priority === "HIGH" ? "text-rose-500" :
                                          task.priority === "MEDIUM" ? "text-amber-500" :
                                          "text-teal-500"
                                        )}>{task.priority}</span></span>
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
                  </DroppableRow>
                ))}
              </div>
            </div>
            <ScrollBar orientation="horizontal" className="bg-muted" />
          </ScrollArea>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="h-10 px-6 border-t border-border bg-background flex items-center gap-4 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
        <span className="text-muted-foreground/50 mr-2">Ưu tiên màu:</span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-emerald-600 dark:text-emerald-500">Hoàn thành</span>
        </div>
        <span className="text-muted-foreground/30">&gt;</span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-amber-600 dark:text-amber-500">Quá hạn</span>
        </div>
        <span className="text-muted-foreground/30">&gt;</span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rose-500" />
          <span className="text-rose-600 dark:text-rose-500">Ưu tiên cao</span>
        </div>
        <span className="text-muted-foreground/30">&gt;</span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-blue-600 dark:text-blue-500">Kế hoạch</span>
        </div>
        
        <div className="ml-auto flex items-center gap-2 text-muted-foreground/70">
          <Info className="w-3 h-3" />
          <span className="tracking-normal normal-case font-medium text-xs">Di chuột vào công việc để xem chi tiết</span>
        </div>
      </footer>
      <TaskDetailModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
      />
    </DndContext>
  );
}
