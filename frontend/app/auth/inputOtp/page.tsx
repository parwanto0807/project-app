"use client";

import { useForm, FormProvider } from "react-hook-form";
import { OTPInput } from "@/components/auth/otp-input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function MFAInputPage() {
  const methods = useForm({ defaultValues: { otp: "" } });
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ CEK SESSION SAAT KOMPONEN MOUNT
  useEffect(() => {
    const tempToken = sessionStorage.getItem("mfa_temp_token");
    const deviceId = sessionStorage.getItem("mfa_device_id");
    
    console.log("🔐 [OTP PAGE] Session check:", {
      hasTempToken: !!tempToken,
      hasDeviceId: !!deviceId,
      tempToken: tempToken ? "✓" : "✗",
      deviceId: deviceId ? "✓" : "✗"
    });

    if (!tempToken || !deviceId) {
      const msg = "Sesi MFA tidak valid. Silakan login kembali.";
      toast.error(msg);
      setError(msg);
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    }
  }, [router]);

  const onSubmit = async (data: { otp: string }) => {
    setLoading(true);
    setError(null);

    const tempToken = sessionStorage.getItem("mfa_temp_token");
    const deviceId = sessionStorage.getItem("mfa_device_id");

    // ✅ VALIDASI LENGKAP
    if (!tempToken) {
      const msg = "Sesi MFA telah berakhir. Silakan login kembali.";
      toast.error(msg);
      setError(msg);
      setLoading(false);
      router.push("/auth/login");
      return;
    }

    if (!deviceId) {
      const msg = "Device ID tidak ditemukan. Silakan login kembali.";
      toast.error(msg);
      setError(msg);
      setLoading(false);
      router.push("/auth/login");
      return;
    }

    try {
      console.log("🔐 [OTP VERIFY] Starting verification...", {
        hasTempToken: !!tempToken,
        hasDeviceId: !!deviceId,
        otpLength: data.otp.length
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/mfa/newVerify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tempToken}`,
            "x-device-id": deviceId, // ✅ GUNAKAN HEADER UNTUK DEVICE ID
          },
          body: JSON.stringify({
            otp: data.otp,
            rememberDevice: true,
            // deviceId: deviceId, // ❌ HAPUS dari body, sudah pakai header
          }),
          cache: "no-cache",
        }
      );

      const json = await res.json().catch(() => ({
        error: "Server tidak merespon dengan benar",
      }));

      console.log("🔐 [OTP VERIFY] Response:", {
        status: res.status,
        ok: res.ok,
        data: json
      });

      if (!res.ok) {
        const msg =
          json.error ||
          (res.status === 429
            ? "Terlalu banyak percobaan. Coba lagi beberapa saat."
            : "Kode OTP salah atau sudah kadaluarsa.");

        toast.error(msg);
        setError(msg);
        return;
      }

      // ✅ SUCCESS - FINAL LOGIN PROCESS
      const accessToken = json.accessToken;
      // const refreshToken = json.refreshToken;

      if (!accessToken) {
        toast.error("Token tidak diterima dari server!");
        return;
      }

      console.log("✅ [OTP VERIFY] Success! Finalizing login...");

      // ✅ GUNAKAN initializeTokensOnLogin JIKA ADA
      // if (typeof initializeTokensOnLogin === "function") {
      //   await initializeTokensOnLogin(accessToken);
      //   console.log("🔐 [OTP] Tokens initialized via initializeTokensOnLogin");
      // } else {
      //   // Fallback: simpan manual
      //   localStorage.setItem("accessToken", accessToken);
      //   if (refreshToken) {
      //     localStorage.setItem("refreshToken", refreshToken);
      //   }
      //   if (json.user) {
      //     localStorage.setItem("user", JSON.stringify(json.user));
      //   }
      // }

      // ✅ SIMPAN DEVICE TOKEN JIKA ADA
      if (json.deviceToken) {
        localStorage.setItem("trustedDeviceToken", json.deviceToken);
        console.log("🔐 [OTP] Trusted device token saved");
      }

      // ✅ CLEANUP LENGKAP
      sessionStorage.removeItem("mfa_temp_token");
      sessionStorage.removeItem("mfa_device_id");
      sessionStorage.removeItem("mfa_pending");
      sessionStorage.removeItem("pre_access_token");
      sessionStorage.removeItem("pre_user");

      console.log("✅ [OTP] Cleanup completed, redirecting...");

      toast.success("Verifikasi berhasil! Login sukses.");
      
      // ✅ REDIRECT DENGAN DELAY KECIL
      setTimeout(() => {
        router.push("/super-admin-area");
        router.refresh();
      }, 500);

    } catch (error) {
      console.error("🔴 [OTP VERIFY] Error:", error);
      const msg = "Kesalahan koneksi. Coba lagi!";
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ✅ HANDLE BACK TO LOGIN
  const handleBackToLogin = () => {
    sessionStorage.removeItem("mfa_temp_token");
    sessionStorage.removeItem("mfa_device_id");
    sessionStorage.removeItem("mfa_pending");
    router.push("/auth/login");
  };

  return (
    <div className="max-w-xs mx-auto">
      <FormProvider {...methods}>
        <form
          onSubmit={methods.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex min-h-screen items-center justify-center bg-gradient-to-b">
            <div className="bg-white/80 dark:bg-neutral-900/80 rounded-2xl shadow-xl p-8 flex flex-col items-center gap-6">
              
              {/* ✅ TAMBAH BACK BUTTON */}
              <div className="w-full flex justify-start">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBackToLogin}
                  className="text-sm"
                >
                  ← Kembali ke Login
                </Button>
              </div>

              <label className="mb-4 text-lg font-medium text-center text-gray-800 dark:text-white">
                Masukkan 6 digit kode dari Authenticator
              </label>

              <OTPInput name="otp" length={6} disabled={loading} />

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <Button
                type="submit"
                disabled={loading || methods.watch("otp").length !== 6}
                className="w-full"
              >
                {loading ? "Memverifikasi..." : "Verifikasi"}
              </Button>

              {/* ✅ TAMBAH INFO DEBUG (optional) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-500 mt-2">
                  Device ID: {sessionStorage.getItem("mfa_device_id") ? "✓" : "✗"}
                </div>
              )}
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}