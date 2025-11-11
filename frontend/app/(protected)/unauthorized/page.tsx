"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Shield, Home, AlertTriangle, LogIn, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  const router = useRouter();

  const handleReLogin = () => {
    // Clear any existing auth data before redirecting to login
    localStorage.removeItem("access_token");
    sessionStorage.removeItem("access_token");
    document.cookie.split(";").forEach(cookie => {
      const name = cookie.split("=")[0].trim();
      if (name.includes("token") || name.includes("auth")) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      }
    });
    router.push("/auth/login");
  };

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
              Akses Dibatasi
            </h1>
            
            <div className="space-y-2">
              <p className="text-lg font-semibold text-slate-800">
                403 - Unauthorized Access
              </p>
              <p className="text-slate-600 leading-relaxed">
                Sesi Anda mungkin telah berakhir atau Anda tidak memiliki izin untuk mengakses halaman ini.
              </p>
            </div>

            {/* Status Info */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100/80 rounded-full">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-700">
                Status: Akses Ditolak - Perlu Autentikasi Ulang
              </span>
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
                onClick={() => router.push("/")}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 group"
                size="lg"
              >
                <Home className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                Beranda
              </Button>
              
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 transition-all duration-300 group"
                size="lg"
              >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Kembali
              </Button>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-6 p-4 bg-slate-50/60 rounded-2xl border border-slate-200/40">
            <p className="text-sm text-slate-600 mb-2">
              <strong>Tips:</strong> Login ulang dapat menyelesaikan masalah akses jika sesi telah berakhir.
            </p>
            <div className="flex justify-center gap-4 text-xs">
              <button 
                onClick={() => router.push("/help")}
                className="text-blue-600 hover:text-blue-700 font-medium underline underline-offset-2 transition-colors"
              >
                Butuh Bantuan?
              </button>
              <button 
                onClick={() => router.push("/auth/forgot-password")}
                className="text-orange-600 hover:text-orange-700 font-medium underline underline-offset-2 transition-colors"
              >
                Lupa Password?
              </button>
            </div>
          </div>
        </div>

        {/* Security Badge */}
        <div className="text-center mt-6">
          <div className="inline-flex items-center gap-2 text-xs text-slate-500 bg-white/50 backdrop-blur-sm rounded-full px-4 py-2 border border-white/40">
            <Shield className="w-3 h-3" />
            <span>Protected by Security System</span>
          </div>
        </div>
      </div>
    </div>
  );
}