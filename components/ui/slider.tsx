import React from 'react'

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
  const percentage = ((value[0] || 0) - min) / (max - min) * 100;
  const isVertical = orientation === 'vertical';
  
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
        value={value[0] || 0}
        onChange={(e) => onValueChange([parseInt(e.target.value)])}
        className={`slider-input ${isVertical ? 'slider-vertical' : 'slider-horizontal'}`}
      />
    </div>
  )
}

