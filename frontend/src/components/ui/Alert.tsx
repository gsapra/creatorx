import React from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  onClose?: () => void;
  children: React.ReactNode;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      variant = 'info',
      title,
      onClose,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'rounded-lg p-4 border flex gap-3';

    const variantConfig = {
      success: {
        styles: 'bg-success/5 border-success/20 text-success-dark',
        icon: CheckCircle,
        iconColor: 'text-success',
      },
      error: {
        styles: 'bg-error/5 border-error/20 text-error-dark',
        icon: AlertCircle,
        iconColor: 'text-error',
      },
      warning: {
        styles: 'bg-warning/5 border-warning/20 text-warning-dark',
        icon: AlertTriangle,
        iconColor: 'text-warning',
      },
      info: {
        styles: 'bg-info/5 border-info/20 text-info-dark',
        icon: Info,
        iconColor: 'text-info',
      },
    };

    const config = variantConfig[variant];
    const Icon = config.icon;

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${config.styles} ${className}`}
        role="alert"
        {...props}
      >
        <Icon className={`flex-shrink-0 ${config.iconColor}`} size={20} />
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-semibold mb-1">{title}</h4>
          )}
          <div className="text-sm">{children}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 hover:opacity-70 transition-opacity"
            aria-label="Close alert"
          >
            <X size={18} />
          </button>
        )}
      </div>
    );
  }
);

Alert.displayName = 'Alert';
