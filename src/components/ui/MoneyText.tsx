import React from 'react';
import { formatMoney } from '../../lib/money';

export interface MoneyTextProps {
  amountMinor: number;
  currency?: string;
  type?: 'income' | 'expense' | 'neutral' | 'auto';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | 'hero';
  showSign?: boolean;
  className?: string;
}

export const MoneyText: React.FC<MoneyTextProps> = ({
  amountMinor,
  currency = 'USD',
  type = 'neutral',
  size = 'base',
  showSign = false,
  className = '',
}) => {
  let displayType: 'income' | 'expense' | 'neutral' = 'neutral';
  if (type === 'auto') {
    displayType = amountMinor > 0 ? 'income' : amountMinor < 0 ? 'expense' : 'neutral';
  } else if (type === 'income' || type === 'expense' || type === 'neutral') {
    displayType = type;
  }

  const colorStyles = {
    income: 'text-[#1F9D55] dark:text-[#3DD671]',
    expense: 'text-[#D64545] dark:text-[#F0685E]',
    neutral: 'text-slate-900 dark:text-slate-100',
  };

  const sizeStyles = {
    xs: 'text-xs font-medium',
    sm: 'text-sm font-medium',
    base: 'text-base font-semibold',
    lg: 'text-lg font-semibold',
    xl: 'text-xl font-bold',
    '2xl': 'text-2xl font-bold tracking-tight',
    '3xl': 'text-3xl font-extrabold tracking-tight',
    hero: 'text-3xl sm:text-4xl font-extrabold tracking-tight',
  };

  const formatted = formatMoney(amountMinor, currency, {
    showSign: showSign && amountMinor > 0,
  });

  return (
    <span
      className={`font-mono tabular-nums inline-block ${sizeStyles[size]} ${colorStyles[displayType]} ${className}`}
    >
      {formatted}
    </span>
  );
};
