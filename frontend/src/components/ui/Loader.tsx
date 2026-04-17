import React from 'react';
import { cn } from '@/lib/utils';

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

export const Loader: React.FC<LoaderProps> = ({ 
  className, 
  size = 'md', 
  fullPage = false,
  ...props 
}) => {
  const sizeMap = {
    xs: 'scale-[0.35]',
    sm: 'scale-50',
    md: 'scale-75',
    lg: 'scale-100',
  };

  const content = (
    <div 
      className={cn(
        "flex flex-col items-center justify-center gap-12",
        sizeMap[size],
        className
      )} 
      {...props}
    >
      <div className="brand-loader" />
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-md">
        {content}
      </div>
    );
  }

  return content;
};

export default Loader;
