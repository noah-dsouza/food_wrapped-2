import React from 'react';
import { motion } from 'motion/react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hover = false, onClick }: CardProps) {
  const Component = hover ? motion.div : 'div';
  const hoverProps = hover ? {
    whileHover: { y: -2 },
    transition: { duration: 0.2 }
  } : {};

  return (
    <Component
      onClick={onClick}
      className={`bg-card rounded-xl border border-border p-6 ${hover ? 'hover:shadow-md cursor-pointer' : 'shadow-sm'} transition-shadow ${className}`}
      {...hoverProps}
    >
      {children}
    </Component>
  );
}
