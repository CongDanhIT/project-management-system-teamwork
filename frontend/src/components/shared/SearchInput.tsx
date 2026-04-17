import * as React from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SearchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, containerClassName, ...props }, ref) => {
    return (
      <div 
        className={cn(
          "relative group flex items-center transition-all duration-300",
          containerClassName
        )}
      >
        <Search 
          className={cn(
            "absolute left-4 w-4 h-4 text-slate-400 dark:text-slate-500 transition-all duration-300 z-10",
            "group-focus-within:text-teal-500 group-focus-within:scale-110"
          )} 
        />
        <input
          ref={ref}
          className={cn(
            "w-full h-11 pl-11 pr-4 rounded-full text-sm font-medium outline-hidden transition-all duration-300",
            "bg-white/40 dark:bg-slate-900/40 backdrop-blur-md",
            "border border-slate-200/50 dark:border-white/10",
            "placeholder:text-slate-400 dark:placeholder:text-slate-500",
            "text-slate-900 dark:text-slate-100",
            "hover:bg-white/60 dark:hover:bg-slate-800/60 hover:border-slate-300 dark:border-white/20",
            "focus:bg-white/80 dark:focus:bg-slate-900/80 focus:border-teal-400 dark:focus:border-teal-400/60 focus:ring-4 focus:ring-teal-500/10",
            className
          )}
          {...props}
        />
      </div>
    )
  }
)
SearchInput.displayName = "SearchInput"

export { SearchInput }
