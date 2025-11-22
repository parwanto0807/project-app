"use client";

import Link from "next/link";
import { Ellipsis, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getMenuList } from "@/lib/menu-list";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverTrigger,
  PopoverContent
} from "@/components/ui/popover"

interface MenuProps {
  isOpen?: boolean;
  role: string;
  theme?: 'dark' | 'light';
}

interface MenuItemProps {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  active: boolean;
  disabled?: boolean;
  isOpen?: boolean;
  hasSubmenu?: boolean;
  theme?: 'dark' | 'light';
}

const MenuItem = ({
  href,
  label,
  icon: Icon,
  active,
  disabled,
  isOpen,
  hasSubmenu = false,
  theme = 'dark'
}: MenuItemProps) => (
  <TooltipProvider disableHoverableContent>
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start h-10 mb-2 transition-all duration-300",
            "relative group overflow-hidden",
            isOpen ? "w-full justify-start rounded-lg px-3" : "w-10 justify-center rounded-lg",
            theme === 'dark' && cn(
              active
                ? "bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 text-white shadow-lg shadow-cyan-500/20"
                : "bg-gray-800/80 text-gray-300 hover:bg-gray-700 hover:text-white backdrop-blur-sm",
              disabled && "opacity-40 pointer-events-none bg-gray-900/50"
            ),
            theme === 'light' && cn(
              active
                ? "bg-gradient-to-br from-cyan-400 via-blue-400 to-purple-500 text-white shadow-lg shadow-cyan-400/25"
                : "bg-white/90 text-gray-600 hover:bg-gray-50 hover:text-cyan-700 border border-gray-200/80 backdrop-blur-sm",
              disabled && "opacity-40 pointer-events-none bg-gray-100/50"
            )
          )}
          asChild
          disabled={disabled}
        >
          <Link href={href} className="flex items-center relative z-10">
            <div className={cn(
              "absolute inset-0 opacity-0 transition-opacity duration-300",
              active && "opacity-100",
              theme === 'dark' ? "bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10" : "bg-gradient-to-r from-cyan-400/10 via-blue-400/10 to-purple-400/10"
            )} />
            
            <span className={cn(
              "relative transition-transform duration-200",
              !isOpen ? "ml-0" : "mr-2"
            )}>
              <Icon
                width={20}
                height={20}
                className={cn(
                  "transition-all duration-200",
                  theme === 'dark' && active ? "text-white" : "text-current",
                  theme === 'light' && active ? "text-white" : "text-current",
                  !isOpen && "mx-auto"
                )}
              />
              {active && (
                <Sparkles 
                  size={6} 
                  className={cn(
                    "absolute -top-0.5 -right-0.5 animate-ping",
                    theme === 'dark' ? "text-cyan-300" : "text-white"
                  )} 
                />
              )}
            </span>
            <p
              className={cn(
                "max-w-[140px] truncate transition-all duration-300 text-sm font-medium",
                !isOpen ? "w-0 opacity-0" : "w-auto opacity-100",
                theme === 'dark' && active ? "text-white" : "text-current",
                theme === 'light' && active ? "text-white" : "text-current",
                "relative z-10"
              )}
            >
              {label}
            </p>
            
            <div className={cn(
              "absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300 group-hover:w-full",
              active && "w-full"
            )} />
          </Link>
        </Button>
      </TooltipTrigger>
      {!isOpen && (
        <TooltipContent 
          side="right" 
          sideOffset={8}
          className={cn(
            theme === 'dark' ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-800 border-gray-200",
            "z-50 px-2 py-1.5 rounded-lg text-xs shadow-lg border"
          )}
        >
          <div className="flex items-center gap-1">
            <span>{label}</span>
            {hasSubmenu && <ChevronDown size={10} className="opacity-60" />}
          </div>
        </TooltipContent>
      )}
    </Tooltip>
  </TooltipProvider>
);

