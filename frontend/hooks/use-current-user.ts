// hooks/use-current-user.ts (Improved version)
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { AxiosError } from "axios";
import { api } from "@/lib/http";
import { getAccessToken } from "@/lib/autoRefresh";

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

// Global state untuk prevent multiple fetches across components
let globalFetchPromise: Promise<void> | null = null;
let globalUser: User | null = null;
let globalLoading = true;

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(globalUser);
  const [loading, setLoading] = useState<boolean>(globalLoading);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const maxRetries = 2;

  const fetchUser = useCallback(async (retry = false): Promise<void> => {
    // ✅ PERBAIKAN: Better token check
    const token = getAccessToken?.();
    const hasToken = !!token;

    if (!hasToken) {
      globalUser = null;
      globalLoading = false;
      if (isMountedRef.current) {
        setUser(null);
        setLoading(false);
        setError(null);
      }
      return;
    }

    // ✅ PERBAIKAN: Handle existing fetch dengan better logic
    if (globalFetchPromise && !retry) {
      try {
        await globalFetchPromise;
        if (isMountedRef.current) {
          setUser(globalUser);
          setLoading(globalLoading);
        }
        return;
      } catch {
        // Continue to new fetch jika existing gagal
      }
    }

    try {
      if (!retry) {
        globalLoading = true;
        if (isMountedRef.current) {
          setLoading(true);
          setError(null);
        }
      }

      console.log("🔄 useCurrentUser - Fetching profile..."); // ← DEBUG

      const fetchPromise = api.get<ProfileResponse>(
        "/api/auth/user-login/profile",
        {
          withCredentials: true,
          timeout: 10000,
        }
      );

      if (!retry) {
        globalFetchPromise = fetchPromise
          .then((response) => {
            console.log("✅ useCurrentUser - Response:", response.data); // ← DEBUG
            if (response.data?.user) {
              globalUser = response.data.user;
              if (isMountedRef.current) {
                setUser(response.data.user);
                setError(null);
              }
            } else {
              console.log("❌ useCurrentUser - No user in response");
              throw new Error("No user data in response");
            }
            return;
          })
          .catch((err) => {
            console.error("❌ useCurrentUser - Fetch error:", err);
            throw err;
          })
          .finally(() => {
            globalLoading = false;
            globalFetchPromise = null;
            if (isMountedRef.current) {
              setLoading(false);
            }
          });

        await globalFetchPromise;
      } else {
        // Untuk retry, tidak set global promise
        const response = await fetchPromise;
        console.log("✅ useCurrentUser - Retry response:", response.data); // ← DEBUG
        if (response.data?.user) {
          globalUser = response.data.user;
          if (isMountedRef.current) {
            setUser(response.data.user);
            setError(null);
          }
        } else {
          throw new Error("No user data in response");
        }
      }

      retryCountRef.current = 0;
    } catch (err) {
      const axiosErr = err as AxiosError<{ error?: string }>;
      console.error("❌ useCurrentUser - Error:", axiosErr);

      // ✅ PERBAIKAN: Better error handling dan retry logic
      if (
        axiosErr.response?.status === 401 &&
        !retry &&
        retryCountRef.current < maxRetries
      ) {
        retryCountRef.current++;
        console.log(
          `🔄 useCurrentUser - Retrying (${retryCountRef.current}/${maxRetries})`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, 500 * retryCountRef.current)
        );
        return fetchUser(true);
      }

      // ✅ PERBAIKAN: Handle different error types
      let errorMessage = "Unknown error";

      if (axiosErr.response?.data?.error) {
        errorMessage = axiosErr.response.data.error;
      } else if (axiosErr.message) {
        errorMessage = axiosErr.message;
      } else if (axiosErr.code === "ECONNABORTED") {
        errorMessage = "Request timeout";
      }

      globalUser = null;
      if (isMountedRef.current) {
        setUser(null);
        setError(errorMessage);
      }
    } finally {
      if (!retry) {
        globalLoading = false;
        globalFetchPromise = null;
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    }
  }, []);

  // ✅ ✅ ✅ TAMBAHKAN INI: useEffect untuk fetch data otomatis
  useEffect(() => {
    isMountedRef.current = true;

    // console.log("🎯 useCurrentUser - Component mounted, checking auth...");

    // Only fetch if we don't already have user data and not already loading
    if (!globalUser && !globalFetchPromise) {
      // console.log("🎯 useCurrentUser - No user data, fetching...");
      fetchUser();
    } else if (globalUser) {
      // If we already have data, use it immediately
      // console.log("🎯 useCurrentUser - Using cached user data");
      setUser(globalUser);
      setLoading(false);
    } else if (globalFetchPromise) {
      // console.log("🎯 useCurrentUser - Fetch already in progress");
      setLoading(true);
    }

    return () => {
      // console.log("🎯 useCurrentUser - Component unmounted");
      isMountedRef.current = false;
    };
  }, [fetchUser]);

  const refresh = useCallback(async (): Promise<void> => {
    // Force refresh - clear cache and fetch fresh
    console.log("🔄 useCurrentUser - Manual refresh triggered");
    globalUser = null;
    retryCountRef.current = 0;

    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }

    await fetchUser();
  }, [fetchUser]);

  const clearError = useCallback((): void => {
    if (isMountedRef.current) {
      setError(null);
    }
  }, []);

  const memoizedValue = useMemo(
    () => ({
      user,
      loading,
      error,
      isAuthenticated: !!user,
      setUser: (newUser: User | null) => {
        console.log("✏️ useCurrentUser - Manual user update:", newUser);
        globalUser = newUser;
        if (isMountedRef.current) {
          setUser(newUser);
        }
      },
      refresh,
      clearError,
    }),
    [user, loading, error, refresh, clearError]
  );

  return memoizedValue;
}
