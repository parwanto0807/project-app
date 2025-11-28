// app/auth/refreshing/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  initializeTokensOnLogin,
  api,
  clearTokensOnLogout
} from "@/lib/http";
import { CheckCircle2, RefreshCw, AlertCircle, Timer, Shield, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AxiosError } from "axios";

type UiStatus = "idle" | "loading" | "success" | "error";

interface RefreshResponse {
  accessToken?: string;
  error?: string;
  success?: boolean;
}

const MAX_RETRY_ATTEMPTS = 3;
const SUCCESS_REDIRECT_DELAY = 800;

export default function Refreshing() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = useMemo(() => searchParams.get("redirect") || "/", [searchParams]);
  const reason = useMemo(() => searchParams.get("reason"), [searchParams]);

  const [status, setStatus] = useState<UiStatus>("idle");
  const [detailMessage, setDetailMessage] = useState("Menyiapkan sesi Anda…");
  const [attempt, setAttempt] = useState<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Set pesan berdasarkan reason dari middleware
  useEffect(() => {
    if (reason) {
      switch (reason) {
        case "no_token":
          setDetailMessage("Sesi tidak ditemukan. Memperbarui...");
          break;
        case "token_expired":
          setDetailMessage("Sesi telah kedaluwarsa. Memperbarui...");
          break;
        default:
          setDetailMessage("Memperbarui sesi Anda...");
      }
    }
  }, [reason]);

  // Fungsi refresh token dengan retry
  const executeRefresh = useCallback(async (nextAttempt: number = 1): Promise<void> => {
    if (nextAttempt > MAX_RETRY_ATTEMPTS) {
      setStatus("error");
      setDetailMessage("Terlalu banyak percobaan. Silakan login ulang.");
      return;
    }

    setAttempt(nextAttempt);
    setStatus("loading");

    if (nextAttempt === 1) {
      setDetailMessage(
        reason === "token_expired"
          ? "Memperbarui sesi yang kedaluwarsa..."
          : "Menghubungkan ke server otentikasi…"
      );
    } else {
      setDetailMessage(`Mencoba lagi (${nextAttempt}/${MAX_RETRY_ATTEMPTS})…`);
    }

    // Abort request sebelumnya jika ada
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      console.log("🔄 Attempting token refresh via API...");

      const response = await api.post<RefreshResponse>(
        "/api/auth/refresh",
        {},
        { signal: abortController.signal, withCredentials: true, timeout: 10000 }
      );

      const data = response.data;

      if (!data.accessToken) {
        throw new Error("Token tidak ditemukan pada respons");
      }

      // Simpan token baru di client (state atau cookie jika perlu)
      await initializeTokensOnLogin(data.accessToken);

      setDetailMessage("Berhasil memperbarui sesi. Mengalihkan…");
      setStatus("success");

      console.log("✅ Token refresh successful, redirecting to:", redirect);

      setTimeout(() => {
        router.replace(redirect);
      }, SUCCESS_REDIRECT_DELAY);

    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Refresh request was aborted');
        return;
      }

      const axiosError = error as AxiosError<RefreshResponse>;
      let errorMessage = "Refresh gagal";

      if (axiosError.response?.data?.error) {
        errorMessage = axiosError.response.data.error;
      } else if (axiosError.message) {
        errorMessage = axiosError.message;
      } else if (axiosError.response?.status) {
        errorMessage = `Refresh gagal (${axiosError.response.status})`;
      }

      console.error("❌ Token refresh failed:", errorMessage);

      // Coba retry otomatis setelah 1 detik jika masih ada attempt tersisa
      if (nextAttempt < MAX_RETRY_ATTEMPTS) {
        setTimeout(() => {
          void executeRefresh(nextAttempt + 1);
        }, 1000);
      } else {
        setStatus("error");
        setDetailMessage(errorMessage);
      }
    }
  }, [redirect, router, reason]);

  // Retry manual
  const handleRetry = (): void => {
    void executeRefresh(attempt + 1);
  };

  const handleLoginRedirect = (): void => {
    clearTokensOnLogout();
    router.replace("/auth/login");
  };

  // useEffect untuk cek refresh token saat halaman di-mount
  useEffect(() => {
    (async () => {
      try {
        // Langsung panggil API refresh, biarkan backend yang cek refreshToken HttpOnly
        await executeRefresh(1);
      } catch (err) {
        console.error("⛔ Gagal refresh token:", err);
        // Jika gagal, clear token dan redirect ke login
        clearTokensOnLogout();
        router.replace("/auth/login?reason=refresh_failed");
      }
    })();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [executeRefresh, router]);


  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900/20 to-purple-900/10 flex items-center justify-center p-4 z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/20 overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 flex items-center gap-3 border-b border-white/5">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 grid place-items-center">
              <Shield className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white leading-tight">
                Memperbarui Sesi
              </h1>
              <p className="text-sm text-white/60 mt-0.5">
                {reason === "token_expired"
                  ? "Memperbarui sesi yang kedaluwarsa"
                  : "Menjaga Anda tetap masuk dengan aman"}
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 pb-6 pt-4">
            <AnimatePresence mode="wait">
              {status === "loading" && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center text-center gap-4"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="relative"
                  >
                    <RefreshCw className="h-10 w-10 text-emerald-400" />
                  </motion.div>

                  <div className="space-y-2">
                    <p className="text-base font-medium text-white">
                      Memperbarui token akses…
                    </p>
                    <p className="text-sm text-white/70">{detailMessage}</p>
                  </div>

                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                    />
                  </div>

                  <p className="text-xs text-white/50 flex items-center gap-1.5">
                    <Timer className="h-3.5 w-3.5" />
                    Upaya: {attempt} of {MAX_RETRY_ATTEMPTS}
                  </p>
                </motion.div>
              )}

              {status === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center text-center gap-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.6 }}
                  >
                    <CheckCircle2 className="h-12 w-12 text-emerald-400" />
                  </motion.div>

                  <div className="space-y-2">
                    <p className="text-base font-semibold text-white">
                      Sesi berhasil diperbarui!
                    </p>
                    <p className="text-sm text-white/70">
                      Mengalihkan ke halaman tujuan…
                    </p>
                  </div>

                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="h-1 bg-emerald-400/30 rounded-full overflow-hidden"
                  >
                    <motion.div
                      className="h-full bg-emerald-400"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: SUCCESS_REDIRECT_DELAY / 1000, ease: "linear" }}
                    />
                  </motion.div>
                </motion.div>
              )}

              {status === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center text-center gap-5"
                >
                  <div className="h-14 w-14 rounded-full bg-rose-500/10 grid place-items-center">
                    <AlertCircle className="h-7 w-7 text-rose-400" />
                  </div>

                  <div className="space-y-2">
                    <p className="text-base font-semibold text-white">Gagal memperbarui sesi</p>
                    <p className="text-sm text-rose-300/90 max-w-[30ch] mx-auto leading-relaxed">
                      {detailMessage}
                    </p>
                    <p className="text-xs text-white/50 mt-2">
                      Pastikan koneksi internet aktif dan cookie masih berlaku.
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-3 w-full">
                    <button
                      type="button"
                      onClick={handleRetry}
                      disabled={attempt >= MAX_RETRY_ATTEMPTS}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      Coba Lagi
                    </button>
                    <button
                      type="button"
                      onClick={handleLoginRedirect}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-rose-500/90 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 transition-all duration-200"
                    >
                      <LogIn className="h-4 w-4" />
                      Login Ulang
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-6"
        >
          <p className="text-xs text-white/40 max-w-[60ch] mx-auto leading-relaxed">
            {reason && `Reason: ${reason}`}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
