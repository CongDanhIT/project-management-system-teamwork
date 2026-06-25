'use client';

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Phím tắt: Ctrl + J
      if (e.ctrlKey && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setTheme(theme === "light" ? "dark" : "light");
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [theme, setTheme]);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-brand-primary hover:bg-white shadow-sm border border-transparent hover:border-slate-200 transition-all group"
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 group-hover:animate-[spin_4s_linear_infinite]" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 group-hover:animate-[pulse_2s_ease-in-out_infinite]" />
            <span className="sr-only">Chuyển đổi giao diện</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="flex items-center gap-2 px-2.5 py-1.5">
          <p className="text-xs font-medium">Chế độ Sáng/Tối</p>
          <kbd className="pointer-events-none inline-flex h-5 items-center gap-1 rounded border bg-slate-100 dark:bg-slate-800 px-1.5 font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400">
            Ctrl + J
          </kbd>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
