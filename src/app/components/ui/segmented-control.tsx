import React from 'react';
import { motion } from 'motion/react';

interface SegmentedControlProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function SegmentedControl({ options, value, onChange, label }: SegmentedControlProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm text-foreground/80">
          {label}
        </label>
      )}
      <div className="inline-flex bg-secondary rounded-xl p-1 gap-1">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`relative px-4 py-2 rounded-lg text-sm transition-colors ${
              value === option
                ? 'text-primary-foreground'
                : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            {value === option && (
              <motion.div
                layoutId="activeSegment"
                className="absolute inset-0 bg-primary rounded-lg"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative z-10">{option}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