const SubmenuItem = ({
  href,
  label,
  active,
  isOpen,
  theme = 'dark'
}: {
  href: string;
  label: string;
  active: boolean;
  isOpen?: boolean;
  theme?: 'dark' | 'light';
}) => (
  <TooltipProvider disableHoverableContent>
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>
        <Link
          href={href}
          className={cn(
            "block px-3 py-1.5 text-xs rounded-md transition-all duration-200 hover:scale-[1.02] group relative",
            theme === 'dark'
              ? cn(
                active 
                  ? "bg-cyan-600/20 text-cyan-300 border border-cyan-500/20 shadow" 
                  : "text-gray-400 hover:text-white hover:bg-gray-700/50",
              )
              : cn(
                active 
                  ? "bg-cyan-100 text-cyan-700 border border-cyan-300 shadow" 
                  : "text-gray-600 hover:text-cyan-700 hover:bg-cyan-50/80",
              )
          )}
        >
          <div className={cn(
            "absolute inset-0 rounded-md opacity-0 transition-opacity duration-200 group-hover:opacity-100",
            theme === 'dark' ? "bg-gradient-to-r from-cyan-500/5 to-blue-500/5" : "bg-gradient-to-r from-cyan-400/5 to-blue-400/5"
          )} />
          
          <span className="relative z-10 flex items-center gap-1.5">
            <div className={cn(
              "w-1 h-1 rounded-full transition-all duration-200",
              active 
                ? (theme === 'dark' ? "bg-cyan-400" : "bg-cyan-500")
                : (theme === 'dark' ? "bg-gray-600 group-hover:bg-cyan-400" : "bg-gray-400 group-hover:bg-cyan-400")
            )} />
            <span className="truncate flex-1">{label}</span>
          </span>
        </Link>
      </TooltipTrigger>
      {!isOpen && (
        <TooltipContent 
          side="right" 
          className={cn(
            theme === 'dark' ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-800 border-gray-200",
            "z-50 max-w-xs px-2 py-1.5 rounded-lg text-xs shadow-lg border"
          )}
        >
          {label}
        </TooltipContent>
      )}
    </Tooltip>
  </TooltipProvider>
);

const MenuGroupLabel = ({
  label,
  isOpen,
  theme = 'dark'
}: {
  label: string;
  isOpen?: boolean;
  theme?: 'dark' | 'light';
}) => {
  if (!isOpen) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={100}>
          <TooltipTrigger className="w-full">
            <div className="ml-0.5 w-8 h-8 flex justify-center items-center group mb-1">
              <div className={cn(
                "p-1.5 rounded-lg transition-all duration-200",
                theme === 'dark' 
                  ? "bg-gray-800/50 text-gray-400 hover:bg-gray-700/50" 
                  : "bg-white/50 text-gray-500 hover:bg-gray-100/80",
                "backdrop-blur-sm"
              )}>
                <Ellipsis className="h-3 w-3" />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent 
            side="right" 
            className={cn(
              theme === 'dark' ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-800 border-gray-200",
              "z-20 px-2 py-1.5 rounded-lg text-xs font-medium border"
            )}
          >
            <span className="ml-2">{label}</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="relative px-3 pb-2 pt-3">
      <p className={cn(
        "text-xs font-semibold uppercase tracking-wider max-w-[160px] truncate relative",
        theme === 'dark' ? "text-gray-400" : "text-gray-500",
        "flex items-center gap-1.5 text-[10px]"
      )}>
        <span className={cn(
          "flex-1 h-px",
          theme === 'dark' ? "bg-gray-700" : "bg-gray-300"
        )} />
        <span className="px-1.5">{label}</span>
        <span className={cn(
          "flex-1 h-px",
          theme === 'dark' ? "bg-gray-700" : "bg-gray-300"
        )} />
      </p>
    </div>
  );
};

