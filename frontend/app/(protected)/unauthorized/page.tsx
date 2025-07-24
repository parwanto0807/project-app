"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-4xl font-bold text-red-600 mb-4">403 - Akses Ditolak</h1>
      <p className="text-gray-500 mb-6">
        Kamu tidak memiliki izin untuk mengakses halaman ini.
      </p>
      <Button onClick={() => router.push("/")}>
        Kembali ke Beranda
      </Button>
    </div>
  );
}
