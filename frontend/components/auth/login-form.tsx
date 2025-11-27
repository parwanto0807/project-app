"use client";

import * as z from "zod";
import { useState, useTransition } from "react";
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
import { MfaRegistrationDialog } from "./mfa-registration-dialog";
import { initializeTokensOnLogin } from "@/lib/http"; // tetap import, tapi hanya dipanggil saat finalisasi login

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

  // Helper function untuk verify auth sebelum redirect (opsional)
  const verifyAuthBeforeRedirect = async (apiUrl: string, accessToken: string) => {
    try {
      const verifyRes = await fetch(`${apiUrl}/api/auth/verify`, {
        method: "GET",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (verifyRes.ok) {
        const verifyData = await verifyRes.json();
        console.log("✅ [AUTH VERIFY] User authenticated:", verifyData.user?.email);
        return { authenticated: true, user: verifyData.user };
      } else {
        console.error("🔴 [AUTH VERIFY] Authentication failed");
        return { authenticated: false };
      }
    } catch (err) {
      console.error("🔴 [AUTH VERIFY] Verification error:", err);
      return { authenticated: false };
    }
  };

  const onSubmit = async (values: z.infer<typeof LoginSchema>) => {
    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) {
          console.error("🔴 [LOGIN] API URL is undefined");
          setError("Konfigurasi aplikasi tidak valid. Silakan refresh halaman.");
          return;
        }

        const deviceId = generateDeviceId();

        console.log("🔐 [LOGIN] Step 1: Starting login process");

        // 1) Kirim request login (credential)
        const loginRes = await fetch(`${apiUrl}/api/auth/admin/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-device-id": deviceId,
          },
          credentials: "include",
          body: JSON.stringify(values),
        });

        console.log("🔐 [LOGIN] Login response status:", loginRes.status);

        const loginData = await loginRes.json();
        console.log("🔐 [LOGIN] Login response data:", loginData);

        if (!loginRes.ok) {
          return setError(loginData.error || "Login gagal, periksa email & password");
        }

        if (!loginData.accessToken) {
          return setError("Login berhasil, tapi token tidak diterima");
        }

        // ===== Simpan token SEMENTARA (pre-token) =====
        // Jangan panggil initializeTokensOnLogin di sini jika MFA mungkin diperlukan.
        sessionStorage.setItem("pre_access_token", loginData.accessToken);
        if (loginData.user) {
          sessionStorage.setItem("pre_user", JSON.stringify(loginData.user));
        }
        sessionStorage.setItem("mfa_device_id", deviceId);
        sessionStorage.setItem("mfa_pending", "false"); // default false

        // Beri sedikit delay supaya storage sinkron (opsional)
        await new Promise((r) => setTimeout(r, 50));

        console.log("🔐 [LOGIN] Step 2: Checking MFA status");

        // 2) Cek status MFA menggunakan pre token
        const statusRes = await fetch(`${apiUrl}/api/auth/mfa/status`, {
          method: "GET",
          credentials: "include",
          headers: {
            "x-device-id": deviceId,
            Authorization: `Bearer ${loginData.accessToken}`,
            "Cache-Control": "no-cache",
          },
        });

        console.log("🔐 [LOGIN] MFA status response:", statusRes.status);

        const statusData = await statusRes.json();
        console.log("🔐 [LOGIN] MFA status data:", statusData);

        if (!statusRes.ok) {
          console.error("🔐 [LOGIN] MFA status check failed:", statusData);
          return setError(statusData.error || "Gagal cek status MFA");
        }

        // 3a) Jika MFA required -> redirect ke halaman input OTP (simpan temp token)
        if (statusData.mfaRequired && !statusData.trustedDevice) {
          sessionStorage.setItem("mfa_temp_token", statusData.tempToken);
          sessionStorage.setItem("mfa_pending", "true");
          router.push("/auth/inputOtp");
          return;
        }

        // 3b) Jika MFA belum di-enable (first-time setup) -> buka halaman setup MFA (opsional)
        if (!statusData.mfaEnabled) {
          console.log("🔐 [LOGIN] MFA not enabled -> redirect to /auth/setupMfa");
          sessionStorage.setItem("mfa_pending", "true");
          router.push("/auth/setupMfa");
          return;
        }

        // 4) Jika sampai sini: MFA tidak required dan sudah enabled => finalize login
        console.log("🔐 [LOGIN] MFA not required. Finalizing login...");

        const preToken = sessionStorage.getItem("pre_access_token")!;
        if (!preToken) {
          return setError("Token pra-login hilang. Silakan coba login lagi.");
        }

        // (Optional) verify token with backend before initialize
        const finalCheck = await verifyAuthBeforeRedirect(apiUrl, preToken);
        if (!finalCheck.authenticated) {
          return setError("Gagal verifikasi authentication sebelum redirect");
        }

        // === Sekarang aman: inisialisasi token final & start auto-refresh ===
        if (typeof initializeTokensOnLogin === "function") {
          try {
            // NOTE: initializeTokensOnLogin harus menyimpan accessToken/refreshToken dan start auto-refresh
            await initializeTokensOnLogin(preToken);
            console.log("🔐 [LOGIN] Tokens initialized via initializeTokensOnLogin");
          } catch (initErr) {
            console.error("🔴 [LOGIN] initializeTokensOnLogin error:", initErr);
            // fallback sederhana
            localStorage.setItem("accessToken", preToken);
            if (loginData.user) localStorage.setItem("user", JSON.stringify(loginData.user));
          }
        } else {
          // fallback: simpan langsung
          localStorage.setItem("accessToken", preToken);
          if (loginData.user) localStorage.setItem("user", JSON.stringify(loginData.user));
        }

        // cleanup flags
        sessionStorage.removeItem("mfa_pending");
        sessionStorage.removeItem("mfa_temp_token");
        sessionStorage.removeItem("pre_access_token");
        sessionStorage.removeItem("pre_user");
        // redirect to dashboard
        console.log("✅ [LOGIN] SUCCESS - Redirecting to /super-admin-area");
        setTimeout(() => {
          router.push("/super-admin-area");
          router.refresh();
        }, 50);
      } catch (err: unknown) {
        console.error("🔴 [LOGIN] Error details:", err);
        if (err instanceof TypeError) {
          setError("Tidak dapat menghubungi server. Cek koneksi atau API URL.");
          return;
        }
        setError(err instanceof Error ? err.message : "Terjadi kesalahan tidak diketahui");
      }
    });
  };

  // Jika MFA dialog used for registration flow (keperluan kamu), tetap dipertahankan
  const handleMfaDialogSuccess = () => {
    setShowMfaDialog(false);
    router.push("/auth/inputOtp");
  };

  const handleMfaDialogCancel = () => {
    setShowMfaDialog(false);
    // tidak redirect ke dashboard; biarkan user memilih
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

  // Tetap pertahankan Google auth handler
  const handleGoogleLogin = () => {
    const googleAuthUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`;
    // pakai redirect ke backend oauth endpoint (backend yang handle callback)
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
        </Form>
      </CardWrapper>

      {/* MFA Registration Dialog (tetap ada, kalau kamu pakai untuk setup/registration) */}
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
