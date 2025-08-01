// components/auth/otp-input.tsx
"use client"

import * as React from "react"
import { useFormContext } from "react-hook-form"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "../ui/button"

interface OTPInputProps {
  name: string
  length?: number
  disabled?: boolean
  loading?: boolean
  title?: string
  description?: string
}

export function OTPInput({
  name,
  length = 6,
  disabled = false,
  loading = false,
  title = "Enter Verification Code",
  description = "We've sent a 6-digit code to your email/phone",
}: OTPInputProps) {
  const { setValue, register } = useFormContext()
  const rest = register(name)

  if (loading) {
    return (
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="space-y-2 text-center">
          <Skeleton className="h-6 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-5/6 mx-auto" />
        </div>
        <div className="flex justify-center gap-3">
          {Array.from({ length }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-12 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-10 w-full rounded-md" />
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md p-6 space-y-6">
      <div className="space-y-2 text-center">
        <h3 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <InputOTP
          maxLength={length}
          disabled={disabled}
          {...rest}
          onChange={(value) => {
            setValue(name, value, { shouldValidate: true })
          }}
        >
          <InputOTPGroup className="gap-2 sm:gap-3 justify-center">
            {Array.from({ length }).map((_, index) => (
              <InputOTPSlot
                key={index}
                index={index}
                className={`
                  h-12 w-10 sm:w-12
                  rounded-lg sm:rounded-xl
                  border-2
                  border-gray-300
                  bg-white
                  text-2xl
                  font-semibold
                  text-center
                  transition-all
                  focus:border-blue-500
                  focus:bg-blue-50
                  focus:outline-none
                  shadow-sm
                  ring-1 ring-inset ring-gray-100
                  dark:bg-neutral-900 
                  dark:text-white 
                  dark:border-gray-700 
                  dark:ring-neutral-700
                  hover:border-gray-400
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                `}
              />
            ))}
          </InputOTPGroup>
        </InputOTP>

        <Button
          variant="link"
          size="sm"
          className="text-sm text-muted-foreground hover:text-primary"
          disabled={disabled}
        >
          Resend Code
        </Button>
      </div>
    </Card>
  )
}