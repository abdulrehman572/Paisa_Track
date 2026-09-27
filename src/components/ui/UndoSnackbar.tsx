import React, { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';

export interface UndoSnackbarProps {
  isOpen: boolean;
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  durationMs?: number;
}

export const UndoSnackbar: React.FC<UndoSnackbarProps> = ({
  isOpen,
  message,
  onUndo,
  onDismiss,
  durationMs = 5000,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!isOpen) {
      setProgress(100);
      return;
    }

    const interval = 50;
    const step = (interval / durationMs) * 100;
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isOpen, durationMs, onDismiss]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] sm:w-auto min-w-[320px] max-w-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 rounded-2xl shadow-xl border border-slate-800 dark:border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center justify-between px-4 py-3 gap-3">
        <span className="text-xs sm:text-sm font-medium truncate">{message}</span>
        <button
          onClick={onUndo}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2E5EAA] hover:bg-[#1E3F73] text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition-colors"
        >
          <RotateCcw size={13} />
          Undo
        </button>
      </div>
      {/* Progress countdown bar */}
      <div className="h-1 w-full bg-slate-800 dark:bg-slate-300">
        <div
          className="h-full bg-[#5B8DEF] dark:bg-[#2E5EAA] transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
