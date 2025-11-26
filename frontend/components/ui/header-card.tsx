import { CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

interface HeaderCardProps {
  // Basic props
  title: string;
  description?: string;
  icon?: ReactNode;
  
  // Styling props
  gradientFrom?: string;
  gradientTo?: string;
  variant?: "default" | "compact" | "elegant";
  backgroundStyle?: "gradient" | "glass" | "solid" | "pattern";
  
  // Layout props
  showActionArea?: boolean;
  actionArea?: ReactNode;
  
  // Custom class names
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

const HeaderCard = ({
  title,
  description,
  icon,
  gradientFrom = "from-blue-500",
  gradientTo = "to-indigo-600",
  variant = "default",
  backgroundStyle = "gradient",
  showActionArea = false,
  actionArea,
  className = "",
  titleClassName = "",
  descriptionClassName = "",
}: HeaderCardProps) => {
  const isCompact = variant === "compact";
  const isElegant = variant === "elegant";

  // Background styles based on selection
  const getBackgroundStyle = () => {
    switch (backgroundStyle) {
      case "glass":
        return "bg-white/15 backdrop-blur-md border border-white/25 shadow-2xl";
      case "solid":
        return "bg-slate-700 shadow-xl";
      case "pattern":
        return `bg-gradient-to-r ${gradientFrom} ${gradientTo} relative overflow-visible`;
      default:
        return `bg-gradient-to-br ${gradientFrom} ${gradientTo} shadow-lg`;
    }
  };

  // Pattern overlay for pattern background
  const PatternOverlay = () => (
    <div className="absolute inset-0 opacity-15">
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 25px 25px, white 2%, transparent 2.5%)`,
        backgroundSize: '50px 50px'
      }} />
    </div>
  );

  // Default icon dengan desain yang lebih modern
  const defaultIcon = (
    <div className={`flex items-center justify-center rounded-2xl backdrop-blur-sm border border-white/25 shadow-lg ${
      isCompact 
        ? "h-10 w-10" 
        : isElegant 
          ? "h-16 w-16 rounded-3xl" 
          : "h-14 w-14"
    } ${
      backgroundStyle === "glass" 
        ? "bg-white/25" 
        : "bg-white/20"
    } transition-all duration-300 hover:scale-105 hover:bg-white/25`}>
      {icon || (
        <svg 
          className={
            isCompact ? "h-5 w-5" : 
            isElegant ? "h-7 w-7" : "h-6 w-6"
          } 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      )}
    </div>
  );

  return (
    <div className="relative overflow-visible">
      <CardHeader 
        className={`
          text-white rounded-2xl relative overflow-visible
          transition-all duration-500 ease-out
          hover:shadow-xl
          ${getBackgroundStyle()}
          ${className}
          ${
            isCompact ? "p-4" : 
            isElegant ? "p-8" : "p-6"
          }
        `}
      >
        {backgroundStyle === "pattern" && <PatternOverlay />}
        
        <div className={`relative flex flex-col space-y-4 ${
          showActionArea ? "md:flex-row md:items-center md:justify-between md:space-y-0" : ""
        }`}>
          <div className={`flex items-center space-x-3 md:space-x-4 ${
            isElegant ? "space-x-5" : ""
          }`}>
            {defaultIcon}
            <div className="flex-1 space-y-2">
              <CardTitle className={`
                font-bold text-white tracking-tight
                ${titleClassName}
                ${
                  isCompact ? "text-lg" : 
                  isElegant ? "text-3xl font-semibold" : "text-2xl"
                }
              `}>
                {title}
              </CardTitle>
              {description && (
                <p className={`
                  text-white/90 leading-relaxed
                  ${descriptionClassName}
                  ${
                    isCompact ? "text-sm" : 
                    isElegant ? "text-base font-light" : "text-sm"
                  }
                `}>
                  {description}
                </p>
              )}
            </div>
          </div>
          
          {showActionArea && actionArea && (
            <div className="flex-shrink-0 relative z-10 overflow-visible">
              {actionArea}
            </div>
          )}
        </div>

        {/* Elegant accent line */}
        {isElegant && (
          <div className="absolute bottom-0 left-0 w-1/3 h-1 bg-gradient-to-r from-cyan-300 to-blue-400 rounded-full" />
        )}
      </CardHeader>
    </div>
  );
};

export default HeaderCard;