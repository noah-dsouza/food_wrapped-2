import React from 'react';

interface ChipProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'filter';
}

export function Chip({ children, active = false, onClick, variant = 'default' }: ChipProps) {
  const baseStyles = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all';
  
  const variantStyles = {
    default: active 
      ? 'bg-primary text-primary-foreground'
      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    filter: active
      ? 'bg-primary text-primary-foreground border border-primary'
      : 'bg-transparent border border-border text-foreground hover:bg-accent'
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]}`}
    >
      {children}
    </button>
  );
}
