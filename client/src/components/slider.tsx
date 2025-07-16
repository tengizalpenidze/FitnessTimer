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
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-200">{label}</label>
        <span className="text-sm text-white bg-gray-600 px-2 py-1 rounded font-mono">{value}</span>
      </div>
      <div className="relative h-6 flex items-center">
        {/* Background track */}
        <div className="absolute w-full h-2 bg-gray-700 rounded-lg"></div>
        
        {/* Filled track */}
        <div 
          className="absolute h-2 bg-blue-500 rounded-lg transition-all duration-200" 
          style={{ width: `${percentage}%` }}
        ></div>
        
        {/* Slider input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="absolute w-full h-2 opacity-0 cursor-pointer"
        />
        
        {/* Thumb */}
        <div 
          className="absolute w-5 h-5 bg-white border-2 border-blue-500 rounded-full cursor-pointer transition-all duration-200 hover:scale-110"
          style={{ left: `calc(${percentage}% - 10px)` }}
        ></div>
      </div>
    </div>
  );
}