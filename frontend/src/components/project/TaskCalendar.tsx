'use client';

import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, isWithinInterval, startOfDay, endOfDay, isToday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Task, TaskStatus } from '@/types/task';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface TaskCalendarProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.COMPLETED:
    case TaskStatus.DONE:
      return 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 text-emerald-700 dark:text-emerald-400';
    case TaskStatus.IN_PROGRESS:
      return 'bg-gradient-to-r from-brand-primary/20 to-brand-primary/5 text-brand-primary dark:text-brand-secondary';
    case TaskStatus.INREVIEW:
      return 'bg-gradient-to-r from-amber-500/20 to-amber-500/5 text-amber-700 dark:text-amber-400';
    case TaskStatus.CANCELLED:
      return 'bg-gradient-to-r from-rose-500/20 to-rose-500/5 text-rose-700 dark:text-rose-400';
    default:
      return 'bg-gradient-to-r from-slate-500/20 to-slate-500/5 text-slate-700 dark:text-slate-400';
  }
};

const getStatusBorder = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.COMPLETED:
    case TaskStatus.DONE: return 'border-l-emerald-500';
    case TaskStatus.IN_PROGRESS: return 'border-l-brand-primary';
    case TaskStatus.INREVIEW: return 'border-l-amber-500';
    case TaskStatus.CANCELLED: return 'border-l-rose-500';
    default: return 'border-l-slate-500';
  }
};

const getStatusIndicator = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.COMPLETED:
    case TaskStatus.DONE:
      return 'bg-emerald-500';
    case TaskStatus.IN_PROGRESS:
      return 'bg-brand-primary';
    case TaskStatus.INREVIEW:
      return 'bg-amber-500';
    case TaskStatus.CANCELLED:
      return 'bg-rose-500';
    default:
      return 'bg-slate-500';
  }
};

