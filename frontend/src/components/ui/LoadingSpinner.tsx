import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'brand' | 'white';
  text?: string;
  centered?: boolean;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  text,
  centered = false,
  fullScreen = false,
}) => {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  };

  const colorMap = {
    default: 'text-neutral-600',
    brand: 'text-brand-600',
    white: 'text-white',
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-3 ${centered ? 'mx-auto' : ''}`}>
      <Loader2
        size={sizeMap[size]}
        className={`animate-spin ${colorMap[variant]}`}
      />
      {text && (
        <p className={`text-sm font-medium ${colorMap[variant]}`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
};

LoadingSpinner.displayName = 'LoadingSpinner';
