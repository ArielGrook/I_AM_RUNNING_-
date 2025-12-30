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
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value[0] || 0}
      onChange={(e) => onValueChange([parseInt(e.target.value)])}
      className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${className}`}
    />
  )
}
