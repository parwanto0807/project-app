// components/clientSessionProvider.tsx (FIXED - NO INFINITE LOOP)
"use client";

import { createContext, useState, useContext, ReactNode, useEffect, useRef, useCallback } from "react";
import {
  initAuthFromStorage,
  setRefreshExecutor,
  setAccessToken,
  onTokenChange,
  getAccessToken,
} from "@/lib/autoRefresh";
import { LoadingScreen } from "@/components/ui/loading-gears";
import { api } from "@/lib/http";

export interface User {
  id: string;
  username: string;
  role: string;
  email?: string;
  name?: string;
}

interface SessionContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
}

interface ProfileResponse {
  user?: User;
  id?: string;
  username?: string;
  role?: string;
  email?: string;
  name?: string;
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  setUser: () => { },
  isLoading: true,
});

export function useSession() {
  return useContext(SessionContext);
}

export default function ClientSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hasFetchedRef = useRef(false);
  const isInitializingRef = useRef(false);
  const isMountedRef = useRef(true);
  const tokenChangeCountRef = useRef(0); // ✅ NEW: Track token changes

  // Function untuk baca accessTokenReadable
  const getReadableToken = useCallback((): string | null => {
    try {
      if (typeof document === 'undefined') return null;

      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'accessTokenReadable' && value) {
          return value;
        }
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Function untuk baca accessToken dari cookie
  const getCookieToken = useCallback((): string | null => {
    try {
      if (typeof document === 'undefined') return null;

      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'accessToken' && value) {
          return value;
        }
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Function untuk handle response data structure dengan type safety
  const extractUserData = useCallback((data: ProfileResponse | User): User | null => {
    try {
      let userData: Partial<User> = data;

      // Handle nested user object
      if (data && typeof data === 'object' && 'user' in data && data.user) {
        userData = data.user;
      }

      // Validasi data user
      if (userData && userData.id) {
        const processedUser: User = {
          id: userData.id,
          username: userData.username || userData.email?.split('@')[0] || 'user',
          role: userData.role || 'user',
          email: userData.email,
          name: userData.name || userData.username,
        };

        return processedUser;
      }

      return null;
    } catch (error) {
      console.error("Error processing user data:", error);
      return null;
    }
  }, []);

  // ✅ FIXED: Function untuk fetch profile menggunakan api dari http.ts
  const fetchProfileWithAuthHeader = useCallback(async (token?: string): Promise<User | null> => {
    try {
      // Jika ada token, set terlebih dahulu ke auth system
      if (token) {
        setAccessToken(token);
      }

      // Gunakan api dari http.ts yang sudah handle interceptors
      const response = await api.get<ProfileResponse | User>(
        `/api/auth/user-login/profile` // ✅ FIXED: Remove full URL, use relative path
      );
      
      const userData = extractUserData(response.data);
      return userData ?? null;
    } catch (err) {
      console.error("[fetchProfileWithAuthHeader] Error:", err);
      return null;
    }
  }, [extractUserData]);

  // ✅ FIXED: Function untuk fetch profile dengan credentials menggunakan api dari http.ts
  const fetchProfileWithCredentials = useCallback(async (): Promise<User | null> => {
    try {
      // Gunakan api dari http.ts dengan withCredentials
      const response = await api.get<ProfileResponse | User>(
        `/api/auth/user-login/profile`, // ✅ FIXED: Remove full URL
        {
          withCredentials: true,
          timeout: 5000,
        }
      );

      return extractUserData(response.data);
    } catch (error) {
      console.error("[fetchProfileWithCredentials] Error:", error);
      return null;
    }
  }, [extractUserData]);

  // ✅ FIXED: Optimized approach testing dengan MAX_RETRIES
  const MAX_RETRIES = 2; // ✅ NEW: Limit retry attempts
  const retryCountRef = useRef(0); // ✅ NEW: Track retry attempts

  const testAllFetchApproaches = useCallback(async (): Promise<void> => {
    if (!isMountedRef.current || hasFetchedRef.current) return;

    // ✅ NEW: Check max retries to prevent infinite loop
    if (retryCountRef.current >= MAX_RETRIES) {
      console.log("Max retry attempts reached, stopping profile fetch");
      setUser(null);
      setIsLoading(false);
      return;
    }

    retryCountRef.current++;

    // Check semua sumber token
    const readableToken = getReadableToken();
    const currentToken = getAccessToken();
    const cookieToken = getCookieToken();

    const hasAnyValidToken = !!(readableToken || currentToken || cookieToken);

    if (!hasAnyValidToken) {
      console.log("No valid token found, skipping profile fetch");
      setUser(null);
      setIsLoading(false);
      return;
    }

    hasFetchedRef.current = true;

    // Coba semua approach secara berurutan
    const approaches = [
      { token: readableToken, name: "readableToken" },
      { token: currentToken, name: "currentToken" },
      { token: cookieToken, name: "cookieToken" },
    ];

    for (const approach of approaches) {
      if (approach.token) {
        console.log(`Trying profile fetch with ${approach.name}`);
        const userData = await fetchProfileWithAuthHeader(approach.token);
        if (userData) {
          console.log(`Profile fetched successfully with ${approach.name}`);
          setUser(userData);
          setIsLoading(false);
          retryCountRef.current = 0; // ✅ Reset on success
          return;
        }
      }
    }

    // Fallback: coba dengan credentials
    console.log("Trying fallback approach with credentials");
    const userData = await fetchProfileWithCredentials();
    if (userData) {
      setUser(userData);
      retryCountRef.current = 0; // ✅ Reset on success
    } else {
      console.log("All profile fetch approaches failed");
      setUser(null);
    }

    setIsLoading(false);
  }, [fetchProfileWithAuthHeader, fetchProfileWithCredentials, getReadableToken, getCookieToken]);

  // ✅ FIXED: Check token availability
  const checkTokenAvailability = useCallback((): boolean => {
    const readableToken = getReadableToken();
    const currentToken = getAccessToken();
    const cookieToken = getCookieToken();

    return !!(readableToken || currentToken || cookieToken);
  }, [getReadableToken, getCookieToken]);

  // ✅ FIXED: Refresh token function menggunakan api dari http.ts
  const refreshToken = useCallback(async (): Promise<string | null> => {
    try {
      // Gunakan api dari http.ts untuk refresh token
      const response = await api.post<{ token: string }>(
        `/auth/refresh`, // ✅ FIXED: Remove full URL
        {},
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const newToken = response.data.token;
      if (newToken) {
        setAccessToken(newToken);
        return newToken;
      }
      return null;
    } catch (error) {
      console.error("Token refresh failed", error);
      setAccessToken(null);
      setUser(null);
      hasFetchedRef.current = false;
      retryCountRef.current = 0; // ✅ Reset on refresh failure
      return null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    const initializeAuth = async (): Promise<void> => {
      if (isInitializingRef.current) return;
      isInitializingRef.current = true;

      try {
        // Initialize dengan accessTokenReadable jika ada
        const readableToken = getReadableToken();
        if (readableToken) {
          setAccessToken(readableToken);
        }

        // Initialize auth system
        initAuthFromStorage();

        // Setup refresh executor menggunakan api dari http.ts
        setRefreshExecutor(refreshToken);

        // ✅ FIXED: Improved token change handler - NO INFINITE LOOP
        onTokenChange((token: string | null) => {
          if (!isMountedRef.current) return;

          tokenChangeCountRef.current++;
          
          // ✅ NEW: Limit token change handling to prevent loops
          if (tokenChangeCountRef.current > 3) {
            console.log("Too many token changes, stopping further processing");
            return;
          }

          if (!token) {
            // Token cleared (logout/expired)
            setUser(null);
            hasFetchedRef.current = false;
            setIsLoading(false);
            retryCountRef.current = 0;
            tokenChangeCountRef.current = 0;
            return;
          }

          // ✅ FIXED: Only fetch profile if we haven't already OR if this is initial setup
          if (!hasFetchedRef.current) {
            console.log("Initial token setup, fetching profile...");
            testAllFetchApproaches();
          } else {
            // ✅ FIXED: Don't automatically refetch on token changes
            // Let http.ts handle token refresh for subsequent requests
            console.log("Token updated, but skipping profile refetch to prevent loop");
          }
        });

        // Check token availability dan fetch profile jika ada
        if (checkTokenAvailability()) {
          await testAllFetchApproaches();
        } else {
          console.log("No tokens available, skipping initial profile fetch");
          setIsLoading(false);
        }

      } catch (error) {
        console.error("Auth initialization failed", error);
        setIsLoading(false);
      } finally {
        isInitializingRef.current = false;
      }
    };

    initializeAuth();

    return () => {
      isMountedRef.current = false;
    };
  }, [
    testAllFetchApproaches, 
    fetchProfileWithAuthHeader, 
    getReadableToken, 
    checkTokenAvailability,
    refreshToken
  ]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SessionContext.Provider value={{ user, setUser, isLoading }}>
      {children}
    </SessionContext.Provider>
  );
}