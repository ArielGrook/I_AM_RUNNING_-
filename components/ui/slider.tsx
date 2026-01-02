import React, { useRef, useCallback, useState, useEffect } from 'react'

interface SliderProps {
  value: number[]
  onValueChange: (value: number[]) => void
  min: number
  max: number
  step?: number
  className?: string
  orientation?: string
}

export function Slider({ value, onValueChange, min, max, step = 1, className, orientation }: SliderProps) {
  const [localValue, setLocalValue] = useState(value[0] || 0);
  const rafRef = useRef<number | null>(null);
  const pendingValueRef = useRef<number | null>(null);
  const isVertical = orientation === 'vertical';
  
  // Sync local value when prop value changes externally
  useEffect(() => {
    setLocalValue(value[0] || 0);
  }, [value]);
  
  // Throttled callback using requestAnimationFrame for smooth 60fps updates
  const throttledOnChange = useCallback((newValue: number) => {
    pendingValueRef.current = newValue;
    
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        if (pendingValueRef.current !== null) {
          onValueChange([pendingValueRef.current]);
          pendingValueRef.current = null;
        }
        rafRef.current = null;
      });
    }
  }, [onValueChange]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    // Update local state immediately for smooth visual feedback
    setLocalValue(newValue);
    // Throttle the callback to reduce update frequency
    throttledOnChange(newValue);
  }, [throttledOnChange]);
  
  const percentage = ((localValue - min) / (max - min)) * 100;
  
  return (
    <div className={`slider-wrapper ${isVertical ? 'slider-wrapper-vertical' : 'slider-wrapper-horizontal'} ${className || ''}`}>
      <div 
        className="slider-fill"
        style={{
          [isVertical ? 'height' : 'width']: `${percentage}%`,
        }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={localValue}
        onChange={handleChange}
        className={`slider-input ${isVertical ? 'slider-vertical' : 'slider-horizontal'}`}
      />
    </div>
  )
}

