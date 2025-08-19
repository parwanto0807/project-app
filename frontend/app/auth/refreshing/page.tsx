"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { initializeTokensOnLogin } from "@/lib/http";
import { CheckCircle2, RefreshCw, AlertCircle, Timer, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ------------------------------------------------------------
// Type-safe status state (tanpa `any`)
// ------------------------------------------------------------

type UiStatus = "idle" | "loading" | "success" | "error";

interface RefreshJson {
  accessToken?: string;
  error?: string;
}

// ------------------------------------------------------------
// Helper: tulis cookie FE agar terbaca middleware saat page load
// (duplikasi accessToken yang juga disimpan di memory untuk axios)
// ------------------------------------------------------------
function writeFrontendAccessCookie(token: string) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1])) as { exp?: number };
    const now = Math.floor(Date.now() / 1000);
    const ttl = payload?.exp ? Math.max(payload.exp - now - 5, 5) : 90; // buffer 5s
    document.cookie = `accessToken=${token}; Path=/; Max-Age=${ttl}; SameSite=Lax`;
  } catch {
    document.cookie = `accessToken=${token}; Path=/; Max-Age=90; SameSite=Lax`;
  }
}

export default function Refreshing() {
  const router = useRouter();
  const sp = useSearchParams();
  const redirect = useMemo(() => sp.get("redirect") || "/", [sp]);

  const [status, setStatus] = useState<UiStatus>("idle");
  const [detailMsg, setDetailMsg] = useState("Menyiapkan sesi Anda…");
  const [attempt, setAttempt] = useState<number>(0);
  const abortRef = useRef<AbortController | null>(null);

  async function doRefresh(nextAttempt: number) {
    setAttempt(nextAttempt);
    setStatus("loading");
    setDetailMsg(
      nextAttempt === 1
        ? "Menghubungkan ke server otentikasi…"
        : `Mencoba lagi (${nextAttempt})…`
    );

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
        { method: "POST", credentials: "include", signal: ac.signal }
      );

      const data = (await res.json().catch(() => ({}))) as RefreshJson;

      if (!res.ok) {
        throw new Error(data?.error || `Refresh gagal (${res.status})`);
      }

      const token = data.accessToken;
      if (!token) throw new Error("Token tidak ditemukan pada respons");

      initializeTokensOnLogin(token);
      writeFrontendAccessCookie(token);

      setDetailMsg("Berhasil memperbarui sesi. Mengalihkan…");
      setStatus("success");

      // beri waktu animasi
      setTimeout(() => router.replace(redirect), 550);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Refresh gagal";
      setStatus("error");
      setDetailMsg(msg);
    }
  }

  useEffect(() => {
    // Jalankan 1x ketika halaman dibuka
    void doRefresh(1);
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-2 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 grid place-items-center">
              <Shield className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800 leading-tight">Merefresh Sesi</h1>
              <p className="text-xs text-slate-800">Menjaga Anda tetap masuk dengan aman</p>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 pb-6 pt-2">
            <AnimatePresence mode="wait">
              {status === "loading" && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex flex-col items-center text-center gap-4"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                  >
                    <RefreshCw className="h-8 w-8 text-emerald-400" />
                  </motion.div>
                  <div>
                    <p className="text-sm font-medium">Memperbarui token akses…</p>
                    <p className="text-xs text-slate-700 mt-1">{detailMsg}</p>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ width: ["0%", "60%", "90%", "100%"] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Timer className="h-3.5 w-3.5" /> Upaya: {attempt}
                  </p>
                </motion.div>
              )}

              {status === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex flex-col items-center text-center gap-4"
                >
                  <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                  <p className="text-sm font-medium text-red-600">Sesi berhasil diperbarui</p>
                  <p className="text-xs text-slate-700">Mengalihkan ke halaman tujuan…</p>
                </motion.div>
              )}

              {status === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex flex-col items-center text-center gap-4"
                >
                  <div className="h-10 w-10 rounded-full bg-rose-500/10 grid place-items-center">
                    <AlertCircle className="h-6 w-6 text-rose-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Gagal memperbarui sesi</p>
                    <p className="text-xs text-rose-300/90 mt-1 break-words max-w-[34ch] mx-auto">
                      {detailMsg}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-2">
                      Pastikan koneksi internet aktif dan cookie masih berlaku.
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => void doRefresh(attempt + 1)}
                      className="px-3.5 py-2 rounded-xl text-sm font-medium bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/10"
                    >
                      Coba Lagi
                    </button>
                    <button
                      type="button"
                      onClick={() => router.replace("/auth/login")}
                      className="px-3.5 py-2 rounded-xl text-sm font-medium bg-rose-500/90 hover:bg-rose-500 text-white shadow"
                    >
                      Ke Login
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer helper */}
        <div className="text-center mt-4">
          <p className="text-[11px] text-slate-500">
            Halaman ini aman untuk ditutup setelah selesai. Token disimpan sementara di memory & cookie FE untuk kompatibel dengan middleware.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
