import React from 'react';
import { motion } from 'framer-motion';
import { Loader } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden';

    const variantStyles = {
      primary: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 focus:ring-indigo-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-200 hover:scale-[1.02] active:scale-[0.98]',
      outline: 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 focus:ring-indigo-200 hover:border-indigo-700 hover:scale-[1.02] active:scale-[0.98]',
      ghost: 'text-indigo-600 hover:bg-indigo-50 focus:ring-indigo-200 hover:scale-[1.02] active:scale-[0.98]',
      danger: 'bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 focus:ring-red-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]',
    };

    const sizeStyles = {
      sm: 'px-4 py-2 text-sm gap-2',
      md: 'px-6 py-3 text-base gap-2',
      lg: 'px-8 py-4 text-lg gap-3',
    };

    const widthStyles = fullWidth ? 'w-full' : '';

    const MotionButton = motion.button as any;

    return (
      <MotionButton
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`}
        disabled={disabled || isLoading}
        whileHover={{ y: -2 }}
        whileTap={{ y: 0 }}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {/* Shine effect on hover */}
        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 -skew-x-12 translate-x-[-200%] hover:translate-x-[200%]" style={{ transition: 'transform 0.6s' }} />

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Loader className="animate-spin" size={size === 'sm' ? 16 : size === 'lg' ? 22 : 18} />
          </motion.div>
        )}
        <span className="relative z-10">{children}</span>
      </MotionButton>
    );
  }
);

Button.displayName = 'Button';
