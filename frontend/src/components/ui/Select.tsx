import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  leftIcon?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, leftIcon, id, ...props }, ref) => {
    const selectId = id || Math.random().toString(36).substring(7);

    return (
      <div className="form-group w-full">
        {label && (
          <label htmlFor={selectId} className="label">
            {label}
            {props.required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <select
            id={selectId}
            ref={ref}
            className={cn(
              'input appearance-none',
              leftIcon && 'pl-10',
              'pr-10', // space for chevron
              error && 'input-error',
              className
            )}
            {...props}
          >
            {/* If placeholder is needed, it should be the first option with empty value */}
            {/* Placeholder option */}
            <option value="" disabled hidden>{label ? `Select ${label}` : 'Select'}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 text-slate-400 dark:text-slate-500 pointer-events-none">
            <ChevronDown size={18} />
          </div>
        </div>
        {error && <p className="error-text">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
