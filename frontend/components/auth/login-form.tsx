"use client";

import * as z from "zod";
import { useState, useTransition } from "react";
import { CardWrapper } from "./card-wrapper";
import { useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema } from "@/schemas";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FaArrowLeft } from "react-icons/fa";

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
import { FormError } from "../form-error";
import { FormSuccess } from "../form-success";
import { MfaRegistrationDialog } from "./mfa-registration-dialog"; // Changed to component version
import { initializeTokensOnLogin } from "@/lib/http";

const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError =
    searchParams.get("error") === "OAuthAccountNotLinked"
      ? "Email already in use with different provider!"
      : "";
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [showMfaDialog, setShowMfaDialog] = useState(false);

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof LoginSchema>) => {
    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const deviceId = generateDeviceId();

        // 1. Login request
        const loginRes = await fetch(`${apiUrl}/api/auth/admin/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-device-id": deviceId,
          },
          credentials: "include",
          body: JSON.stringify(values),
        });

        const loginData = await loginRes.json();
        // console.log("Login response:", loginData);

        if (loginData.accessToken) {
          initializeTokensOnLogin(loginData.accessToken);
        }

        if (!loginRes.ok) {
          throw new Error(loginData.error || "Login failed");
        }

        // 2. Check MFA status (after successful login)
        const statusRes = await fetch(`${apiUrl}/api/auth/mfa/status`, {
          credentials: "include",
          headers: {
            "x-device-id": deviceId,
            "Cache-Control": "no-cache",
            "Authorization": `Bearer ${loginData.accessToken}`,
          },
        });

        if (!statusRes.ok) {
          throw new Error("Failed to check MFA status");
        }

        const statusData = await statusRes.json();
        // console.log("MFA Status response:", statusData);

        // 3. Handle MFA flow
        if (statusData.mfaRequired) {
          // Use token from login response or status response
          const mfaToken = loginData.tempToken || statusData.tempToken;

          if (!mfaToken) {
            throw new Error("MFA required but no token received");
          }

          sessionStorage.setItem("mfa_temp_token", mfaToken);
          // console.log("MFA token stored:", mfaToken);
          // router.push("/auth/mfa");
          setShowMfaDialog(true);
          return;
        }

        // 4. Handle MFA setup for new users
        if (!statusData.mfaEnabled) {
          setShowMfaDialog(true);
          return;
        }

        // 5. No MFA required - proceed to dashboard
        router.push("/super-admin-area");

      } catch (err) {
        console.error("Login error:", err);
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  };

  const handleMfaDialogSuccess = () => {
    setShowMfaDialog(false);
    router.push("/auth/inputOtp");
  };

  const handleMfaDialogCancel = () => {
    setShowMfaDialog(false);
    // router.push("/super-admin-area");
  };

  function generateDeviceId() {
    if (typeof window !== "undefined") {
      const userAgent = navigator.userAgent;
      const screenResolution = `${window.screen.width}x${window.screen.height}`;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return btoa(`${userAgent}|${screenResolution}|${timezone}`);
    }
    return "";
  }

  const handleGoogleLogin = () => {
    const googleAuthUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`;
    window.location.href = googleAuthUrl;
  };

  return (
    <div className="relative w-full max-w-[95vw] sm:max-w-md mx-auto px-2 sm:px-4">
      <Link
        href="/"
        className="absolute -top-10 sm:-top-12 left-2 sm:left-4 flex items-center text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <FaArrowLeft className="mr-1 sm:mr-2" />
        Back to home
      </Link>

      <CardWrapper headerLabel="Welcome back">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
            <div className="space-y-2 sm:space-y-3">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder="admin@example.com"
                        type="text"
                        className="bg-background/50 hover:bg-background/70 transition-colors text-xs sm:text-sm h-9 sm:h-10 px-3"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder="••••••"
                        type="password"
                        className="bg-background/50 hover:bg-background/70 transition-colors text-xs sm:text-sm h-9 sm:h-10 px-3"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <FormError message={error || urlError} />
            <FormSuccess message={success} />

            <Button
              disabled={isPending}
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 transition-colors h-9 sm:h-10 text-xs sm:text-sm"
            >
              {isPending ? "Signing in..." : "Sign in"}
            </Button>

            <div className="relative my-2 sm:my-3">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-[10px] sm:text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={isPending}
              className="w-full h-9 sm:h-10 flex items-center justify-center gap-2 border border-gray-300 bg-white hover:bg-gray-100 transition text-xs sm:text-sm"
            >
              <Image
                src="/google-icon.png"
                alt="Google Icon"
                width={16}
                height={16}
                className="w-4 h-4 sm:w-5 sm:h-5"
              />
              <span className="font-medium text-gray-700">Login with Google</span>
            </Button>
          </form>

          <div className="mt-3 sm:mt-4 text-center text-xs">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/register"
              className="text-primary hover:underline transition-colors"
            >
              Sign up
            </Link>
          </div>
        </Form>
      </CardWrapper>

      {/* MFA Registration Dialog */}
      <MfaRegistrationDialog
        open={showMfaDialog}
        onOpenChange={setShowMfaDialog}
        onSuccess={handleMfaDialogSuccess}
        onCancelRedirect={handleMfaDialogCancel}
      />
    </div>
  );
};

export default LoginForm;