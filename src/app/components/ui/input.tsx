import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm text-foreground/80">
          {label}
        </label>
      )}
      <input
        className={`px-4 py-2.5 bg-input-background rounded-xl border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all ${error ? 'border-destructive' : ''} ${className}`}
        {...props}
      />
      {error && (
        <span className="text-sm text-destructive">{error}</span>
      )}
    </div>
  );
}
