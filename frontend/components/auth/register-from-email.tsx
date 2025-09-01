"use client";

import * as z from "zod";
import { useEffect, useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { RegisterSchemaEmail } from "@/schemas";
import { registerEmail } from "@/actions/auth/registerEmail";
import { CardWrapper } from "./card-wrapper";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const RegisterForm = () => {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [countdown, setCountdown] = useState<number | null>(null);

  const form = useForm<z.infer<typeof RegisterSchemaEmail>>({
    resolver: zodResolver(RegisterSchemaEmail),
    defaultValues: {
      email: "",
      role: undefined,
    },
  });

  const logoutAndRedirect = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });


      if (res.ok) {
        router.push("/auth/login");
      } else {
        console.error("Logout failed:", await res.text());
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [router]);

  const onSubmit = (values: z.infer<typeof RegisterSchemaEmail>) => {
    setError("");
    setSuccess("");
    setCountdown(null);

    startTransition(() => {
      registerEmail(values).then((data) => {
        setError(data.error);
        setSuccess(data.success);

        if (data.success) {
          setCountdown(3); // Start 3-second countdown
        }
      });
    });
  };

  useEffect(() => {
    if (countdown === null) return;

    const timer = setTimeout(() => {
      if (countdown > 0) {
        setCountdown(countdown - 1);
      } else {
        logoutAndRedirect();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, logoutAndRedirect]);

  return (
    <CardWrapper
      headerLabel="Create an email account"
      backButtonLabel="Back to login"
      backButtonHref="/auth/login"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      placeholder="admin@example.com"
                      type="email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Select
                      disabled={isPending}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="pic">PIC</SelectItem>
                        <SelectItem value="warga">Resident</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormError message={error} />
          <FormSuccess message={success} />

          {countdown !== null && (
            <p className="text-center text-sm text-muted-foreground">
              {countdown > 0 ? (
                `Redirecting to login in ${countdown} second${countdown !== 1 ? "s" : ""}...`
              ) : (
                "Redirecting now..."
              )}
            </p>
          )}

          <Button
            disabled={isPending || countdown !== null}
            type="submit"
            className="w-full"
          >
            {isPending ? "Creating account..." : "Create an email account"}
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
};

export default RegisterForm;