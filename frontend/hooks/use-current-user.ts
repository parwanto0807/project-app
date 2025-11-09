// hooks/use-current-user.ts (Fixed version)
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
    // Jika sudah ada ongoing fetch, tunggu yang existing
    if (globalFetchPromise && !retry) {
      try {
        await globalFetchPromise;
        // Setelah existing fetch selesai, update state dari global
        if (isMountedRef.current) {
          setUser(globalUser);
          setLoading(globalLoading);
        }
        return;
      } catch {
        // Jika existing fetch gagal, lanjut dengan fetch baru
      }
    }

    try {
      if (!retry) {
        globalLoading = true;
        if (isMountedRef.current) {
          setLoading(true);
        }
      }

      const fetchPromise = api.get<ProfileResponse>(
        "/api/auth/user-login/profile",
        { withCredentials: true }
      );

      // Set global promise untuk prevent concurrent fetches
      if (!retry) {
        globalFetchPromise = fetchPromise.then(response => {
          if (response.data?.user) {
            globalUser = response.data.user;
            if (isMountedRef.current) {
              setUser(response.data.user);
              setError(null);
            }
          }
          return;
        }).catch(err => {
          throw err;
        }).finally(() => {
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
        if (response.data?.user) {
          globalUser = response.data.user;
          if (isMountedRef.current) {
            setUser(response.data.user);
            setError(null);
          }
        }
      }

      retryCountRef.current = 0; // Reset retry count on success

    } catch (err) {
      const axiosErr = err as AxiosError<{ error?: string }>;

      // ✅ Retry logic dengan limit dan hanya untuk 401
      if (axiosErr.response?.status === 401 && 
          !retry && 
          retryCountRef.current < maxRetries) {
        
        retryCountRef.current++;
        await new Promise((r) => setTimeout(r, 250 * retryCountRef.current)); // Exponential backoff
        return fetchUser(true);
      }

      // Update global state on error
      globalUser = null;
      if (isMountedRef.current) {
        setUser(null);
        setError(
          axiosErr.response?.data?.error || axiosErr.message || "Unknown error"
        );
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
  }, []); // api is stable, so empty deps is ok

  useEffect(() => {
    isMountedRef.current = true;
    
    // Only fetch if we don't already have user data
    if (!globalUser && !globalFetchPromise) {
      setLoading(true);
      fetchUser();
    } else if (globalUser) {
      // If we already have data, use it immediately
      setUser(globalUser);
      setLoading(false);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchUser]);

  const refresh = useCallback(async (): Promise<void> => {
    // Force refresh - clear cache and fetch fresh
    globalUser = null;
    retryCountRef.current = 0;
    
    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }
    
    await fetchUser();
  }, [fetchUser]);

  const memoizedValue = useMemo(
    () => ({
      user,
      loading,
      error,
      isAuthenticated: !!user,
      setUser: (newUser: User | null) => {
        globalUser = newUser;
        if (isMountedRef.current) {
          setUser(newUser);
        }
      },
      refresh,
    }),
    [user, loading, error, refresh]
  );

  return memoizedValue;
}