export const TaskCalendar: React.FC<TaskCalendarProps> = ({ tasks, onTaskClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(currentDate.getFullYear());

  const taskSlots = useMemo(() => {
    const sortedTasks = [...tasks].sort((a, b) => {
      const startA = a.startDate ? new Date(a.startDate).getTime() : new Date(a.dueDate!).getTime();
      const startB = b.startDate ? new Date(b.startDate).getTime() : new Date(b.dueDate!).getTime();
      if (startA !== startB) return startA - startB;
      const endA = a.dueDate ? new Date(a.dueDate).getTime() : new Date(a.startDate!).getTime();
      const endB = b.dueDate ? new Date(b.dueDate).getTime() : new Date(b.startDate!).getTime();
      return (endB - startB) - (endA - startA); // Longest first
    });

    const slots: Record<string, number> = {};
    const slotEndTimes: number[] = [];

    sortedTasks.forEach(task => {
      if (!task.startDate && !task.dueDate) return;
      const start = task.startDate ? startOfDay(new Date(task.startDate)).getTime() : startOfDay(new Date(task.dueDate!)).getTime();
      const end = task.dueDate ? endOfDay(new Date(task.dueDate)).getTime() : endOfDay(new Date(task.startDate!)).getTime();

      let assignedSlot = -1;
      for (let i = 0; i < slotEndTimes.length; i++) {
        // -86400000 ensures start next day does not conflict with end previous day
        if (slotEndTimes[i] < start) {
          assignedSlot = i;
          break;
        }
      }

      if (assignedSlot === -1) {
        assignedSlot = slotEndTimes.length;
        slotEndTimes.push(end);
      } else {
        slotEndTimes[assignedSlot] = end;
      }
      slots[task._id] = assignedSlot;
    });
    return slots;
  }, [tasks]);

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    
    const startDate = new Date(start);
    startDate.setDate(startDate.getDate() - getDay(startDate));
    
    const endDate = new Date(end);
    if (getDay(endDate) !== 6) {
      endDate.setDate(endDate.getDate() + (6 - getDay(endDate)));
    }

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => {
      if (!task.dueDate && !task.startDate) return false;
      
      const start = task.startDate ? startOfDay(new Date(task.startDate)) : startOfDay(new Date(task.dueDate!));
      const end = task.dueDate ? endOfDay(new Date(task.dueDate)) : endOfDay(new Date(task.startDate!));
      
      return isWithinInterval(day, { start, end });
    });
  };

  return (
    <div className="flex flex-col h-full bg-white/80 dark:bg-slate-900/50 backdrop-blur-2xl border border-slate-200/60 dark:border-white/10 rounded-[32px] overflow-hidden shadow-depth-2">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200/60 dark:border-white/10">
        <div className="flex items-center gap-4">
          <Popover open={isMonthPickerOpen} onOpenChange={(open) => {
            setIsMonthPickerOpen(open);
            if (open) setPickerYear(currentDate.getFullYear());
          }}>
            <PopoverTrigger className="relative group cursor-pointer outline-none border-none bg-transparent flex flex-col items-start p-0 m-0">
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 capitalize tracking-tight flex items-center gap-2 group-hover:text-brand-primary transition-colors">
                {format(currentDate, 'MMMM, yyyy', { locale: vi })}
                <ChevronDown className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
              </h2>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                Quản lý tiến độ
              </p>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 shadow-xl rounded-2xl" align="start">
              <div className="flex items-center justify-between mb-4 px-1">
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-slate-500" onClick={(e) => { e.stopPropagation(); setPickerYear(y => y - 1); }}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-black text-slate-700 dark:text-slate-200">{pickerYear}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-slate-500" onClick={(e) => { e.stopPropagation(); setPickerYear(y => y + 1); }}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 12 }).map((_, i) => {
                  const isSelected = currentDate.getMonth() === i && currentDate.getFullYear() === pickerYear;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        const newDate = new Date(currentDate);
                        newDate.setFullYear(pickerYear, i);
                        setCurrentDate(newDate);
                        setIsMonthPickerOpen(false);
                      }}
                      className={`py-2 text-xs font-bold rounded-xl transition-all ${isSelected ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                      Thg {i + 1}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/40 p-1.5 rounded-full border border-slate-200/60 dark:border-white/5 shadow-inner">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={prevMonth}
            className="w-10 h-10 rounded-full hover:bg-white dark:hover:bg-slate-700 shadow-sm transition-all text-slate-500"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            onClick={goToToday}
            className={`px-5 h-10 rounded-full hover:bg-white dark:hover:bg-slate-700 shadow-sm transition-all text-xs font-semibold ${isSameMonth(currentDate, new Date()) ? 'text-brand-primary' : 'text-slate-700 dark:text-slate-300'}`}
          >
            {isSameMonth(currentDate, new Date()) ? 'Hôm nay' : `Tháng ${currentDate.getMonth() + 1}`}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={nextMonth}
            className="w-10 h-10 rounded-full hover:bg-white dark:hover:bg-slate-700 shadow-sm transition-all text-slate-500"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-50/20 dark:bg-slate-900/10">
        <div className="grid grid-cols-7 border-b border-slate-100/50 dark:border-white/5 bg-white/50 dark:bg-slate-800/30 backdrop-blur-md">
          {WEEKDAYS.map((day, idx) => (
            <div key={idx} className="py-4 text-center text-xs font-black text-brand-primary dark:text-brand-secondary uppercase tracking-widest border-r last:border-r-0 border-slate-100/50 dark:border-white/5">
              {day}
            </div>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-y-auto custom-scrollbar">
          {daysInMonth.map((day, idx) => {
            const dayTasks = getTasksForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDay = isToday(day);

            return (
              <div 
                key={day.toString()} 
                className={`min-h-[120px] pt-2 pb-2 border-r border-b border-slate-200/60 dark:border-white/10 transition-colors ${
                  !isCurrentMonth ? 'bg-slate-50/40 dark:bg-slate-800/10' : 'bg-white/40 dark:bg-slate-800/30'
                } hover:bg-slate-50/80 dark:hover:bg-slate-800/50 group relative flex flex-col`}
              >
                <div className="flex items-center justify-between mb-2 px-2">
                  <span className={`text-xs font-black w-8 h-8 flex items-center justify-center rounded-full transition-all duration-500 ${
                    isTodayDay 
                      ? 'bg-brand-primary text-white shadow-glow-combined animate-pulse ring-4 ring-brand-primary/20' 
                      : isCurrentMonth 
                        ? 'text-slate-700 dark:text-slate-300 group-hover:text-brand-primary group-hover:scale-110' 
                        : 'text-slate-400 dark:text-slate-600'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[10px] font-bold text-brand-primary dark:text-brand-secondary bg-brand-primary/10 dark:bg-brand-primary/20 px-2 py-0.5 rounded-lg border border-brand-primary/20">
                      {dayTasks.length} task
                    </span>
                  )}
                </div>

                <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
                  {(() => {
                    const maxSlot = Math.max(-1, ...dayTasks.map(t => taskSlots[t._id] || 0));
                    const renderedSlots = [];
                    for (let s = 0; s <= maxSlot; s++) {
                      const taskInSlot = dayTasks.find(t => taskSlots[t._id] === s);
                      if (taskInSlot) {
                        const task = taskInSlot;
                        const isStart = task.startDate ? isSameDay(day, new Date(task.startDate)) : isSameDay(day, new Date(task.dueDate!));
                        const isEnd = task.dueDate ? isSameDay(day, new Date(task.dueDate)) : isSameDay(day, new Date(task.startDate!));
                        
                        renderedSlots.push(
                          <motion.div
                            layoutId={`task-${task._id}-${day.getTime()}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            key={task._id}
                            onClick={() => onTaskClick(task)}
                            className={`h-[26px] text-[10px] font-bold px-2 flex items-center justify-between cursor-pointer hover:brightness-110 transition-all gap-1.5 ${
                              getStatusColor(task.status)
                            } ${isStart ? `rounded-l-xl border-l-[3px] ${getStatusBorder(task.status)} ml-1` : 'rounded-none border-l-0 border-y border-transparent'} ${isEnd ? 'rounded-r-xl mr-1' : 'rounded-r-none'}`}
                            title={task.title}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              {isStart && (
                                 <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusIndicator(task.status)}`} />
                              )}
                              <span className="truncate">{task.title}</span>
                            </div>

                            {/* Assignees */}
                            {(isStart || isEnd) && (
                              <div className="flex items-center -space-x-1 shrink-0 ml-1">
                                {task.assignedTo && task.assignedTo.length > 0 ? (
                                  task.assignedTo.slice(0, 2).map((assignee, i) => (
                                    <div key={assignee._id} className="w-[14px] h-[14px] rounded-full overflow-hidden border border-white/50 bg-slate-200" style={{ zIndex: 10 - i }}>
                                      {assignee.profilePicture ? (
                                        <img src={assignee.profilePicture} alt={assignee.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-brand-primary text-white text-[6px] font-black uppercase">
                                          {assignee.name.charAt(0)}
                                        </div>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <div className="w-[14px] h-[14px] rounded-full border border-dashed border-slate-400 dark:border-slate-500 flex items-center justify-center bg-slate-50/50 dark:bg-slate-800/50">
                                    <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400">?</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </motion.div>
                        );
                      } else {
                        renderedSlots.push(
                          <div key={`empty-${day.getTime()}-${s}`} className="h-[26px]" />
                        );
                      }
                    }
                    return renderedSlots;
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
