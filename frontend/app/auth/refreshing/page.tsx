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
const RETRY_DELAY = 2000;

export default function Refreshing() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = useMemo(() => searchParams.get("redirect") || "/", [searchParams]);
  const reason = useMemo(() => searchParams.get("reason"), [searchParams]);

  const [status, setStatus] = useState<UiStatus>("idle");
  const [detailMessage, setDetailMessage] = useState("Menyiapkan sesi Anda…");
  const [attempt, setAttempt] = useState<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const originalScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';

    return () => {
      document.documentElement.style.scrollBehavior = originalScrollBehavior;
    };
  }, []);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (reason) {
      switch (reason) {
        case "no_token":
          setDetailMessage("Sesi tidak ditemukan. Memperbarui...");
          break;
        case "token_expired":
          setDetailMessage("Sesi telah kedaluwarsa. Memperbarui...");
          break;
        case "invalid_token":
          setDetailMessage("Token tidak valid. Memperbarui sesi...");
          break;
        case "no_refresh_token":
          setDetailMessage("Sesi habis. Silakan login ulang...");
          break;
        default:
          setDetailMessage("Memperbarui sesi Anda...");
      }
    }
  }, [reason]);

  // ✅ PERBAIKAN: Cek apakah user sudah login (untuk handle direct access setelah login berhasil)
  const checkIfAlreadyLoggedIn = useCallback((): boolean => {
    const accessToken = localStorage.getItem("accessToken");
    const userData = localStorage.getItem("user");

    if (accessToken && userData) {
      console.log("✅ [REFRESH] User already logged in, redirecting to dashboard");
      setStatus("success");
      setDetailMessage("Login berhasil! Mengalihkan...");

      setTimeout(() => {
        router.replace(redirect || "/super-admin-area");
      }, SUCCESS_REDIRECT_DELAY);
      return true;
    }
    return false;
  }, [redirect, router]);

  // ✅ PERBAIKAN: Fungsi refresh token yang kompatibel dengan Google Login
  const executeRefresh = useCallback(async (nextAttempt: number): Promise<void> => {
    if (nextAttempt > MAX_RETRY_ATTEMPTS) {
      setStatus("error");
      setDetailMessage("Terlalu banyak percobaan. Silakan login ulang.");
      return;
    }

    // ✅ CEK DULU: Jika sudah login, tidak perlu refresh
    if (checkIfAlreadyLoggedIn()) {
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

    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      console.log(`🔄 Attempting token refresh (attempt ${nextAttempt})...`);

      const response = await api.post<RefreshResponse>(
        "/api/auth/refresh",
        {},
        {
          signal: abortController.signal,
          timeout: 10000,
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          withCredentials: true
        }
      );

      const data = response.data;

      if (!data.accessToken) {
        throw new Error("Token tidak ditemukan pada respons server");
      }

      // Initialize tokens
      await initializeTokensOnLogin(data.accessToken);

      setDetailMessage("Berhasil memperbarui sesi. Mengalihkan…");
      setStatus("success");

      console.log("✅ Token refresh successful, redirecting to: SUPER-ADMIN-AREA");

      // ✅ PASTIKAN REDIRECT KE SUPER-ADMIN-AREA
      setTimeout(() => {
        router.replace("/super-admin-area");
      }, SUCCESS_REDIRECT_DELAY);

    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Refresh request was aborted');
        return;
      }

      const axiosError = error as AxiosError<RefreshResponse>;

      let errorMessage = "Gagal memperbarui sesi";
      let shouldRetry = false;

      if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')) {
        errorMessage = "Timeout: Server tidak merespons";
        shouldRetry = true;
      } else if (axiosError.response?.status === 401) {
        errorMessage = "Sesi tidak valid. Silakan login ulang.";
        shouldRetry = false;
      } else if (axiosError.response?.status === 500) {
        errorMessage = "Server error. Coba lagi dalam beberapa saat.";
        shouldRetry = nextAttempt < MAX_RETRY_ATTEMPTS;
      } else if (axiosError.response?.data?.error) {
        errorMessage = axiosError.response.data.error;
        shouldRetry = false;
      } else if (!navigator.onLine) {
        errorMessage = "Tidak ada koneksi internet";
        shouldRetry = true;
      }

      setStatus("error");
      setDetailMessage(errorMessage);
      console.error("❌ Token refresh failed:", errorMessage, error);

      if (shouldRetry && nextAttempt < MAX_RETRY_ATTEMPTS) {
        console.log(`🔄 Auto-retrying in ${RETRY_DELAY}ms...`);
        retryTimeoutRef.current = setTimeout(() => {
          executeRefresh(nextAttempt + 1);
        }, RETRY_DELAY);
      }
    }
  }, [router, reason, checkIfAlreadyLoggedIn]);

  const handleRetry = (): void => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    executeRefresh(1);
  };

  const handleLoginRedirect = (): void => {
    abortControllerRef.current?.abort();
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    clearTokensOnLogout();
    router.replace("/auth/login");
  };

  // ✅ PERBAIKAN UTAMA: Logic check yang komprehensif
  // Di useEffect checkAndRefresh, tambahkan debug detail:
  useEffect(() => {
    const checkAndRefresh = async () => {
      console.log("🔄 [REFRESH] Starting authentication check...");
      console.log("📋 [REFRESH] URL Params:", { redirect, reason });

      // ✅ CEK 1: Apakah sudah login (untuk direct access setelah login)
      const accessToken = localStorage.getItem("accessToken");
      const userData = localStorage.getItem("user");

      console.log("🔍 [REFRESH] LocalStorage check:", {
        accessToken: accessToken ? "✓" : "✗",
        userData: userData ? "✓" : "✗",
        accessTokenLength: accessToken?.length
      });

      // ✅ PERBAIKAN: Jika sudah login, langsung redirect KE SUPER-ADMIN-AREA
      if (accessToken && userData) {
        console.log("✅ [REFRESH] User already logged in, redirecting to SUPER-ADMIN-AREA");
        setStatus("success");
        setDetailMessage("Login berhasil! Mengalihkan...");

        setTimeout(() => {
          // ✅ PASTIKAN REDIRECT KE SUPER-ADMIN-AREA
          router.replace("/super-admin-area");
        }, 1000);
        return;
      }

      // ✅ CEK 2: Koneksi internet
      if (!navigator.onLine) {
        setStatus("error");
        setDetailMessage("Tidak ada koneksi internet. Periksa koneksi Anda.");
        return;
      }

      // ✅ CEK 3: Refresh token cookie (DETAILED DEBUG)
      const allCookies = document.cookie;
      console.log("🍪 [REFRESH] ALL Cookies:", allCookies);

      const refreshTokenCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("refreshToken="));

      console.log("🔍 [REFRESH] Refresh token check:", {
        hasRefreshTokenCookie: !!refreshTokenCookie,
        refreshTokenValue: refreshTokenCookie ? "***" : "none"
      });

      // ✅ CEK 4: Refresh token di localStorage 
      const refreshTokenLocal = localStorage.getItem("refreshToken");
      console.log("💾 [REFRESH] LocalStorage refresh token:", !!refreshTokenLocal);

      // ✅ LOGIC: Jika ada refresh token (cookie atau localStorage), lakukan refresh
      if (refreshTokenCookie || refreshTokenLocal) {
        console.log("🔄 [REFRESH] Refresh token found, starting refresh process");
        await executeRefresh(1);
        return;
      }

      // ✅ JIKA TIDAK ADA REFRESH TOKEN: Handle berdasarkan scenario
      console.warn("⛔ No refresh token found anywhere");

      // ✅ PERBAIKAN: Cek lagi apakah accessToken ada (race condition)
      const recheckAccessToken = localStorage.getItem("accessToken");
      const recheckUserData = localStorage.getItem("user");

      if (recheckAccessToken && recheckUserData) {
        console.log("🔄 [REFRESH] Race condition detected - tokens now exist, redirecting");
        setStatus("success");
        setDetailMessage("Login berhasil! Mengalihkan...");

        setTimeout(() => {
          router.replace("/super-admin-area");
        }, 1000);
        return;
      }

      // ✅ TIDAK ADA TOKEN SAMA SEKALI - Redirect ke login
      setStatus("error");
      setDetailMessage("Sesi tidak valid. Mengarahkan ke login...");

      setTimeout(() => {
        clearTokensOnLogout();
        const loginUrl = "/auth/login?reason=no_refresh_token" +
          (redirect && redirect !== "/" ? `&redirect=${encodeURIComponent(redirect)}` : "");
        console.log("🔀 [REFRESH] Redirecting to login:", loginUrl);
        router.replace(loginUrl);
      }, 1500);
    };

    checkAndRefresh();
  }, [executeRefresh, router, redirect, reason]); // ✅ executeRefresh sudah termasuk checkIfAlreadyLoggedIn

  // Render UI (tetap sama)
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a20 50%, #581c8720 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
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
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
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

        {/* Debug info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-6"
        >
          <p className="text-xs text-white/40 max-w-[60ch] mx-auto leading-relaxed">
            {reason && `Alasan: ${reason} • `}Attempt: {attempt}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}