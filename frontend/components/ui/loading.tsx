// components/ui/loading.tsx
import { cn } from "@/lib/utils";

interface LoadingProps {
    size?: "sm" | "md" | "lg" | "xl";
    text?: string;
    subtext?: string;
    className?: string;
    variant?: "default" | "primary" | "success" | "warning" | "destructive";
}

export default function Loading({
    size = "md",
    text = "Memuat data...",
    subtext,
    className,
    variant = "primary"
}: LoadingProps) {
    const sizeClasses = {
        sm: "h-6 w-6",
        md: "h-12 w-12",
        lg: "h-16 w-16",
        xl: "h-20 w-20"
    };

    const textSizes = {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
        xl: "text-xl"
    };

    const variantColors = {
        default: "text-gray-600",
        primary: "text-primary",
        success: "text-green-500",
        warning: "text-yellow-500",
        destructive: "text-destructive"
    };

    return (
        <div className={cn("flex flex-col items-center justify-center py-12", className)}>
            <div className="relative mb-4">
                {/* Background glow effect */}
                <div className={cn(
                    "absolute inset-0 rounded-full animate-pulse opacity-20",
                    variant === "primary" && "bg-primary",
                    variant === "success" && "bg-green-500",
                    variant === "warning" && "bg-yellow-500",
                    variant === "destructive" && "bg-destructive",
                    variant === "default" && "bg-gray-400"
                )}></div>

                {/* Main spinner with gradient */}
                <div className={cn(
                    "relative rounded-full border-2 border-transparent",
                    "bg-gradient-to-r from-background to-background",
                    "before:content-[''] before:absolute before:inset-[-2px] before:rounded-full before:animate-spin before:border-2 before:border-transparent",
                    variant === "primary" && "before:from-primary/20 before:via-primary before:to-primary/20",
                    variant === "success" && "before:from-green-500/20 before:via-green-500 before:to-green-500/20",
                    variant === "warning" && "before:from-yellow-500/20 before:via-yellow-500 before:to-yellow-500/20",
                    variant === "destructive" && "before:from-destructive/20 before:via-destructive before:to-destructive/20",
                    variant === "default" && "before:from-gray-400/20 before:via-gray-400 before:to-gray-400/20",
                    sizeClasses[size]
                )}></div>
            </div>

            {text && (
                <p className={cn(
                    "font-medium mb-1 animate-pulse",
                    variantColors[variant],
                    textSizes[size]
                )}>
                    {text}
                </p>
            )}

            {subtext && (
                <p className={cn(
                    "text-center max-w-md animate-pulse",
                    size === "sm" ? "text-xs" : "text-sm",
                    variant === "default" ? "text-gray-500" : "text-muted-foreground"
                )}>
                    {subtext}
                </p>
            )}
        </div>
    );
}

