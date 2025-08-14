"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState } from "react";

type MfaDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  onCancelRedirect?: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
};

export function MfaRegistrationDialog({
  open,
  onOpenChange,
  onSuccess,
  title = "Aktifkan Autentikasi Dua Faktor",
  description = "🔐 Tambahkan lapisan keamanan ekstra ke akun Anda dengan mengaktifkan autentikasi dua faktor (2FA)",
  confirmText = "Aktifkan 2FA",
  cancelText = "Lewati",
}: MfaDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [step, setStep] = useState<"setup" | "show-qr">("setup");
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  // Handler klik "Aktifkan 2FA"
  const handleActivate2FA = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/mfa/activate-setup`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal mengaktifkan MFA");

      // console.log("MFA Setup Data:", data);

      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep("show-qr");
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else if (typeof err === "string") setError(err);
      else setError("Terjadi kesalahan");
    }
    setIsLoading(false);
  };

  // Handler untuk menyelesaikan setup MFA
  const completeMfaSetup = async () => {
  setIsLoading(true);
  setError(null);
   
  function generateDeviceId() {
    if (typeof window !== "undefined") {
      const userAgent = navigator.userAgent;
      const screenResolution = `${window.screen.width}x${window.screen.height}`;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return btoa(`${userAgent}|${screenResolution}|${timezone}`);
    }
    return "";
  }
  try {
    const deviceId = generateDeviceId(); // You'll need to implement this
    
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/mfa/complete-setup`, {
      method: "POST",
      credentials: "include", // This sends cookies
      headers: { 
        "Content-Type": "application/json",
        "x-device-id": deviceId // Add device ID if your backend expects it
      },
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to complete MFA setup");
    }

    const data = await res.json();
    
    if (!data.tempToken) {
      throw new Error("No temporary token received");
    }

    sessionStorage.setItem("mfa_temp_token", data.tempToken);
    // console.log("MFA tempToken stored:", data.tempToken);
    onSuccess();
    
    return data;
    
  } catch (err) {
    console.error("MFA setup failed:", err);
    setError(err instanceof Error ? err.message : "Setup failed");
    throw err;
  } finally {
    setIsLoading(false);
  }
};

  // Handler close dialog
  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setQrCode(null);
      setSecret(null);
      setStep("setup");
      router.push("/super-admin-area");
    }, 300);
  };

  // Handler jika step selesai (lanjutkan proses selanjutnya, misal: input OTP)
  const handleContinue = async () => {
    try {
      const response = await completeMfaSetup();
      if (response?.tempToken) {
        sessionStorage.setItem('mfa_temp_token', response.tempToken);
        // console.log('MFA tempToken stored:', response.tempToken);
      }
      onSuccess(); // This triggers the redirect
    } catch (error) {
      console.error('MFA setup failed:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-full max-w-md p-0 overflow-hidden rounded-lg">
        <div className="space-y-6 p-4 sm:p-6">
          <DialogHeader className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
              <ShieldCheck className="h-6 w-6 text-blue-600" />
            </div>
            <div className="space-y-1 text-center">
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {step === "setup" ? title : "Scan Authenticator QR Code"}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {step === "setup"
                  ? description
                  : "Scan QR code berikut dengan aplikasi Google Authenticator Anda."}
              </DialogDescription>
            </div>
          </DialogHeader>

          {step === "show-qr" ? (
            <div className="flex flex-col items-center gap-4">
              <Card className="p-4 w-full max-w-[240px]">
                {qrCode ? (
                  <div className="flex items-center justify-center">
                    <Image
                      src={qrCode}
                      alt="QR Code for MFA Setup"
                      className="rounded object-contain"
                      width={180}
                      height={180}
                      priority
                    />
                  </div>
                ) : (
                  <Skeleton className="h-[180px] w-full rounded-lg" />
                )}
              </Card>
              <Card className="w-full p-4">
                <div className="space-y-3">
                  <div className="text-center text-sm text-gray-600">
                    <p>Tidak bisa scan QR code?</p>
                    <p className="mt-2 font-medium text-gray-900">Input kode ini manual:</p>
                    {secret ? (
                      <Card className="mt-2 p-3 bg-gray-50">
                        <div className="font-mono tracking-widest text-sm text-center break-all">
                          {secret}
                        </div>
                      </Card>
                    ) : (
                      <Skeleton className="mt-2 h-10 w-full rounded-md" />
                    )}
                  </div>
                  <div className="text-xs text-gray-500 text-center px-2">
                    Setelah scan, masukkan 6 digit kode dari aplikasi authenticator Anda di step berikutnya.
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <Card className="flex gap-3 p-4 bg-yellow-50 border-yellow-200 text-center items-center">
              <AlertCircle className="mt-0.5 h-8 w-8 text-yellow-500 flex-shrink-0 text-center" />
              <div className="text-sm text-yellow-700">
                Untuk menjaga keamanan akun Anda, kami sangat menyarankan untuk mengaktifkan autentikasi dua faktor (2FA)
              </div>
            </Card>
          )}

          {error && (
            <Card className="p-3 bg-red-50 border-red-200">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </Card>
          )}
        </div>

        <DialogFooter className="px-4 sm:px-6 py-4 border-t bg-gray-50">
          <div className="flex w-full gap-3 flex-col sm:flex-row-reverse">
            {step === "setup" ? (
              <>
                <Button
                  onClick={handleActivate2FA}
                  disabled={isLoading}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    confirmText
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  {cancelText}
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleContinue} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                  Continue
                </Button>
                <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
                  Cancel
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
