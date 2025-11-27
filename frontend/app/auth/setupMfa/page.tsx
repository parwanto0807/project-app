"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";

export default function SetupMfaPage() {
  const [qr, setQr] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = sessionStorage.getItem("pre_access_token");

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

        const data: unknown = await res.json();

        // pastikan tipe data benar
        if (
          typeof data !== "object" ||
          !data ||
          !("qrCode" in data) ||
          !("secret" in data)
        ) {
          throw new Error("Response MFA tidak valid");
        }

        const { qrCode, secret } = data as { qrCode: string; secret: string };

        if (!qrCode || !secret) {
          throw new Error("Data QR atau Secret tidak lengkap");
        }

        setQr(qrCode);
        sessionStorage.setItem("mfa_temp_secret", secret);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Gagal memuat QR Code";
        toast.error(msg);
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    loadQr();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl p-8 space-y-6 text-center">
        <h2 className="text-lg font-bold">
          Scan QR Code di Google Authenticator
        </h2>

        {loading ? (
          <p>Loading QR Code...</p>
        ) : qr ? (
          <Image src={qr} alt="QR Code" width={240} height={240} />
        ) : (
          <p className="text-red-500">Gagal load QR Code</p>
        )}

        <Button
          disabled={loading || !qr}
          onClick={() => router.push("/auth/inputOtp")}
        >
          Sudah Scan, Lanjut Verifikasi OTP
        </Button>
      </div>
    </div>
  );
}
