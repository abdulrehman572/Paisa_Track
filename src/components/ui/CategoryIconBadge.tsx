import React from 'react';
import {
  Utensils,
  Car,
  Zap,
  ShoppingBag,
  HeartPulse,
  Film,
  Home,
  Gift,
  Briefcase,
  Laptop,
  TrendingUp,
  MoreHorizontal,
  Landmark,
  CreditCard,
  Banknote,
  ShieldAlert,
  Plane,
  ArrowLeftRight,
  ShieldCheck,
  LucideIcon,
  HelpCircle,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Utensils,
  Car,
  Zap,
  ShoppingBag,
  HeartPulse,
  Film,
  Home,
  Gift,
  Briefcase,
  Laptop,
  TrendingUp,
  MoreHorizontal,
  Landmark,
  CreditCard,
  Banknote,
  ShieldAlert,
  ShieldCheck,
  Plane,
  ArrowLeftRight,
  Vault: ShieldCheck,
};

export interface CategoryIconBadgeProps {
  iconName?: string;
  color?: string;
  size?: number; // default 36px
  className?: string;
}

export const CategoryIconBadge: React.FC<CategoryIconBadgeProps> = ({
  iconName = 'MoreHorizontal',
  color = '#8B93A1',
  size = 36,
  className = '',
}) => {
  const IconComponent = ICON_MAP[iconName] || HelpCircle;
  const iconPixel = Math.round(size * 0.52);

  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 transition-transform ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: `${color}26`, // 15% opacity (hex 26 is ~15%)
      }}
    >
      <IconComponent size={iconPixel} style={{ color }} strokeWidth={2} />
    </div>
  );
};
