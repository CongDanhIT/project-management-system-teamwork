'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  user?: {
    name?: string;
    profilePicture?: string;
  };
  name?: string;
  image?: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg' | 'xl';
  showShadow?: boolean;
}


export function UserAvatar({ 
  user, 
  name, 
  image, 
  className, 
  size = 'default',
  showShadow = true 
}: UserAvatarProps) {
  const userData = (user as any)?.userId || user;
  const userName = name || userData?.name || 'User';
  const userImage = image || userData?.profilePicture || userData?.avatar;
  
  // Get initials (up to 2 chars)
  const initials = userName
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n?.[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizeClasses = {
    sm: 'h-6 w-6 text-[10px]',
    default: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg',
    xl: 'h-20 w-20 text-2xl',
  };

  return (
    <Avatar 
      className={cn(
        "rounded-2xl border-none transition-all duration-300",
        showShadow && "shadow-depth-1 hover:shadow-depth-2",
        sizeClasses[size],
        className
      )}
    >
      {userImage && (
        <AvatarImage 
          src={userImage} 
          className="object-cover rounded-2xl"
        />
      )}
      <AvatarFallback 
        className={cn(
          "font-black rounded-2xl backdrop-blur-xl bg-gradient-to-br from-brand-primary/10 to-slate-50 text-brand-primary border border-brand-primary/5",
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
