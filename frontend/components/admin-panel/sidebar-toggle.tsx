import { ChevronLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarToggleProps {
  isOpen: boolean | undefined;
  setIsOpen?: () => void;
}

export function SidebarToggle({ isOpen, setIsOpen }: SidebarToggleProps) {
  return (
    <div className="invisible lg:visible absolute top-[18px] -right-[26px] z-20">
      <Button
        onClick={() => setIsOpen?.()}
          className={cn(
            "rounded-md w-8 h-8 relative overflow-hidden group", // Increased size
            "bg-gradient-to-br from-cyan-200 to-cyan-600 hover:from-cyan-400 hover:to-cyan-600",
            "shadow-lg hover:shadow-xl transition-all duration-300"
          )}
        variant="outline"
        size="icon"
      >
        <ChevronLeft
          className={cn(
            "h-6 w-6 transition-transform ease-in-out duration-700",
            isOpen === false ? "rotate-180" : "rotate-0"
          )}
        />
      </Button>
    </div>
  );
}
