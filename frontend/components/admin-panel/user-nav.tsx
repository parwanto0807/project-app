"use client";

import Link from "next/link";
import { LayoutGrid, User } from "lucide-react";
import { LogoutButton } from "../auth/logout-button";
import { FaUser } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExitIcon } from "@radix-ui/react-icons";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/components/clientSessionProvider"; // ← GUNAKAN useSession

export function UserNav() {
  const { user, isLoading } = useSession(); // ← useSession mengembalikan { user, isLoading }
  // console.log("USER NAV useSession:", { user, isLoading });
  // console.log("🔍 USER NAV DEBUG - Full user data:", user);
  // console.log("🔍 USER NAV DEBUG - Avatar URL:", user?.avatar);
  // console.log("🔍 USER NAV DEBUG - Has avatar:", !!user?.avatar);

  // ✅ Handle loading state
  if (isLoading) {
    return (
      <Button variant="outline" className="relative h-8 w-8 rounded-full" disabled>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-transparent">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          </AvatarFallback>
        </Avatar>
      </Button>
    );
  }

  // ✅ Handle no user state - TAMPILKAN LOGIN BUTTON
  if (!user) {
    return (
      <Button variant="outline" className="h-8 rounded-full px-3" asChild>
        <Link href="/auth/login" className="flex items-center gap-2">
          <FaUser className="h-3 w-3" />
          <span className="text-sm">Login</span>
        </Link>
      </Button>
    );
  }

  // ✅ USER ADA - TAMPILKAN DROPDOWN NORMAL
  return (
    <DropdownMenu>
      <TooltipProvider disableHoverableContent>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="relative h-8 w-8 rounded-full hover:bg-accent"
              >
                <Avatar className="h-8 w-8 border">
                  <AvatarImage
                    src={user.avatar || "/default-avatar.png"}
                    alt={user.name || "User"}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      console.log("Avatar image failed to load, using fallback");
                      (e.target as HTMLImageElement).src = "/default-avatar.png";
                    }}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100">
                    {user.name ? (
                      <span className="text-sm font-medium text-blue-600">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <FaUser className="h-4 w-4 text-blue-600" />
                    )}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Profile: {user.name}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              Role: {user.role}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="hover:cursor-pointer" asChild>
            <Link href="#" className="flex items-center">
              <LayoutGrid className="w-4 h-4 mr-3 text-muted-foreground" />
              Dashboard
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:cursor-pointer" asChild>
            <Link href="#" className="flex items-center">
              <User className="w-4 h-4 mr-3 text-muted-foreground" />
              Account
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <LogoutButton>
          <DropdownMenuItem className="cursor-pointer w-full">
            <ExitIcon className="h-4 w-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </LogoutButton>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}