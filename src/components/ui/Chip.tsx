import React from 'react';

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  variant?: 'default' | 'filter' | 'segment';
}

export const Chip: React.FC<ChipProps> = ({
  children,
  active = false,
  variant = 'default',
  className = '',
  ...props
}) => {
  if (variant === 'segment') {
    return (
      <button
        type="button"
        className={`flex-1 py-2 px-3 text-xs sm:text-sm font-medium rounded-lg transition-all select-none whitespace-nowrap cursor-pointer ${
          active
            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm font-semibold'
            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
        } ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-colors select-none whitespace-nowrap cursor-pointer ${
        active
          ? 'bg-[#2E5EAA] text-white dark:bg-[#5B8DEF] dark:text-slate-950 font-semibold shadow-xs'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
