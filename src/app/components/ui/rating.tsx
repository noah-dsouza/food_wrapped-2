import React from 'react';

interface RatingProps {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  readonly?: boolean;
}

export function Rating({ value, onChange, max = 5, readonly = false }: RatingProps) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: max }, (_, i) => i + 1).map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => !readonly && onChange?.(rating)}
          disabled={readonly}
          className={`h-8 w-2 rounded-sm transition-all ${
            rating <= value 
              ? 'bg-primary' 
              : 'bg-muted hover:bg-muted-foreground/20'
          } ${!readonly ? 'cursor-pointer' : 'cursor-default'}`}
        />
      ))}
    </div>
  );
}