// Variasi loading untuk halaman penuh dengan efek glassmorphism
export function PageLoading({ 
  title = "Memuat aplikasi", 
  description = "Mohon tunggu sebentar..." 
}: { title?: string; description?: string }) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-background/95 to-muted/95 backdrop-blur-xl flex items-center justify-center z-50">
      <div className="bg-card/90 backdrop-blur-md rounded-3xl shadow-xl p-8 max-w-md mx-4 border border-border/30">
        <div className="flex flex-col items-center space-y-6">
          {/* Animated logo/brand mark */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-xl animate-pulse"></div>
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-white/90 flex items-center justify-center">
                <div className="relative w-6 h-6">
                  {/* Menggunakan animasi bawaan Tailwind */}
                  <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
                  <div className="absolute inset-0 rounded-full border-2 border-primary/40 animate-spin"></div>
                  <div className="absolute inset-0 rounded-full border-2 border-primary animate-spin-reverse" style={{ animation: 'spin 2s linear infinite reverse' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Text content */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              {title}
            </h3>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>

          {/* Progress indicator */}
          <div className="w-full max-w-xs">
            <div className="relative h-2.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary via-secondary to-primary rounded-full" 
                   style={{ 
                     width: '40%',
                     animation: 'progress-bar 1.5s ease-in-out infinite'
                   }}></div>
            </div>
          </div>

          {/* Status messages */}
          <div className="flex flex-col space-y-2 w-full max-w-xs mt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Menghubungkan ke server</span>
              <span className="text-primary font-medium animate-pulse">35%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Mengambil data</span>
              <span className="text-secondary font-medium animate-pulse" style={{ animationDelay: '0.2s' }}>65%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Menyiapkan antarmuka</span>
              <span className="text-muted-foreground animate-pulse" style={{ animationDelay: '0.4s' }}>90%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Background animation elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-blob" 
             style={{ 
               animation: 'blob 7s infinite',
               opacity: 0.6
             }}></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-secondary/5 rounded-full blur-3xl animate-blob" 
             style={{ 
               animation: 'blob 7s infinite',
               animationDelay: '2s',
               opacity: 0.6
             }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-accent/5 rounded-full blur-3xl animate-blob" 
             style={{ 
               animation: 'blob 7s infinite',
               animationDelay: '4s',
               opacity: 0.6
             }}></div>
      </div>
    </div>
  );
}


// Variasi loading untuk tabel/data grid yang lebih realistis
export function TableLoading({ rowCount = 5, colCount = 4 }: { rowCount?: number; colCount?: number }) {
    return (
        <div className="space-y-3 animate-pulse">
            {/* Table header */}
            <div className="flex justify-between items-center p-4 bg-muted/30 rounded-t-lg">
                <div className="h-6 bg-muted rounded w-1/4"></div>
                <div className="h-8 bg-muted rounded w-32"></div>
            </div>

            {/* Table rows */}
            {Array.from({ length: rowCount }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg bg-card">
                    {/* Checkbox/avatar column */}
                    <div className="h-5 w-5 bg-muted rounded"></div>

                    {/* Dynamic columns */}
                    {Array.from({ length: colCount }).map((_, colIndex) => (
                        <div key={colIndex} className="flex-1 space-y-2">
                            <div
                                className={cn(
                                    "h-4 bg-muted rounded",
                                    colIndex === 0 ? "w-3/4" :
                                        colIndex === colCount - 1 ? "w-1/3" :
                                            "w-1/2"
                                )}
                            ></div>
                            {colIndex === 0 && (
                                <div className="h-3 bg-muted rounded w-1/2"></div>
                            )}
                        </div>
                    ))}

                    {/* Action buttons */}
                    <div className="flex space-x-2">
                        <div className="h-8 w-8 bg-muted rounded"></div>
                        <div className="h-8 w-8 bg-muted rounded"></div>
                    </div>
                </div>
            ))}

            {/* Table footer */}
            <div className="flex justify-between items-center p-4 bg-muted/30 rounded-b-lg">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="flex space-x-2">
                    <div className="h-8 w-8 bg-muted rounded"></div>
                    <div className="h-8 w-8 bg-muted rounded"></div>
                    <div className="h-8 w-8 bg-muted rounded"></div>
                    <div className="h-8 w-8 bg-muted rounded"></div>
                </div>
            </div>
        </div>
    );
}

// Loading untuk card/dashboard
export function CardLoading({ cardCount = 3 }: { cardCount?: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {Array.from({ length: cardCount }).map((_, i) => (
                <div key={i} className="bg-card border rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="h-5 bg-muted rounded w-1/3"></div>
                        <div className="h-8 w-8 bg-muted rounded-full"></div>
                    </div>
                    <div className="h-8 bg-muted rounded w-2/3"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-2 bg-muted rounded w-4/5"></div>
                    <div className="pt-4">
                        <div className="h-2 bg-muted rounded-full w-full"></div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Loading untuk form
export function FormLoading({ fieldCount = 4 }: { fieldCount?: number }) {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="space-y-2">
                <div className="h-5 bg-muted rounded w-1/4"></div>
                <div className="h-10 bg-muted rounded-md"></div>
            </div>

            {Array.from({ length: fieldCount - 1 }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <div className="h-5 bg-muted rounded w-1/3"></div>
                    <div className="h-10 bg-muted rounded-md"></div>
                </div>
            ))}

            <div className="flex space-x-4 pt-4">
                <div className="h-10 bg-muted rounded w-24"></div>
                <div className="h-10 bg-muted rounded w-24"></div>
            </div>
        </div>
    );
}