export function Menu({ isOpen, role, theme = 'dark' }: MenuProps) {
  const pathname = usePathname();
  const menuList = getMenuList(pathname, role);

  const [openSubmenuIndex, setOpenSubmenuIndex] = useState<string | null>(null);

  const toggleSubmenu = (key: string) => {
    setOpenSubmenuIndex((prev) => (prev === key ? null : key));
  };

  return (
    <ScrollArea className="h-[calc(95vh-70px)]">
      <nav className={cn(
        "mt-1 h-full w-full rounded-xl p-1",
        theme === 'dark' 
          ? "bg-gray-900/95 backdrop-blur-sm" 
          : "bg-white/95 backdrop-blur-sm border border-gray-200/50"
      )}>
        <ul className="flex flex-col items-start space-y-0.5 px-1">
          {menuList.map(({ groupLabel, menus }, groupIndex) => (
            <li className={cn("w-full", groupLabel ? "pt-0" : "")} key={`group-${groupIndex}`}>
              {groupLabel && (
                <MenuGroupLabel label={groupLabel} isOpen={isOpen} theme={theme} />
              )}

              {menus.map((menu, menuIndex) => {
                const {
                  href,
                  label,
                  icon: Icon,
                  active,
                  submenus = [],
                  disabled,
                } = menu;

                const menuKey = `menu-${groupIndex}-${menuIndex}`;
                const isSubmenuOpen = openSubmenuIndex === menuKey;

                return submenus.length === 0 ? (
                  <div className="w-full" key={menuKey}>
                    <MenuItem
                      href={href}
                      label={label}
                      icon={Icon}
                      active={active}
                      disabled={disabled}
                      isOpen={isOpen}
                      hasSubmenu={false}
                      theme={theme}
                    />
                  </div>
                ) : (
                  <div className="w-full relative group" key={menuKey}>
                    <TooltipProvider disableHoverableContent>
                      <Tooltip delayDuration={100}>
                        {isOpen ? (
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => toggleSubmenu(menuKey)}
                              className={cn(
                                "w-full flex items-center justify-between px-3 py-2 rounded-lg mb-1 text-sm font-medium transition-all duration-200 group",
                                "relative hover:scale-[1.02]",
                                theme === 'dark' && cn(
                                  active
                                    ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                                    : "bg-gray-800/80 text-gray-300 hover:bg-gray-700 hover:text-white backdrop-blur-sm",
                                  disabled && "opacity-40 pointer-events-none bg-gray-900/50"
                                ),
                                theme === 'light' && cn(
                                  active
                                    ? "bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg shadow-cyan-400/25"
                                    : "bg-white/90 text-gray-600 hover:bg-gray-50 hover:text-cyan-700 border border-gray-200/80 backdrop-blur-sm",
                                  disabled && "opacity-40 pointer-events-none bg-gray-100/50"
                                )
                              )}
                            >
                              <div className="flex items-center space-x-2 relative z-10">
                                <Icon width={16} height={16} className={cn(
                                  theme === 'dark' && active ? "text-white" : "text-current",
                                  theme === 'light' && active ? "text-white" : "text-current"
                                )} />
                                <span className="text-sm">{label}</span>
                              </div>
                              <div className="relative z-10 transition-transform duration-200">
                                {isSubmenuOpen ? (
                                  <ChevronUp className="w-3 h-3" />
                                ) : (
                                  <ChevronDown className="w-3 h-3" />
                                )}
                              </div>
                            </button>
                          </TooltipTrigger>
                        ) : (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                className={cn(
                                  "w-10 h-10 flex items-center justify-center rounded-lg mb-1 transition-all duration-200 hover:scale-110",
                                  theme === 'dark' && cn(
                                    active
                                      ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                                      : "bg-cyan-950 text-gray-300 hover:bg-blue-500 hover:text-white backdrop-blur-sm",
                                    disabled && "opacity-40 pointer-events-none bg-gray-900/50"
                                  ),
                                  theme === 'light' && cn(
                                    active
                                      ? "bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg shadow-cyan-400/25"
                                      : "bg-cyan-200 text-gray-600 hover:bg-cyan-600 hover:text-white border border-gray-200/80 backdrop-blur-sm",
                                    disabled && "opacity-40 pointer-events-none bg-gray-100/50"
                                  )
                                )}
                              >
                                <Icon className="h-4 w-4" />
                              </button>
                            </PopoverTrigger>

                            <PopoverContent
                              side="right"
                              align="start"
                              sideOffset={8}
                              className={cn(
                                theme === 'dark' 
                                  ? "bg-gray-800/95 text-white border-gray-700 backdrop-blur-md" 
                                  : "bg-white/95 text-gray-800 border-gray-200 backdrop-blur-md",
                                "z-50 w-56 p-2 shadow-xl border rounded-lg"
                              )}
                            >
                              <div className="flex flex-col gap-1">
                                <div className={cn(
                                  "font-semibold text-sm mb-1 px-2 py-0.5 border-b flex items-center gap-1.5",
                                  theme === 'dark' ? "border-gray-700" : "border-gray-200"
                                )}>
                                  <Icon className="h-3.5 w-3.5" />
                                  {label}
                                </div>
                                <div className="space-y-0.5">
                                  {submenus.map((submenu, subIndex) => (
                                    <SubmenuItem
                                      key={`submenu-${groupIndex}-${menuIndex}-${subIndex}`}
                                      href={submenu.href}
                                      label={submenu.label}
                                      active={submenu.active || false}
                                      isOpen={isOpen}
                                      theme={theme}
                                    />
                                  ))}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </Tooltip>
                    </TooltipProvider>

                    {isOpen && (
                      <div
                        className={cn(
                          "ml-3 space-y-0.5 overflow-hidden transition-all duration-300 border-l",
                          theme === 'dark' ? "border-cyan-500/20" : "border-cyan-400/30",
                          isSubmenuOpen ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"
                        )}
                      >
                        {submenus.map((submenu, subIndex) => (
                          <SubmenuItem
                            key={`submenu-${groupIndex}-${menuIndex}-${subIndex}`}
                            href={submenu.href}
                            label={submenu.label}
                            active={submenu.active || false}
                            isOpen={isOpen}
                            theme={theme}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </li>
          ))}
        </ul>
      </nav>
    </ScrollArea>
  );
}