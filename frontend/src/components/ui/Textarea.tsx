import React, { useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCharCount?: boolean;
  maxCharCount?: number;
  autoResize?: boolean;
  fullWidth?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      showCharCount = false,
      maxCharCount,
      autoResize = false,
      fullWidth = true,
      className = '',
      id,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const localRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || localRef;

    const charCount = typeof value === 'string' ? value.length : 0;

    // Auto-resize functionality
    useEffect(() => {
      if (autoResize && textareaRef.current) {
        const textarea = textareaRef.current;
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, [value, autoResize, textareaRef]);

    const baseStyles = 'px-4 py-2 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed resize-none';
    const errorStyles = error
      ? 'border-error focus:ring-error focus:border-error'
      : 'border-neutral-300 focus:ring-brand-500 focus:border-brand-500';
    const widthStyles = fullWidth ? 'w-full' : '';

    return (
      <div className={`${widthStyles}`}>
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-neutral-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={textareaRef}
            id={textareaId}
            className={`${baseStyles} ${errorStyles} ${widthStyles} ${className}`}
            value={value}
            onChange={onChange}
            maxLength={maxCharCount}
            {...props}
          />
          {error && (
            <div className="absolute right-3 top-3 text-error">
              <AlertCircle size={18} />
            </div>
          )}
        </div>
        <div className="flex justify-between items-center mt-1.5">
          <div className="flex-1">
            {error && (
              <p className="text-sm text-error flex items-center gap-1">
                {error}
              </p>
            )}
            {helperText && !error && (
              <p className="text-sm text-neutral-500">
                {helperText}
              </p>
            )}
          </div>
          {showCharCount && (
            <p className={`text-sm ${maxCharCount && charCount > maxCharCount ? 'text-error' : 'text-neutral-500'}`}>
              {charCount}{maxCharCount && ` / ${maxCharCount}`}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
