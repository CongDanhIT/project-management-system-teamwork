import React from 'react';
import { Announcement } from '@/services/announcement.service';
import { Pin, Activity, Zap } from 'lucide-react';
import { TagManagerWidget } from './TagManagerWidget';
import { TeamWidget } from './TeamWidget';

interface PulseSidebarProps {
  announcements: Announcement[];
}

export function PulseSidebar({ announcements }: PulseSidebarProps) {
  const pinnedAnnouncements = announcements?.filter(a => a.isPinned) || [];
  
  const handleScrollTo = (id: string) => {
    const element = document.getElementById(`announcement-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Hiệu ứng Highlight tạm thời
      element.classList.add('ring-4', 'ring-amber-500/30', 'dark:ring-amber-500/20', 'scale-[1.02]', 'z-10');
      setTimeout(() => {
        element.classList.remove('ring-4', 'ring-amber-500/30', 'dark:ring-amber-500/20', 'scale-[1.02]', 'z-10');
      }, 2000);
    }
  };

  return (
    <div className="sticky top-24 space-y-6 hidden lg:block">
      
      {/* Pinned Updates - Real Data from Database */}
      {pinnedAnnouncements.length > 0 && (
        <div className="p-6 rounded-[32px] bg-white dark:bg-surface-secondary shadow-ambient dark:shadow-none transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/10">
              <Pin className="w-5 h-5 text-amber-500" />
            </div>
            <h3 className="text-[16px] font-extrabold text-slate-800 dark:text-white">Ghim quan trọng</h3>
          </div>
          
          <div className="space-y-4">
            {pinnedAnnouncements.slice(0, 5).map(ann => (
              <div 
                key={ann._id} 
                onClick={() => handleScrollTo(ann._id)}
                className="group relative pl-4 border-l-2 border-divider hover:border-amber-500/50 dark:hover:border-amber-500/50 transition-all cursor-pointer active:scale-95"
              >
                <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200 line-clamp-2 leading-tight mb-1 group-hover:text-brand-primary transition-colors">
                  {ann.title}
                </p>
                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">{ann.createdBy?.name}</span>
                  <span className="text-slate-400">{new Date(ann.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Workspace Tags Manager */}
      <TagManagerWidget />

      {/* Team Members Widget */}
      <TeamWidget />

    </div>
  );
}

