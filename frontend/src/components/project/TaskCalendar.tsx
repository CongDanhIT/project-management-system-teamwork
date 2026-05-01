'use client';

import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, isWithinInterval, startOfDay, endOfDay, isToday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Task, TaskStatus } from '@/types/task';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface TaskCalendarProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.COMPLETED:
    case TaskStatus.DONE:
      return 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
    case TaskStatus.IN_PROGRESS:
      return 'bg-brand-primary/20 text-brand-primary dark:text-brand-secondary border-brand-primary/30';
    case TaskStatus.INREVIEW:
      return 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30';
    case TaskStatus.CANCELLED:
      return 'bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-500/30';
    default:
      return 'bg-slate-500/20 text-slate-700 dark:text-slate-400 border-slate-500/30';
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
          <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20 shadow-inner">
            <CalendarIcon className="w-6 h-6 text-brand-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 capitalize tracking-tight">
              {format(currentDate, 'MMMM, yyyy', { locale: vi })}
            </h2>
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
              Quản lý tiến độ
            </p>
          </div>
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
            className="px-5 h-10 rounded-full hover:bg-white dark:hover:bg-slate-700 shadow-sm transition-all text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Hôm nay
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
      <div className="flex-1 flex flex-col min-h-0">
        <div className="grid grid-cols-7 border-b border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/20">
          {WEEKDAYS.map((day, idx) => (
            <div key={idx} className="py-3 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-r last:border-r-0 border-slate-200/60 dark:border-white/10">
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
                className={`min-h-[120px] p-2 border-r border-b border-slate-200/60 dark:border-white/10 transition-colors ${
                  !isCurrentMonth ? 'bg-slate-50/30 dark:bg-slate-800/10' : 'bg-white/30 dark:bg-transparent'
                } hover:bg-slate-50 dark:hover:bg-slate-800/30 group`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-black w-7 h-7 flex items-center justify-center rounded-full ${
                    isTodayDay 
                      ? 'bg-brand-primary text-white shadow-glow-combined' 
                      : isCurrentMonth 
                        ? 'text-slate-700 dark:text-slate-300' 
                        : 'text-slate-400 dark:text-slate-600'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 rounded-md">
                      {dayTasks.length}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 max-h-[calc(100%-36px)] overflow-y-auto custom-scrollbar pr-1">
                  {dayTasks.map(task => {
                    const isStart = task.startDate ? isSameDay(day, new Date(task.startDate)) : isSameDay(day, new Date(task.dueDate!));
                    const isEnd = task.dueDate ? isSameDay(day, new Date(task.dueDate)) : isSameDay(day, new Date(task.startDate!));
                    
                    return (
                      <motion.div
                        layoutId={`task-${task._id}-${day.getTime()}`}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={task._id}
                        onClick={() => onTaskClick(task)}
                        className={`text-[10px] font-bold px-2 py-1.5 border border-transparent truncate cursor-pointer hover:brightness-110 transition-all flex items-center gap-1.5 ${
                          getStatusColor(task.status)
                        } ${isStart ? 'rounded-l-md border-l-2' : ''} ${isEnd ? 'rounded-r-md border-r-2' : ''} ${!isStart && !isEnd ? 'rounded-none border-y' : ''}`}
                        title={task.title}
                      >
                        {isStart && (
                           <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusIndicator(task.status)}`} />
                        )}
                        <span className="truncate">{task.title}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
