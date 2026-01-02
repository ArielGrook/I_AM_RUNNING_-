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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingValueRef = useRef<number | null>(null);
  const isVertical = orientation === 'vertical';
  const isDraggingRef = useRef(false);
  
  // Sync local value when prop value changes externally (but not during drag)
  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalValue(value[0] || 0);
    }
  }, [value]);
  
  // Debounced callback with requestAnimationFrame for ultra-smooth updates
  const debouncedOnChange = useCallback((newValue: number) => {
    pendingValueRef.current = newValue;
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Use requestAnimationFrame for visual smoothness + debounce for callback
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        // Debounce the actual callback by 50ms to reduce update frequency
        timeoutRef.current = setTimeout(() => {
          if (pendingValueRef.current !== null) {
            onValueChange([pendingValueRef.current]);
            pendingValueRef.current = null;
          }
          rafRef.current = null;
        }, 50);
      });
    }
  }, [onValueChange]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    // Update local state immediately for smooth visual feedback (CSS handles transition)
    setLocalValue(newValue);
    // Debounce the callback to reduce update frequency
    debouncedOnChange(newValue);
  }, [debouncedOnChange]);
  
  const handleMouseDown = useCallback(() => {
    isDraggingRef.current = true;
  }, []);
  
  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    // Flush pending value on mouse up
    if (pendingValueRef.current !== null && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      onValueChange([pendingValueRef.current]);
      pendingValueRef.current = null;
    }
  }, [onValueChange]);
  
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
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        className={`slider-input ${isVertical ? 'slider-vertical' : 'slider-horizontal'}`}
      />
    </div>
  )
}

