import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'cuisine' | 'category' | 'meal';
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const variantStyles = {
    default: 'bg-secondary text-secondary-foreground',
    cuisine: 'bg-accent text-accent-foreground',
    category: 'bg-muted text-muted-foreground',
    meal: 'bg-primary/10 text-primary'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs ${variantStyles[variant]}`}>
      {children}
    </span>
  );
}
