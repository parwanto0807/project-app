"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Home, AlertTriangle, LogIn, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // ⚠️ CRITICAL: Set flag untuk STOP semua auto-refresh di halaman ini
    const stopAutoRefresh = () => {
      if (typeof window !== "undefined") {
        // Flag untuk mencegah executeRefresh() dijalankan
        localStorage.setItem("__disable_auth_refresh", "true");

        // Flag untuk menandai device conflict
        localStorage.setItem("__device_conflict_resolved", "false");

        // Hapus timer refresh jika ada
        if (window.__refreshTimer) {
          clearTimeout(window.__refreshTimer);
          window.__refreshTimer = null;
        }

        // Stop semua interval yang mungkin terkait auth
        const intervalIds = window.__authIntervals || [];
        intervalIds.forEach(id => {
          if (id) clearInterval(id);
        });
        window.__authIntervals = [];
      }
    };

    stopAutoRefresh();

    // Set flag untuk mencegah komponen lain melakukan API calls
    if (typeof window !== "undefined") {
      localStorage.setItem('__stop_auth_checks', 'true');
      localStorage.setItem('__prevent_api_calls', 'true');
      localStorage.setItem('__unauthorized_page_active', 'true');

      // Dispatch custom event untuk memberi tahu komponen lain
      window.dispatchEvent(new CustomEvent('unauthorized-logout', {
        detail: { reason: 'device-conflict' }
      }));
    }

    // Cleanup ketika meninggalkan halaman
    return () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("__disable_auth_refresh");
        localStorage.removeItem("__stop_auth_checks");
        localStorage.removeItem("__prevent_api_calls");
        localStorage.removeItem("__unauthorized_page_active");
      }
    };
  }, []);

  const handleReLogin = () => {
    if (typeof window !== "undefined") {
      // 1. Set flag untuk menandai conflict sudah di-resolve
      localStorage.setItem("__device_conflict_resolved", "true");

      // 2. Clear localStorage untuk reset state client-side
      const keysToRemove = [
        'token',
        'accessToken',
        'refreshToken',
        'user',
        'auth',
        'session',
        'nextauth.message',
        'next-auth.csrf-token',
        'next-auth.session-token'
      ];

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      // 3. Force hard redirect ke login page untuk reset semua state
      // Backend akan menangani cookie clearing
      window.location.replace("/auth/login");
    }
  };

  const handleGoHome = () => {
    if (typeof window !== "undefined") {
      // Set flag untuk mencegah auto-refresh
      localStorage.setItem("__device_conflict_resolved", "true");
      
      // Clear beberapa localStorage yang mungkin mengganggu
      localStorage.removeItem('__stop_auth_checks');
      localStorage.removeItem('__prevent_api_calls');
      localStorage.removeItem('__unauthorized_page_active');
      
      // Redirect ke home, backend akan handle auth state
      window.location.href = "/";
    }
  };

  const handleGoBack = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("__device_conflict_resolved", "true");
      localStorage.setItem("__stop_auth_checks", "false"); // Izinkan auth check kembali
      localStorage.removeItem("__prevent_api_calls");
      localStorage.removeItem("__unauthorized_page_active");
      router.back();
    }
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat halaman...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-blue-200/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-purple-200/10 rounded-full blur-3xl"></div>
        </div>

        {/* Main Card */}
        <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl shadow-blue-100/50 border border-white/60 p-8 text-center">
          {/* Icon Container */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-full blur-lg opacity-20 animate-pulse"></div>
            <div className="relative inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl shadow-lg">
              <Shield className="w-12 h-12 text-white" />
            </div>

            {/* Animated Alert Icon */}
            <div className="absolute -top-2 -right-2">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
                <AlertTriangle className="relative w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4 mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Konflik Perangkat Terdeteksi
            </h1>

            <div className="space-y-2">
              <p className="text-lg font-semibold text-slate-800">
                403 - Device Conflict
              </p>
              <p className="text-slate-600 leading-relaxed">
                Sesi Anda telah diakhiri karena login dari perangkat lain.
                Silakan login ulang untuk melanjutkan.
              </p>
            </div>

            {/* Status Info */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100/80 rounded-full">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-700">
                Status: Sesi Diakhiri - Konflik Perangkat
              </span>
            </div>

            {/* Backend Info */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-blue-700">
                  Sesi telah diakhiri secara otomatis oleh sistem
                </span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Cookies akan dibersihkan oleh server backend
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {/* Login Ulang - Primary Action */}
            <Button
              onClick={handleReLogin}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 group"
              size="lg"
            >
              <LogIn className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
              Login Ulang
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleGoHome}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 group"
                size="lg"
              >
                <Home className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                Beranda
              </Button>

              <Button
                onClick={handleGoBack}
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 transition-all duration-300 group"
                size="lg"
              >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Kembali
              </Button>
            </div>
          </div>

          {/* Security Info */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 text-xs text-slate-500 bg-white/50 backdrop-blur-sm rounded-full px-4 py-2 border border-white/40">
              <Shield className="w-3 h-3" />
              <span>Security Alert - Device Conflict Detected</span>
            </div>
            
            <p className="text-xs text-slate-400 mt-2">
              Sistem keamanan telah mengakhiri sesi ini
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Extend Window interface untuk TypeScript
declare global {
  interface Window {
    __refreshTimer: NodeJS.Timeout | null;
    __authIntervals: number[];
  }
}