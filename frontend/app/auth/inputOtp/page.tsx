"use client";

import { useForm, FormProvider } from "react-hook-form";
import { OTPInput } from "@/components/auth/otp-input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function MFAInputPage() {
  const methods = useForm({ defaultValues: { otp: "" } });
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const onSubmit = async (data: { otp: string }) => {
    setLoading(true);
    setError(null);

    const tempToken = sessionStorage.getItem("mfa_temp_token");

    if (!tempToken) {
      const msg = "Sesi MFA telah berakhir. Silakan login kembali.";
      toast.error(msg);
      setError(msg);
      setLoading(false);
      router.push("/auth/login");
      return;
    }

    try {
      setLoading(true);

      const tempToken = sessionStorage.getItem("mfa_temp_token");
      if (!tempToken) {
        toast.error("Sesi otentikasi tidak ditemukan!");
        router.push("/login");
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/mfa/newVerify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tempToken}`,
          },
          body: JSON.stringify({
            otp: data.otp,
            rememberDevice: true,
            deviceId: sessionStorage.getItem("mfa_device_id") || undefined,
          }),
          cache: "no-cache",
        }
      );

      const json = await res.json().catch(() => ({
        error: "Server tidak merespon dengan benar",
      }));

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

      // === SUCCESS ===
      const accessToken = json.accessToken;
      const refreshToken = json.refreshToken;

      if (!accessToken) {
        toast.error("Token tidak diterima dari server!");
        return;
      }

      // Simpan token utama
      localStorage.setItem("accessToken", accessToken);

      // Jika server mengirim refreshToken → simpan juga
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      // Jika remember device aktif & device token ada → simpan
      if (json.deviceToken) {
        localStorage.setItem("trustedDeviceToken", json.deviceToken);
      }

      // Bersihkan token sementara
      sessionStorage.removeItem("mfa_temp_token");
      sessionStorage.removeItem("pre_access_token");

      toast.success("Berhasil diverifikasi!");
      router.push("/super-admin-area");
      router.refresh();

    } catch (error) {
      console.error("MFA Verify Error", error);
      const msg = "Kesalahan koneksi. Coba lagi!";
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }

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
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
