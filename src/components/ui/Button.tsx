import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] select-none cursor-pointer disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100';

  const sizeStyles = {
    sm: 'h-9 px-3 text-xs gap-1.5 min-w-[36px]',
    md: 'h-11 px-4 text-sm gap-2 min-w-[44px]',
    lg: 'h-13 px-6 text-base gap-2.5 min-w-[48px]',
  };

  const variantStyles = {
    primary:
      'bg-[#2E5EAA] hover:bg-[#1E3F73] dark:bg-[#5B8DEF] dark:hover:bg-[#4A7CD8] text-white shadow-sm focus-visible:ring-[#2E5EAA]',
    secondary:
      'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 focus-visible:ring-slate-400',
    outline:
      'border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 focus-visible:ring-slate-400',
    danger:
      'bg-[#D64545] hover:bg-[#B33434] dark:bg-[#F0685E] dark:hover:bg-[#D64545] text-white shadow-sm focus-visible:ring-[#D64545]',
    ghost:
      'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 focus-visible:ring-slate-400',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : null}
      {children}
    </button>
  );
};
