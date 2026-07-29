"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton={true}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      toastOptions={{
        style: { userSelect: "text", pointerEvents: "auto" } as React.CSSProperties,
        classNames: {
          toast: "pointer-events-auto select-text",
          title: "select-text",
          description: "select-text",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
