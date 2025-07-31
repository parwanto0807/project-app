// components/otp-input.tsx
"use client"

import * as React from "react"
import { useFormContext } from "react-hook-form"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"

interface OTPInputProps {
  name: string
  length?: number
  disabled?: boolean
}

export function OTPInput({ name, length = 6, disabled }: OTPInputProps) {
  const { setValue } = useFormContext()

  return (
    <InputOTP
      maxLength={length}
      disabled={disabled}
      onChange={(value) => setValue(name, value)}
      render={({ slots }) => (
        <InputOTPGroup className="gap-2">
          {slots.map((slot, index) => (
            <InputOTPSlot
              key={index}
              index={index}
              className="h-14 w-12 text-lg border-border rounded-lg"
            />
          ))}
        </InputOTPGroup>
      )}
    />
  )
}