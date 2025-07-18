import { useState, useRef } from "react";

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
  className?: string;
}

export function Slider({ 
  value, 
  onChange, 
  min, 
  max, 
  step = 1, 
  label,
  className = '' 
}: SliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const percentage = ((value - min) / (max - min)) * 100;
  
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    updateValue(e);
    // Capture pointer to ensure we get move/up events even if pointer leaves element
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  
  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      updateValue(e);
    }
  };
  
  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };
  
  const updateValue = (e: React.PointerEvent) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const rawValue = (percentage / 100) * (max - min) + min;
    const steppedValue = Math.round(rawValue / step) * step;
    const clampedValue = Math.max(min, Math.min(max, steppedValue));
    
    onChange(clampedValue);
  };
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-200">{label}</label>
        <span className="text-sm text-white bg-gray-600 px-2 py-1 rounded font-mono">{value}</span>
      </div>
      <div 
        ref={sliderRef}
        className="relative h-6 flex items-center cursor-pointer touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Background track */}
        <div className="absolute w-full h-2 bg-gray-700 rounded-lg"></div>
        
        {/* Filled track */}
        <div 
          className="absolute h-2 bg-blue-500 rounded-lg transition-all duration-150" 
          style={{ width: `${percentage}%` }}
        ></div>
        
        {/* Thumb */}
        <div 
          className={`absolute w-5 h-5 bg-white border-2 border-blue-500 rounded-full cursor-grab transition-all duration-150 ${
            isDragging ? 'scale-110 cursor-grabbing shadow-lg' : 'hover:scale-105'
          }`}
          style={{ left: `calc(${percentage}% - 10px)` }}
        ></div>
      </div>
    </div>
  );
}