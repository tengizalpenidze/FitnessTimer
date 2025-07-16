interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
  disabled?: boolean;
}

export function SimpleButton({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '',
  disabled = false 
}: ButtonProps) {
  const baseClasses = "px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-lg",
    secondary: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-lg", 
    outline: "border-2 border-gray-400 text-white hover:bg-gray-700 hover:border-gray-300 focus:ring-gray-400 shadow-md"
  };
  
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";
  
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  );
}