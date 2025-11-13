"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

interface SliderProps extends React.ComponentProps<typeof SliderPrimitive.Root> {
  showTooltip?: boolean
  tooltipPosition?: "top" | "bottom"
  variant?: "default" | "green-gradient" | "secondary" | "success" | "warning" | "destructive"
  size?: "sm" | "md" | "lg" | "xl"
}

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  showTooltip = false,
  tooltipPosition = "top",
  variant = "default",
  size = "lg", // Default size diubah ke lg untuk track lebih besar
  ...props
}: SliderProps) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min],
    [value, defaultValue, min]
  )

  const [localValues, setLocalValues] = React.useState(_values)
  const [isDragging, setIsDragging] = React.useState(false)

  React.useEffect(() => {
    setLocalValues(_values)
  }, [_values])

  const getVariantStyles = () => {
    const variants = {
      default: {
        track: "bg-gray-200 dark:bg-gray-700",
        range: "bg-blue-500 dark:bg-blue-600",
        thumb: "bg-blue-500 border-blue-600 hover:bg-blue-600"
      },
      "green-gradient": {
        track: "bg-green-200/80 dark:bg-green-700/80",
        range: "bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600",
        thumb: "bg-gradient-to-br from-green-400 to-emerald-600 border-emerald-700 hover:from-green-500 hover:to-emerald-700 shadow-lg shadow-green-500/25"
      },
      secondary: {
        track: "bg-gray-200 dark:bg-gray-700",
        range: "bg-gray-500 dark:bg-gray-400",
        thumb: "bg-gray-500 border-gray-600 hover:bg-gray-600"
      },
      success: {
        track: "bg-gray-200 dark:bg-gray-700",
        range: "bg-green-500 dark:bg-green-600",
        thumb: "bg-green-500 border-green-600 hover:bg-green-600"
      },
      warning: {
        track: "bg-gray-200 dark:bg-gray-700",
        range: "bg-orange-500 dark:bg-orange-600",
        thumb: "bg-orange-500 border-orange-600 hover:bg-orange-600"
      },
      destructive: {
        track: "bg-gray-200 dark:bg-gray-700",
        range: "bg-red-500 dark:bg-red-600",
        thumb: "bg-red-500 border-red-600 hover:bg-red-600"
      }
    }
    return variants[variant]
  }

  const getSizeStyles = () => {
    const sizes = {
      sm: {
        track: "h-2 data-[orientation=vertical]:w-2 rounded-lg",
        thumb: "size-4"
      },
      md: {
        track: "h-3 data-[orientation=vertical]:w-3 rounded-xl",
        thumb: "size-5"
      },
      lg: {
        track: "h-4 data-[orientation=vertical]:w-4 rounded-xl",
        thumb: "size-6"
      },
      xl: {
        track: "h-5 data-[orientation=vertical]:w-5 rounded-2xl",
        thumb: "size-7"
      }
    }
    return sizes[size]
  }

  const variantStyles = getVariantStyles()
  const sizeStyles = getSizeStyles()

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      data-variant={variant}
      data-size={size}
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col group",
        className
      )}
      onValueChange={(value) => {
        setLocalValues(value)
        props.onValueChange?.(value)
      }}
      onPointerDown={() => setIsDragging(true)}
      onPointerUp={() => setIsDragging(false)}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          "relative grow overflow-hidden transition-all duration-300 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full",
          "shadow-inner border border-gray-300/50 dark:border-gray-600/50",
          variantStyles.track,
          sizeStyles.track
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            "absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full transition-all duration-300 ease-out",
            "group-hover:shadow-lg group-hover:shadow-green-500/20",
            variant === "green-gradient" && "shadow-lg shadow-green-500/20",
            variantStyles.range
          )}
        />
      </SliderPrimitive.Track>
      
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className={cn(
            "block shrink-0 rounded-full border-2 border-white shadow-xl transition-all duration-300 hover:scale-110 focus-visible:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
            "group-hover:shadow-2xl group-hover:shadow-green-500/30",
            variant === "green-gradient" && "shadow-xl shadow-green-500/30",
            variantStyles.thumb,
            sizeStyles.thumb,
            isDragging && "scale-110 shadow-2xl"
          )}
        >
          {showTooltip && (
            <div className={cn(
              "absolute px-3 py-1.5 text-sm font-semibold text-white bg-gradient-to-br from-green-600 to-emerald-700 rounded-lg whitespace-nowrap transition-all duration-300 border border-green-500/50",
              "shadow-lg shadow-green-500/25",
              tooltipPosition === "top" ? "bottom-full mb-3" : "top-full mt-3",
              isDragging ? "opacity-100 scale-100" : "opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100"
            )}>
              {localValues[index]}
              <div className={cn(
                "absolute left-1/2 transform -translate-x-1/2 border-4 border-transparent",
                tooltipPosition === "top" 
                  ? "top-full border-t-green-600" 
                  : "bottom-full border-b-green-600"
              )} />
            </div>
          )}
        </SliderPrimitive.Thumb>
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
export type { SliderProps }