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
  const isDraggingRef = useRef(false);
  const lastCallRef = useRef(0);
  const isVertical = orientation === 'vertical';
  
  // Sync local value when prop value changes externally (only when not dragging)
  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalValue(value[0] || 0);
    }
  }, [value]);
  
  // Throttled call to parent - max 30fps during drag for performance
  const throttledUpdate = useCallback((newValue: number) => {
    const now = Date.now();
    if (now - lastCallRef.current >= 33) { // ~30fps throttle
      lastCallRef.current = now;
      onValueChange([newValue]);
    }
  }, [onValueChange]);
  
  // Handle input change - update local state + throttled parent update
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setLocalValue(newValue);
    // Call parent with throttling for real-time visual feedback
    throttledUpdate(newValue);
  }, [throttledUpdate]);
  
  // On mouse/touch down - mark dragging start
  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);
  
  // On mouse/touch up - commit final value to parent
  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
    // Always commit final value on release
    onValueChange([localValue]);
  }, [localValue, onValueChange]);
  
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
        onMouseDown={handleDragStart}
        onMouseUp={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchEnd={handleDragEnd}
        className={`slider-input ${isVertical ? 'slider-vertical' : 'slider-horizontal'}`}
      />
    </div>
  )
}

