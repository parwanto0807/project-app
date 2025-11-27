"use client";

import * as z from "zod";
import { useEffect, useState, useTransition } from "react";
import { CardWrapper } from "./card-wrapper";
import { useForm } from "react-hook-form";
import { useSearchParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema } from "@/schemas";
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
import { toast } from "sonner";

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

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // ✅ Cleanup URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    const reasonParam = urlParams.get('reason');

    if (errorParam || reasonParam) {
      console.log("🔴 [URL CLEANUP] Removing error params:", { errorParam, reasonParam });
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  const onSubmit = async (values: z.infer<typeof LoginSchema>) => {
    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) {
          setError("Konfigurasi aplikasi tidak valid.");
          return;
        }

        console.log("🔐 [LOGIN] Starting login process");

        // 1) Kirim request login
        const loginRes = await fetch(`${apiUrl}/api/auth/admin/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // ✅ INI HARUS ADA
          body: JSON.stringify(values),
        });

        // ✅ DEBUG DETAILED RESPONSE
        console.log("🔐 [LOGIN] Response details:", {
          status: loginRes.status,
          statusText: loginRes.statusText,
          ok: loginRes.ok,
          url: loginRes.url,
          type: loginRes.type,
          headers: Object.fromEntries(loginRes.headers.entries()), // Lihat semua headers
        });

        // ✅ CEK SET-COOKIE HEADER SPECIFICALLY
        const setCookieHeader = loginRes.headers.get('set-cookie');
        console.log("🔐 [LOGIN] Set-Cookie header:", setCookieHeader);

        const loginData = await loginRes.json();
        console.log("🔐 [LOGIN] Login response data:", loginData);

        if (!loginRes.ok || !loginData.success) {
          setError(loginData.error || "Login gagal");
          return;
        }

        // ✅ SIMPAN ACCESS TOKEN
        localStorage.setItem("accessToken", loginData.accessToken);
        console.log("✅ [LOGIN] Access token saved to localStorage");

        // ✅ SIMPAN USER DATA
        localStorage.setItem("user", JSON.stringify(loginData.user));
        console.log("✅ [LOGIN] User data saved");

        // ✅ CHECK COOKIES SETELAH LOGIN (dengan delay)
        setTimeout(() => {
          console.log("🍪 [LOGIN] Cookies after login:", document.cookie);
          console.log("🍪 [LOGIN] All cookies:", document.cookie.split(';').map(c => c.trim()));

          // ✅ LANGSUNG REDIRECT KE DASHBOARD (bypass refreshing page)
          console.log("✅ [LOGIN] Login successful, redirecting to dashboard...");
          toast.success("Login berhasil!");
          router.push("/super-admin-area");
        }, 500);

      } catch (err: unknown) {
        console.error("🔴 [LOGIN] Error:", err);
        setError("Terjadi kesalahan tidak diketahui");
      }
    });
  };

  // ✅ GOOGLE LOGIN
  const handleGoogleLogin = () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        toast.error("Konfigurasi aplikasi tidak valid");
        return;
      }

      const googleAuthUrl = `${apiUrl}/api/auth/google`;
      console.log("🔐 [GOOGLE] Redirecting to:", googleAuthUrl);

      window.location.href = googleAuthUrl;
    } catch (err) {
      console.error("🔴 [GOOGLE LOGIN] Error:", err);
      setError("Gagal memproses login Google");
    }
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
        </Form>
      </CardWrapper>
    </div>
  );
};

export default LoginForm;