"use client"

import * as React from "react"
import { PanelLeft } from "lucide-react"

import { useSidebarToggle } from "@/hooks/use-sidebar-toggle"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const SidebarTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
    const { setIsOpen } = useSidebarToggle()

    return (
        <Button
            ref={ref}
            variant="ghost"
            size="icon"
            className={cn("h-7 w-7", className)}
            onClick={(event) => {
                onClick?.(event)
                setIsOpen()
            }}
            {...props}
        >
            <PanelLeft />
            <span className="sr-only">Toggle Sidebar</span>
        </Button>
    )
})
SidebarTrigger.displayName = "SidebarTrigger"
