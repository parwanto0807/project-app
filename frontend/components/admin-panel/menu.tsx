"use client";

import Link from "next/link";
import { Ellipsis, ChevronDown, ChevronUp } from "lucide-react";
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
            "w-full justify-start h-10 mb-1 transition-all duration-300",
            isOpen ? "w-full justify-start rounded-md px-3" : "w-11 justify-center rounded-xl",
            theme === 'dark' && cn(
              active
                ? "bg-gradient-to-r from-cyan-500 via-cyan-400 to-cyan-300 text-white shadow-lg"
                : "bg-cyan-700 text-white hover:bg-gradient-to-r hover:from-cyan-600 hover:via-cyan-500 hover:to-cyan-400 hover:shadow-md",
              disabled && "opacity-50 pointer-events-none bg-cyan-900"
            ),
            theme === 'light' && cn(
              active
                ? "bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-200 text-cyan-900 shadow-lg border border-cyan-300"
                : "bg-cyan-100 text-cyan-800 hover:bg-gradient-to-r hover:from-cyan-200 hover:via-cyan-100 hover:to-cyan-50 hover:border-cyan-300 hover:shadow-md border border-cyan-200",
              disabled && "opacity-50 pointer-events-none bg-cyan-50 text-cyan-400"
            )
          )}
          asChild
          disabled={disabled}
        >
          <Link href={href} className="flex items-center">
            <span className={cn(!isOpen ? "ml-2" : "mr-2")}>
              <Icon
                width={isOpen ? 18 : 24}
                height={isOpen ? 18 : 24}
                className={cn(
                  theme === 'dark' && active ? "text-white" : "text-current",
                  theme === 'light' && active ? "text-cyan-900" : "text-current",
                  !isOpen && "mx-auto" // center saat sidebar tutup
                )}
              />
            </span>
            <p
              className={cn(
                "max-w-[200px] truncate transition-all duration-300",
                !isOpen ? "w-0 opacity-0" : "w-auto opacity-100",
                theme === 'dark' && active ? "text-white" : "text-current",
                theme === 'light' && active ? "text-cyan-900" : "text-current"
              )}
            >
              {label}
            </p>
          </Link>
        </Button>
      </TooltipTrigger>
      {!isOpen && (
        <TooltipContent side="right" className={cn(
          theme === 'dark' ? "bg-gray-800 text-white" : "bg-white text-gray-800",
          "z-50"
        )}>
          {label}
          {hasSubmenu && " (Has submenu)"}
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
            "block px-3 py-1 text-sm rounded hover:bg-muted transition-colors",
            theme === 'dark'
              ? cn(
                active ? "bg-gray-700 font-semibold text-white" : "text-gray-300 hover:text-white",
                "hover:bg-gray-700"
              )
              : cn(
                active ? "bg-cyan-100 font-semibold text-cyan-900" : "text-gray-600 hover:text-cyan-900",
                "hover:bg-cyan-50"
              )
          )}
        >
          {label}
        </Link>
      </TooltipTrigger>
      {!isOpen && (
        <TooltipContent side="right" className={cn(
          theme === 'dark' ? "bg-gray-800 text-white" : "bg-white text-gray-800",
          "z-50"
        )}>
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
            <div className="w-8 flex justify-center items-center">
              <Ellipsis className={cn(
                "h-5 w-5",
                theme === 'dark' ? "text-gray-400" : "text-gray-500"
              )} />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className={cn(
            theme === 'dark' ? "bg-gray-800 text-white" : "bg-white text-gray-800",
            "z-20"
          )}>
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <p className={cn(
      "text-sm font-medium px-4 pb-2 max-w-[248px] truncate",
      theme === 'dark' ? "text-gray-400" : "text-gray-500"
    )}>
      {label}
    </p>
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
    <ScrollArea className="h-[calc(100vh-80px)] overflow-y-auto">
      <nav className={cn(
        "mt-1 h-full w-full rounded-xl",
        theme === 'dark' ? "bg-gray-900" : "bg-white"
      )}>
        <ul className="flex flex-col min-h-[calc(100vh-48px-36px-16px-32px)] lg:min-h-[calc(100vh-32px-40px-32px)] items-start space-y-1 px-2">
          {menuList.map(({ groupLabel, menus }, groupIndex) => (
            <li className={cn("w-full", groupLabel ? "pt-2" : "")} key={`group-${groupIndex}`}>
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
                  <div className="w-full" key={menuKey}>
                    <TooltipProvider disableHoverableContent>
                      <Tooltip delayDuration={100}>
                        {isOpen ? (
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => toggleSubmenu(menuKey)}
                              className={cn(
                                "w-full flex items-center justify-between px-3 py-2 rounded mb-1 text-sm font-medium transition-colors",
                                theme === 'dark' && cn(
                                  active
                                    ? "bg-gradient-to-r from-cyan-500 via-cyan-400 to-cyan-300 text-white shadow-lg"
                                    : "bg-cyan-800 text-white hover:bg-gradient-to-r hover:from-cyan-600 hover:via-cyan-500 hover:to-cyan-400 hover:shadow-md",
                                  disabled && "opacity-50 pointer-events-none bg-cyan-900"
                                ),
                                theme === 'light' && cn(
                                  active
                                    ? "bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-200 text-cyan-900 shadow-lg border border-cyan-300"
                                    : "bg-cyan-100 text-cyan-800 hover:bg-gradient-to-r hover:from-cyan-200 hover:via-cyan-100 hover:to-cyan-50 hover:border-cyan-300 hover:shadow-md border border-cyan-200",
                                  disabled && "opacity-50 pointer-events-none bg-cyan-50 text-cyan-400"
                                )
                              )}
                            >
                              <div className="flex items-center space-x-2">
                                <Icon width={18} height={18} className={cn(
                                  theme === 'dark' && active ? "text-white" : "text-current",
                                  theme === 'light' && active ? "text-cyan-900" : "text-current"
                                )} />
                                <span className={cn(
                                  theme === 'dark' && active ? "text-white" : "text-current",
                                  theme === 'light' && active ? "text-cyan-900" : "text-current"
                                )}>{label}</span>
                              </div>
                              {isSubmenuOpen ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </TooltipTrigger>
                        ) : (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                className={cn(
                                  "w-1xl flex items-center justify-between px-3 py-2 rounded-xl mb-1 text-sm font-medium transition-colors",
                                  theme === 'dark' && cn(
                                    active
                                      ? "bg-gradient-to-r from-cyan-500 via-cyan-400 to-cyan-300 text-white shadow-lg"
                                      : "bg-cyan-800 text-white hover:bg-gradient-to-r hover:from-cyan-600 hover:via-cyan-500 hover:to-cyan-400 hover:shadow-md",
                                    disabled && "opacity-50 pointer-events-none bg-cyan-900"
                                  ),
                                  theme === 'light' && cn(
                                    active
                                      ? "bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-200 text-cyan-900 shadow-lg border border-cyan-300"
                                      : "bg-cyan-100 text-cyan-800 hover:bg-gradient-to-r hover:from-cyan-200 hover:via-cyan-100 hover:to-cyan-50 hover:border-cyan-300 hover:shadow-md border border-cyan-200",
                                    disabled && "opacity-50 pointer-events-none bg-cyan-50 text-cyan-400"
                                  )
                                )}
                              >
                                <Icon className="h-5 w-5" />
                              </button>
                            </PopoverTrigger>

                            <PopoverContent
                              side="right"
                              className={cn(
                                theme === 'dark' ? "bg-gray-800 text-white" : "bg-white text-gray-800",
                                "z-auto w-1xl p-5"
                              )}
                            >
                              <div className="flex flex-col gap-1">
                                <div className="font-semibold text-sm mb-1">{label}</div>
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
                            </PopoverContent>
                          </Popover>
                        )}

                      </Tooltip>
                    </TooltipProvider>

                    <div
                      className={cn(
                        "pl-2 space-y-1 overflow-hidden transition-all duration-300",
                        isOpen && isSubmenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
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