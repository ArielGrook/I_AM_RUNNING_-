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
  const frameRef = useRef<number | null>(null);
  const pendingValueRef = useRef<number | null>(null);
  const isVertical = orientation === 'vertical';
  const fillRef = useRef<HTMLDivElement | null>(null);
  const lastRenderValueRef = useRef<number>(localValue);
  
  // Sync local value when prop value changes externally (only when not dragging)
  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalValue(value[0] || 0);
    }
  }, [value]);
  
  const applyFillTransform = useCallback((newValue: number) => {
    if (!fillRef.current) return;
    if (newValue === lastRenderValueRef.current) return;

    const percentage = Math.max(0, Math.min(100, ((newValue - min) / (max - min)) * 100));
    const scale = percentage / 100;
    const transform = isVertical ? `scaleY(${scale})` : `scaleX(${scale})`;

    fillRef.current.style.transform = transform;
    lastRenderValueRef.current = newValue;
  }, [isVertical, max, min]);

  // 60fps-scheduled update to parent
  const scheduleUpdate = useCallback((newValue: number) => {
    pendingValueRef.current = newValue;

    if (frameRef.current === null) {
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        if (pendingValueRef.current !== null) {
          onValueChange([pendingValueRef.current]);
        }
      });
    }
  }, [onValueChange]);
  
  // Handle input change - update local state + throttled parent update
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setLocalValue(newValue);
    applyFillTransform(newValue);
    // Call parent with animation-frame pacing for real-time visual feedback
    scheduleUpdate(newValue);
  }, [applyFillTransform, scheduleUpdate]);
  
  // On mouse/touch down - mark dragging start
  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);
  
  // On mouse/touch up - commit final value to parent
  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
    // Always commit final value on release
    scheduleUpdate(localValue);
  }, [localValue, scheduleUpdate]);

  useEffect(() => {
    applyFillTransform(localValue);
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [applyFillTransform, localValue]);
  
  return (
    <div className={`slider-wrapper ${isVertical ? 'slider-wrapper-vertical' : 'slider-wrapper-horizontal'} ${className || ''}`}>
      <div 
        className="slider-fill"
        style={{
          transformOrigin: isVertical ? 'bottom center' : 'left center',
          willChange: 'transform',
          transition: isDraggingRef.current ? 'none' : 'transform 80ms ease-out',
        }}
        ref={fillRef}
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

