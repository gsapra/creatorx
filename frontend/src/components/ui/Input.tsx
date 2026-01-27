import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = true,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const baseStyles = 'px-4 py-3 border-2 rounded-xl transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed bg-white text-gray-900 placeholder:text-gray-400';
    const errorStyles = error
      ? 'border-red-400 focus:border-red-500 focus:shadow-lg focus:shadow-red-100'
      : isFocused
      ? 'border-indigo-500 shadow-lg shadow-indigo-100'
      : 'border-gray-200 hover:border-gray-300';
    const iconPaddingLeft = leftIcon ? 'pl-11' : '';
    const iconPaddingRight = rightIcon ? 'pr-11' : '';
    const widthStyles = fullWidth ? 'w-full' : '';

    return (
      <div className={`${widthStyles}`}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-semibold text-gray-700 mb-2">
            {label}
          </label>
        )}
        <motion.div
          className="relative"
          whileTap={{ scale: 0.995 }}
        >
          {leftIcon && (
            <motion.div
              className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                isFocused ? 'text-indigo-600' : 'text-gray-400'
              }`}
              animate={{ scale: isFocused ? 1.1 : 1 }}
              transition={{ duration: 0.2 }}
            >
              {leftIcon}
            </motion.div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`${baseStyles} ${errorStyles} ${iconPaddingLeft} ${iconPaddingRight} ${widthStyles} ${className}`}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
          {rightIcon && !error && (
            <motion.div
              className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                isFocused ? 'text-indigo-600' : 'text-gray-400'
              }`}
              animate={{ scale: isFocused ? 1.1 : 1 }}
              transition={{ duration: 0.2 }}
            >
              {rightIcon}
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500"
            >
              <AlertCircle size={20} />
            </motion.div>
          )}
        </motion.div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-red-600 font-medium"
          >
            {error}
          </motion.p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
