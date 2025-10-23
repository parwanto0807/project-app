// hooks/use-current-user.ts (With Axios Error)
"use client";

import { useState, useEffect, useMemo } from "react";
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

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      try {
        // console.log("🔄 [useCurrentUser] Fetching user profile...");

        const response = await api.get<ProfileResponse>(
          "/api/auth/user-login/profile"
        );

        // console.log("✅ [useCurrentUser] Response received:", {
        //   status: response.status,
        //   hasUser: !!response.data?.user,
        //   user: response.data?.user
        // });

        if (isMounted && response.data.user) {
          setUser(response.data.user);
          setError(null);
        }
      } catch (err) {
        // ✅ Use AxiosError type
        const error = err as AxiosError<{ error?: string }>;

        console.error("❌ [useCurrentUser] Failed to fetch user profile:", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });

        if (isMounted) {
          setUser(null);
          setError(
            error.response?.data?.error || error.message || "Unknown error"
          );
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

  const refresh = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ProfileResponse>(
        "/api/auth/user-login/profile"
      );
      setUser(response.data.user);
    } catch (err) {
      const error = err as AxiosError<{ error?: string }>;
      console.error("Failed to refresh user:", error);
      setUser(null);
      setError(error.response?.data?.error || error.message || "Unknown error");
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
