'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Shield, User, UserCog } from 'lucide-react';

interface RoleBadgeProps {
  roleName: string;
  className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ roleName, className }) => {
  const isOwner = roleName === 'OWNER';
  const isAdmin = roleName === 'ADMIN';

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "px-2 py-0.5 rounded-md flex items-center gap-1.5 font-bold text-[10px] tracking-wider uppercase border-none",
        isOwner && "bg-amber-50 text-amber-600",
        isAdmin && "bg-indigo-50 text-indigo-600",
        !isOwner && !isAdmin && "bg-slate-100 text-slate-500",
        className
      )}
    >
      {isOwner ? <Shield className="w-3 h-3" /> : isAdmin ? <UserCog className="w-3 h-3" /> : <User className="w-3 h-3" />}
      {roleName}
    </Badge>
  );
};
