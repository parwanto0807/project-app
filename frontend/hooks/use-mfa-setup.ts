// hooks/use-mfa-setup.ts
import { useState } from "react";

export function useMfaSetup() {
  const [step, setStep] = useState<"setup" | "show-qr">("setup");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);

  const generateQrCode = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/mfa/setup`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (!res.ok || !data.qrCode || !data.secret) {
        throw new Error(data?.error || "Failed to connect to server");
      }

      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep("show-qr");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enable 2FA");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setStep("setup");
    setIsLoading(false);
    setError(null);
    setQrCode(null);
    setSecret(null);
  };

  return {
    step,
    isLoading,
    error,
    qrCode,
    secret,
    generateQrCode,
    reset,
  };
}