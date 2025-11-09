// hooks/use-current-user.ts (Fixed with retry on 401)
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { AxiosError } from "axios";
import { api } from "@/lib/http";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface ProfileResponse {
  user: User;
}

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(
    async (retry = false): Promise<void> => {
      try {
        const response = await api.get<ProfileResponse>(
          "/api/auth/user-login/profile",
          { withCredentials: true }
        );

        if (response.data?.user) {
          setUser(response.data.user);
          setError(null);
        } else {
          setUser(null);
        }
      } catch (err) {
        const axiosErr = err as AxiosError<{ error?: string }>;

        // ✅ Jika 401 pertama kali → tunggu sebentar → retry sekali
        if (axiosErr.response?.status === 401 && !retry) {
          await new Promise((r) => setTimeout(r, 250));
          return fetchUser(true);
        }

        setUser(null);
        setError(
          axiosErr.response?.data?.error ||
            axiosErr.message ||
            "Unknown error"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    setLoading(true);
    let mounted = true;

    (async () => {
      if (!mounted) return;
      await fetchUser();
    })();

    return () => {
      mounted = false;
    };
  }, [fetchUser]);

  const refresh = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ProfileResponse>(
        "/api/auth/user-login/profile",
        { withCredentials: true }
      );
      setUser(response.data.user);
    } catch (err) {
      const axiosErr = err as AxiosError<{ error?: string }>;
      setUser(null);
      setError(
        axiosErr.response?.data?.error ||
          axiosErr.message ||
          "Unknown error"
      );
    } finally {
      setLoading(false);
    }
  };

  const memoizedValue = useMemo(
    () => ({
      user,
      loading,
      error,
      setUser,
      refresh,
    }),
    [user, loading, error]
  );

  return memoizedValue;
}
