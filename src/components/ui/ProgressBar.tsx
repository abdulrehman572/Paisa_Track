import React from 'react';

export interface ProgressBarProps {
  progress: number; // 0 to 100+
  size?: 'sm' | 'md' | 'lg';
  showStatusColor?: boolean; // Changes color automatically (green -> amber -> red)
  customColor?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  size = 'md',
  showStatusColor = true,
  customColor,
  className = '',
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  const heightStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  let fillColor = customColor || 'bg-[#2E5EAA] dark:bg-[#5B8DEF]';

  if (showStatusColor && !customColor) {
    if (progress >= 100) {
      fillColor = 'bg-[#D64545] dark:bg-[#F0685E]';
    } else if (progress >= 80) {
      fillColor = 'bg-[#E0A526] dark:bg-[#F0B94B]';
    } else {
      fillColor = 'bg-[#1F9D55] dark:bg-[#3DD671]';
    }
  }

  return (
    <div
      className={`w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden ${heightStyles[size]} ${className}`}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full transition-all duration-500 ease-out rounded-full ${fillColor}`}
        style={{ width: `${clampedProgress}%` }}
      />
    </div>
  );
};
