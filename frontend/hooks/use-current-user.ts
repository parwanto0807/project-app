// hooks/use-current-user.ts (Versi yang Disempurnakan)

"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/http";

export interface User {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      try {
        const response = await api.get("/api/auth/user-login/profile");
        if (isMounted) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUser();

    return () => {
      isMounted = false;
    };
  }, []);

  // PERBAIKAN: Gunakan useMemo untuk menstabilkan nilai yang dikembalikan.
  // Ini memastikan bahwa objek yang sama dikembalikan kecuali jika
  // nilai user atau loading benar-benar berubah, yang dapat mencegah
  // render ulang yang tidak perlu di komponen yang menggunakan hook ini.
  const memoizedValue = useMemo(
    () => ({
      user,
      loading,
      setUser,
    }),
    [user, loading]
  );

  // console.log("User", user);

  return memoizedValue;
}
