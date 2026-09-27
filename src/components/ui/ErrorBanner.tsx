import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  severity?: 'warning' | 'error';
  className?: string;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  onRetry,
  severity = 'error',
  className = '',
}) => {
  const isWarning = severity === 'warning';

  return (
    <div
      className={`flex items-center justify-between p-3.5 rounded-xl border text-xs sm:text-sm ${
        isWarning
          ? 'bg-amber-500/10 border-amber-500/20 text-[#E0A526] dark:text-[#F0B94B]'
          : 'bg-red-500/10 border-red-500/20 text-[#D64545] dark:text-[#F0685E]'
      } ${className}`}
      role="alert"
    >
      <div className="flex items-center gap-2.5">
        <AlertCircle size={18} className="shrink-0" />
        <span className="font-medium text-slate-800 dark:text-slate-200">{message}</span>
      </div>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs shrink-0 ml-2"
        >
          <RefreshCw size={12} className="mr-1" />
          Retry
        </Button>
      )}
    </div>
  );
};
