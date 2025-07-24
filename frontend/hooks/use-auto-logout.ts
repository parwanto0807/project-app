// src/hooks/useAutoLogout.ts
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAutoLogout(expiryInSeconds: number) {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      alert("Sesi Anda telah berakhir. Silakan login kembali.");
      router.push("/auth/login");
    }, expiryInSeconds * 1000); // misal 5 menit = 300 detik

    return () => clearTimeout(timeout);
  }, [router, expiryInSeconds]);
}
