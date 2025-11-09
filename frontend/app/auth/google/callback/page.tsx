"use client";

import { useEffect } from "react";
import { initializeTokensOnLogin } from "@/lib/http";

export default function GoogleCallback() {
    useEffect(() => {
        (async () => {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/complete`,
                { credentials: "include" }
            );

            const data = await res.json();

            // ✅ simpan accessToken lokal supaya axios otomatis kirim Authorization
            if (data?.accessToken) {
                await initializeTokensOnLogin(data.accessToken);
            }

            // ✅ beri delay agar cookie benar-benar tersimpan
            setTimeout(() => {
                window.location.href = "/dashboard";
            }, 300);
        })();
    }, []);

    return (
        <div className="w-full min-h-screen flex items-center justify-center">
            <p>Memproses login Google...</p>
        </div>
    );
}
