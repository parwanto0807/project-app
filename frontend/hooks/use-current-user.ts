"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchWithRefresh } from '@/lib/fetchWithRefresh';

export interface User {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshAttempted, setRefreshAttempted] = useState<boolean>(false); // Cegah looping refresh
  // const router = useRouter();

  // 🔄 Fungsi untuk merefresh token jika access token expired
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refreshToken`, {
        method: "POST",
        credentials: "include",
      });

      if (res.status === 401) {
        console.warn("⚠️ Tidak bisa refresh token, user belum login.");
        return false;
      }

      if (!res.ok) throw new Error("❌ Gagal merefresh token.");

      setRefreshAttempted(false); // Reset state setelah berhasil refresh token
      return true;
    } catch (err) {
      console.error("❌ Gagal merefresh token:", err);
      return false;
    }
  }, []);

  // 👤 Fungsi untuk mengambil profil user
  const fetchProfile = useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      const res = await fetchWithRefresh(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/user-login/profile`, {
        method: 'GET',
        credentials: 'include', // Kirim cookie token
      });

      if (res.status === 401) {
        if (!refreshAttempted) {
          setRefreshAttempted(true);
          const refreshed = await refreshToken();
          if (refreshed) {
            return fetchProfile(); // Retry setelah refresh
          }
        }
        setUser(null);
        setLoading(false); // ⬅ Tambahkan ini
        return;
      }

      if (!res.ok) throw new Error("Gagal mengambil data profil.");

      const data = await res.json();
      setUser(data.user);

    } catch (err) {
      console.error("Error fetching profile:", err);
      setUser(null); // Jika ada error, set user null
    } finally {
      setLoading(false);
    }
  }, [refreshToken, refreshAttempted]);

useEffect(() => {
  fetchProfile();
}, [fetchProfile]);


  return { user, setUser, loading };
}
