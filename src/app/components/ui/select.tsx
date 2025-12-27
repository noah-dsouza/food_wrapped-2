import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: string[];
}

export function Select({ label, error, options, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm text-foreground/80">
          {label}
        </label>
      )}
      <select
        className={`px-4 py-2.5 bg-input-background rounded-xl border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all appearance-none cursor-pointer ${error ? 'border-destructive' : ''} ${className}`}
        {...props}
      >
        <option value="">Select...</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error && (
        <span className="text-sm text-destructive">{error}</span>
      )}
    </div>
  );
}
