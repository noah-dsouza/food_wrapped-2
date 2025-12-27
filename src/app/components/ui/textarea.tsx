import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm text-foreground/80">
          {label}
        </label>
      )}
      <textarea
        className={`px-4 py-2.5 bg-input-background rounded-xl border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all resize-none ${error ? 'border-destructive' : ''} ${className}`}
        rows={4}
        {...props}
      />
      {error && (
        <span className="text-sm text-destructive">{error}</span>
      )}
    </div>
  );
}
