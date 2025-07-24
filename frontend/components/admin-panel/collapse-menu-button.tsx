"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Dot, LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DropdownMenuArrow } from "@radix-ui/react-dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

type Submenu = {
  href: string;
  label: string;
  active: boolean;
  disabled?: boolean; // Disabled optional on Submenu
};

interface CollapseMenuButtonProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  submenus: Submenu[];
  isOpen: boolean | undefined;
  disabled?: boolean; // Disabled optional on CollapseMenuButton
  className?: string;
}

export function CollapseMenuButton({
  icon: Icon,
  label,
  active,
  submenus,
  isOpen,
  disabled = false, // Default disabled to false if not provided
  
}: CollapseMenuButtonProps) {
  const isSubmenuActive = submenus.some((submenu) => submenu.active);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(isSubmenuActive);
  const router = useRouter();

  // Handle Button click, prevent navigation if disabled
  const handleButtonClick = (e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    setIsCollapsed(!isCollapsed);
  };

    // const router = useRouter();
    const handleSubmenuClick = (e: React.MouseEvent, disabled: boolean = false) => {
    if (disabled) {
      e.preventDefault(); // Prevent default behavior (navigation)
      router.push("/dashboard"); // Redirect to /dashboard
    }
  };

  return isOpen ? (
    <Collapsible
      open={isCollapsed}
      onOpenChange={setIsCollapsed}
      className="w-full"
    >
      <CollapsibleTrigger
        className="[&[data-state=open]>div>div>svg]:rotate-180 mb-1"
        asChild
      >
        <Button
          variant={active ? "default" : "ghost"}
          className={cn("w-full justify-start h-10 hover:bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300 hover:text-white transition-all duration-300", disabled ? "opacity-50 cursor-not-allowed" : "")}
          onClick={handleButtonClick}
          disabled={disabled} // Handle disabled state
        >
          <div className="w-full items-center flex justify-between">
            <div className="flex items-center">
              <span className="mr-4">
                <Icon size={18} />
              </span>
              <p
                className={cn(
                  "max-w-[150px] truncate",
                  isOpen
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-96 opacity-0"
                )}
              >
                {label}
              </p>
            </div>
            <div
              className={cn(
                "whitespace-nowrap",
                isOpen
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-96 opacity-0"
              )}
            >
              <ChevronDown
                size={18}
                className="transition-transform duration-200"
              />
            </div>
          </div>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        {submenus.map(({ href, label, active, disabled }, index) => (
          <Button
            key={index}
            variant={active ? "default" : "ghost"}
            className={cn("w-full justify-start h-10 hover:bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300 hover:text-white transition-all duration-300 mb-1", disabled ? "opacity-50 cursor-not-allowed" : "")}
            asChild
            disabled={disabled} // Handle submenu disabled state
            onClick={(e) => handleSubmenuClick(e, disabled)} // Handle submenu click
          >
            <Link href={href} className={disabled ? "pointer-events-none" : ""}>
              <span className="mr-4 ml-2">
                <Dot size={18} />
              </span>
              <p
                className={cn(
                  "max-w-[170px] truncate",
                  isOpen
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-96 opacity-0"
                )}
              >
                {label}
              </p>
            </Link>
          </Button>
        ))}
      </CollapsibleContent>
    </Collapsible>
  ) : (
    <DropdownMenu>
      <TooltipProvider disableHoverableContent>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant={active ? "default" : "ghost"}
                className={cn("w-full justify-start h-10 hover:bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300 hover:text-white transition-all duration-300 mb-1",
                  disabled ? "opacity-50 cursor-not-allowed" : ""
                )}
                disabled={disabled} // Handle disabled state on Dropdown
                onClick={(e) => {
                  if (disabled) {
                    e.preventDefault(); // Prevent click if disabled
                  }
                }}
              >
                <div className="w-full items-center flex justify-between">
                  <div className="flex items-center">
                    <span className={cn(isOpen === false ? "" : "mr-4")}>
                      <Icon size={18} />
                    </span>
                    <p
                      className={cn(
                        "max-w-[200px] truncate",
                        isOpen === false ? "opacity-0" : "opacity-100"
                      )}
                    >
                      {label}
                    </p>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" align="start" alignOffset={2}>
            {label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent side="right" sideOffset={25} align="start">
        <DropdownMenuLabel className="max-w-[190px] truncate">
          {label}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {submenus.map(({ href, label, disabled }, index) => (
          <DropdownMenuItem key={index} asChild>
            <Link className={cn(disabled ? "cursor-not-allowed" : "")} href={href} onClick={(e) => {
              if (disabled) {
                e.preventDefault(); // Prevent navigation if disabled
              }
            }}>
              <p className="max-w-[180px] truncate">{label}</p>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuArrow className="fill-border" />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
