"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";

export default function SetupMfaPage() {
  const [qr, setQr] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = sessionStorage.getItem("pre_access_token") ||
      sessionStorage.getItem("mfa_setup_token");

    if (!token) {
      toast.error("Sesi tidak valid. Silakan login ulang");
      router.push("/auth/login");
      return;
    }

    const loadQr = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/mfa/setup`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Gagal memuat QR Code");
        }

        // Pastikan response valid
        if (!data.qrCode || !data.secret) {
          throw new Error("Data QR atau Secret tidak lengkap");
        }

        setQr(data.qrCode);
        setSecret(data.secret);
        sessionStorage.setItem("mfa_temp_secret", data.secret);

      } catch (err) {
        const msg = err instanceof Error ? err.message : "Gagal memuat QR Code";
        toast.error(msg);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    loadQr();
  }, [router]);

  // ✅ VERIFY SETUP OTP
  const verifySetup = async () => {
    if (!otp || otp.length !== 6) {
      setError("Masukkan 6 digit kode OTP");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      const token = sessionStorage.getItem("pre_access_token") ||
        sessionStorage.getItem("mfa_setup_token");
      const secret = sessionStorage.getItem("mfa_temp_secret");

      if (!token || !secret) {
        throw new Error("Sesi tidak valid");
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/mfa/verify-setup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            otp,
            secret
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Verifikasi gagal");
      }

      // ✅ SETUP BERHASIL
      toast.success("MFA berhasil di-setup!");

      // Simpan token final jika ada
      if (data.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
      }
      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      // Cleanup
      sessionStorage.removeItem("mfa_temp_secret");
      sessionStorage.removeItem("mfa_setup_token");
      sessionStorage.removeItem("pre_access_token");
      sessionStorage.removeItem("mfa_pending");

      // Redirect ke dashboard
      router.push("/super-admin-area");

    } catch (err: unknown) {
      console.error("🔴 [MFA SETUP VERIFY] Error:", err);

      let message = "Verifikasi gagal";

      if (err instanceof Error && err.message) {
        message = err.message;
      }

      setError(message);
    } finally {
      setVerifying(false);
    }

  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl p-8 space-y-6 text-center max-w-md w-full">
        <h2 className="text-xl font-bold">Setup Two-Factor Authentication</h2>

        {loading ? (
          <p>Loading QR Code...</p>
        ) : qr ? (
          <>
            <p className="text-sm text-gray-600">
              Scan QR code dengan Authenticator app (Google Authenticator, Authy, dll)
            </p>

            <div className="bg-white p-4 rounded-lg border inline-block">
              <Image
                src={qr}
                alt="QR Code"
                width={200}
                height={200}
                className="mx-auto"
              />
            </div>

            {/* Manual Entry */}
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-500 mb-1">
                Atau masukkan secret key manually:
              </p>
              <code className="text-sm font-mono bg-white px-2 py-1 rounded border break-all">
                {secret}
              </code>
            </div>

            {/* OTP Input untuk Verifikasi */}
            <div className="space-y-2">
              <label className="text-sm font-medium block text-left">
                Masukkan kode OTP dari Authenticator
              </label>
              <Input
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                disabled={verifying}
                className="text-center text-lg font-mono"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <Button
              onClick={verifySetup}
              disabled={verifying || otp.length !== 6}
              className="w-full"
            >
              {verifying ? "Memverifikasi..." : "Verifikasi & Selesai"}
            </Button>
          </>
        ) : (
          <p className="text-red-500">Gagal load QR Code</p>
        )}

        <Button
          variant="outline"
          onClick={() => router.push("/auth/login")}
          className="w-full"
        >
          Kembali ke Login
        </Button>
      </div>
    </div>
  );
}