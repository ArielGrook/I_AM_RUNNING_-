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
  const isVertical = orientation === 'vertical';
  
  // Sync local value when prop value changes externally (only when not dragging)
  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalValue(value[0] || 0);
    }
  }, [value]);
  
  // Handle input change - only update local state (no parent callback during drag)
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setLocalValue(newValue);
  }, []);
  
  // On mouse/touch down - mark dragging start
  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);
  
  // On mouse/touch up - commit value to parent
  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
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

