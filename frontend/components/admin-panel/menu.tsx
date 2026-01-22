"use client";

import Link from "next/link";
import { Ellipsis, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getMenuList } from "@/lib/menu-list";
import { getMyPermissions } from "@/lib/action/permission/userPermission";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
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

// Define Permission type locally if not exported
interface Permission {
  code: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
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
                "max-w-[190px] truncate transition-all duration-300 text-[13px] font-bold uppercase tracking-wider",
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
          sideOffset={10}
          className={cn(
            "z-[100] px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-[0.1em] shadow-2xl border-none",
            theme === 'dark'
              ? "bg-cyan-400 text-black"
              : "bg-cyan-500 text-white"
          )}
        >
          <div className="flex items-center gap-1.5">
            <span>{label}</span>
            {hasSubmenu && <ChevronDown size={10} strokeWidth={3} />}
          </div>
        </TooltipContent>
      )}
    </Tooltip>
  </TooltipProvider>
);

const SubmenuItem = ({
  href,
  label,
  icon: Icon,
  active,
  isOpen,
  theme = 'dark'
}: {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
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
            "rounded-xl transition-all duration-300 hover:scale-[1.02] group relative",
            !isOpen
              ? "flex flex-col items-center justify-center p-2 text-center h-[85px] w-[85px] border shadow-sm overflow-hidden"
              : "block px-3 py-2 text-xs border-[0.5px]",
            theme === 'dark'
              ? cn(
                active
                  ? "bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-300 border-cyan-500/40 shadow-lg shadow-cyan-900/30"
                  : "bg-gray-800/40 text-gray-400 hover:text-white hover:bg-gray-700/60 border-gray-700/50 backdrop-blur-md",
              )
              : cn(
                active
                  ? "bg-gradient-to-br from-cyan-50 to-blue-50 text-cyan-700 border-cyan-200 shadow-md shadow-cyan-100"
                  : "bg-white/60 text-gray-600 hover:text-cyan-700 hover:bg-white/90 border-gray-200/80 backdrop-blur-md",
              )
          )}
        >
          {/* Smooth Background Glow on Hover */}
          <div className={cn(
            "absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
            theme === 'dark' ? "bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10" : "bg-gradient-to-br from-cyan-400/5 via-transparent to-blue-400/5"
          )} />

          <span className={cn(
            "relative z-10 flex items-center gap-1.5",
            !isOpen ? "flex-col gap-2" : "flex-row"
          )}>
            <div className={cn(
              "flex items-center justify-center transition-all duration-300 transform group-hover:rotate-6",
              !isOpen
                ? "w-8 h-8 rounded-lg"
                : "w-4 h-4 rounded-md mr-1",
              active
                ? (theme === 'dark' ? "bg-cyan-500 text-white shadow-[0_0_15px_rgba(34,211,238,0.4)]" : "bg-cyan-500 text-white")
                : (theme === 'dark' ? "bg-gray-700 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white" : "bg-cyan-50 text-cyan-600 group-hover:bg-cyan-500 group-hover:text-white")
            )}>
              <Icon width={!isOpen ? 16 : 12} height={!isOpen ? 16 : 12} className={cn(active ? "animate-pulse" : "")} />
            </div>
            <span className={cn(
              "w-full transition-colors duration-200 px-1 uppercase tracking-wider font-bold",
              !isOpen ? "text-[10px] leading-[1.2] line-clamp-2 break-words text-center" : "truncate flex-1 text-[12px]"
            )} title={label}>
              {label}
            </span>
          </span>
        </Link>
      </TooltipTrigger>
      <TooltipContent
        side={!isOpen ? "top" : "right"}
        sideOffset={5}
        className={cn(
          "z-[100] px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-[0.1em] shadow-2xl border-none whitespace-nowrap",
          theme === 'dark'
            ? "bg-cyan-400 text-black"
            : "bg-cyan-500 text-white"
        )}
      >
        {label}
      </TooltipContent>
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
              "z-[100] px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-[0.1em] shadow-2xl border-none",
              theme === 'dark'
                ? "bg-cyan-400 text-black"
                : "bg-cyan-500 text-white"
            )}
          >
            {label}
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
  const [permissions, setPermissions] = useState<Permission[]>([]);

  useEffect(() => {
    // Fetch permissions when component mounts
    async function fetchPermissions() {
      if (role === 'super') return; // Super admin doesn't usually need filtered permissions, but good to have
      const result = await getMyPermissions();
      if (result.success !== false) { // Ensure success (API usually returns array directly or {data: []})
        // getMyPermissions returns response.data which is likely the array itself based on controller
        // Controller: res.json(permissionList) -> Array
        // But my Action Wrapper: returns response.data
        // Let's assume it returns array directly, or check controller again
        // Controller `getMyPermissions` uses `getUserPermissions` helper which returns array.
        // And `res.json(updatedPermissions)`
        setPermissions(Array.isArray(result) ? result : (result.data || []));
      }
    }
    fetchPermissions();
  }, [role]);

  const menuList = getMenuList(pathname, role, permissions); // Pass permissions here

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
                              sideOffset={15}
                              className={cn(
                                theme === 'dark'
                                  ? "bg-gray-900/95 text-white border-gray-700/50 backdrop-blur-xl"
                                  : "bg-white/95 text-gray-800 border-gray-200/80 backdrop-blur-xl",
                                "z-55 w-[240px] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border rounded-2xl"
                              )}
                            >
                              <div className="flex flex-col gap-4">
                                <div className={cn(
                                  "font-black text-[12px] uppercase tracking-[0.2em] mb-1 px-1 pb-3 border-b flex items-center gap-2",
                                  theme === 'dark' ? "border-gray-800 text-cyan-400/80" : "border-gray-100 text-cyan-600/80"
                                )}>
                                  <div className={cn(
                                    "p-1.5 rounded-lg shadow-inner",
                                    theme === 'dark' ? "bg-gray-800 text-cyan-400" : "bg-cyan-50 text-cyan-600"
                                  )}>
                                    <Icon className="h-3.5 w-3.5" />
                                  </div>
                                  {label}
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  {submenus.map((submenu, subIndex) => (
                                    <SubmenuItem
                                      key={`submenu-${groupIndex}-${menuIndex}-${subIndex}`}
                                      href={submenu.href}
                                      label={submenu.label}
                                      icon={submenu.icon}
                                      active={submenu.active || false}
                                      isOpen={true} // Force list style in popover
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
                            icon={submenu.icon}
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