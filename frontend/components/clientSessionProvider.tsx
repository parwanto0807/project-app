// components/clientSessionProvider.tsx (UPDATED WITH LOADING SCREEN)
"use client";

import { createContext, useState, useContext, ReactNode, useEffect, useRef, useCallback } from "react";
import axios, { AxiosError } from "axios";
import {
  initAuthFromStorage,
  setRefreshExecutor,
  setAccessToken,
  onTokenChange,
  getAccessToken,
} from "@/lib/autoRefresh";
import { LoadingScreen } from "@/components/ui/loading-gears"; // ✅ IMPORT LOADING SCREEN

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

  // Function untuk baca accessTokenReadable
  const getReadableToken = (): string | null => {
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
  };

  // Function untuk handle response data structure dengan type safety
  const extractUserData = (data: ProfileResponse | User): User | null => {
    try {
      // console.log("📦 Raw profile response:", data);

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

        // console.log("✅ Processed user data:", processedUser);
        return processedUser;
      }

      // console.warn("⚠️ Invalid user data structure:", userData);
      return null;
    } catch (error) {
      console.error("❌ Error processing user data:", error);
      return null;
    }
  };

  // ✅ Function untuk fetch profile menggunakan Authorization Header
  const fetchProfileWithAuthHeader = useCallback(async (token: string): Promise<User | null> => {
    try {
      // console.log("🔑 [PROFILE FETCH] Using Authorization Header with token:", `${token.substring(0, 20)}...`);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/user-login/profile`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      // console.log('📡 [PROFILE FETCH] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [PROFILE FETCH] Error response:', errorText);
        return null;
      }

      const data: ProfileResponse | User = await response.json();
      const userData = extractUserData(data);

      if (userData) {
        // console.log("✅ [PROFILE FETCH] Success with Authorization Header");
        return userData;
      }

      return null;
    } catch (error) {
      console.error("❌ [PROFILE FETCH] Network error:", error);
      return null;
    }
  }, []);

  // ✅ MODIFIED: Gunakan pendekatan yang sama seperti updateSalesOrderAPI
  const testAllFetchApproaches = useCallback(async (): Promise<void> => {
    if (!isMountedRef.current || hasFetchedRef.current) return;

    hasFetchedRef.current = true;

    // console.log("🔄 Testing all fetch approaches...");

    // APPROACH 1: Gunakan accessTokenReadable dengan Authorization Header
    try {
      // console.log("🔧 Approach 1: accessTokenReadable + Authorization Header");
      const readableToken = getReadableToken();

      if (readableToken) {
        // console.log("🔑 Found accessTokenReadable, length:", readableToken.length);

        const userData = await fetchProfileWithAuthHeader(readableToken);
        if (userData) {
          // console.log("✅ Approach 1 SUCCESS - Profile fetched with Authorization Header");
          setUser(userData);
          setAccessToken(readableToken);
          setIsLoading(false);
          return;
        }
      } else {
        console.log("❌ No accessTokenReadable found");
      }
    } catch (error: unknown) {
      console.log("❌ Approach 1 failed:", error);
    }

    // APPROACH 2: Gunakan token dari autoRefresh system dengan Authorization Header
    try {
      // console.log("🔧 Approach 2: autoRefresh token + Authorization Header");
      const currentToken = getAccessToken();

      if (currentToken) {
        // console.log("🔑 Found token from autoRefresh, length:", currentToken.length);

        const userData = await fetchProfileWithAuthHeader(currentToken);
        if (userData) {
          // console.log("✅ Approach 2 SUCCESS - Profile fetched with autoRefresh token");
          setUser(userData);
          setIsLoading(false);
          return;
        }
      } else {
        console.log("❌ No token from autoRefresh system");
      }
    } catch (error: unknown) {
      console.log("❌ Approach 2 failed:", error);
    }

    // APPROACH 3: Manual cookie extraction + Authorization Header
    try {
      // console.log("🔧 Approach 3: Manual cookie + Authorization Header");
      const cookies = document.cookie.split(';');
      let accessToken = null;

      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'accessToken' && value) {
          accessToken = value;
          break;
        }
      }

      if (accessToken) {
        // console.log("🔑 Found accessToken manually, length:", accessToken.length);

        const userData = await fetchProfileWithAuthHeader(accessToken);
        if (userData) {
          // console.log("✅ Approach 3 SUCCESS - Profile fetched with manual token");
          setUser(userData);
          setAccessToken(accessToken);
          setIsLoading(false);
          return;
        }
      } else {
        console.log("❌ No accessToken found in manual extraction");
      }
    } catch (error: unknown) {
      console.log("❌ Approach 3 failed:", error);
    }

    // APPROACH 4: Fallback - withCredentials (jika semua Authorization Header gagal)
    try {
      // console.log("🔧 Approach 4: withCredentials (fallback)");
      const res = await axios.get<ProfileResponse | User>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/user-login/profile`,
        {
          withCredentials: true,
          timeout: 5000,
        }
      );

      // console.log("✅ Approach 4 SUCCESS - Profile fetched with credentials");

      const userData = extractUserData(res.data);
      if (userData) {
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.log("❌ Approach 4 failed:", error.response?.status);
      } else {
        console.log("❌ Approach 4 failed");
      }
    }

    setIsLoading(false);
  }, [fetchProfileWithAuthHeader]);

  useEffect(() => {
    isMountedRef.current = true;

    const initializeAuth = async (): Promise<void> => {
      if (isInitializingRef.current) return;
      isInitializingRef.current = true;

      try {
        // console.log("🚀 Initializing auth system...");

        // Initialize dengan accessTokenReadable jika ada
        const readableToken = getReadableToken();
        if (readableToken) {
          // console.log("🎯 Initializing with accessTokenReadable");
          setAccessToken(readableToken);
        }

        // Initialize auth system
        initAuthFromStorage();

        // Setup refresh executor  
        setRefreshExecutor(async (): Promise<string | null> => {
          try {
            // console.log("🔄 Refreshing token...");

            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({}),
                cache: "no-store",
              }
            );

            if (!response.ok) {
              throw new Error(`Refresh failed: ${response.status}`);
            }

            const data = await response.json();
            const newToken = data.token;

            if (newToken) {
              setAccessToken(newToken);
              // console.log("✅ Token refreshed successfully");
              return newToken;
            }
            return null;
          } catch (error) {
            console.error("❌ Token refresh failed", error);
            setAccessToken(null);
            setUser(null);
            hasFetchedRef.current = false;
            return null;
          }
        });

        onTokenChange((token: string | null) => {
          if (!isMountedRef.current) return;

          // console.log("🔑 Token change detected:", !!token);

          if (!token) {
            setUser(null);
            hasFetchedRef.current = false;
            setIsLoading(false);
            return;
          }

          if (!hasFetchedRef.current) {
            testAllFetchApproaches();
          } else {
            // Jika token berubah, fetch ulang profile dengan token baru
            // console.log("🔄 Token changed, refetching profile...");
            fetchProfileWithAuthHeader(token)
              .then(userData => {
                if (userData && isMountedRef.current) {
                  setUser(userData);
                }
              })
              .catch(error => {
                console.error("❌ Failed to refetch profile:", error);
              });
          }
        });

        // Check current token state
        const currentToken = getAccessToken();
        console.log("🔍 Current token state:", {
          hasToken: !!currentToken,
          hasFetched: hasFetchedRef.current
        });

        // Test semua approaches
        // console.log("🎯 Testing all fetch approaches...");
        testAllFetchApproaches();

      } catch (error) {
        console.error("❌ Auth initialization failed", error);
        setIsLoading(false);
      } finally {
        isInitializingRef.current = false;
      }
    };

    initializeAuth();

    return () => {
      isMountedRef.current = false;
    };
  }, [testAllFetchApproaches, fetchProfileWithAuthHeader]);

  useEffect(() => {
    // console.log("📊 Session State:", {
    //   user: user ? `User: ${user.email || user.name || user.id}` : "No user",
    //   isLoading
    // });
  }, [user, isLoading]);

  // ✅ RETURN LOADING SCREEN JIKA MASIH LOADING
  if (isLoading) {
    // console.log("🎯 [SESSION PROVIDER] Showing loading screen");
    return <LoadingScreen />;
  }

  // console.log("🎯 [SESSION PROVIDER] Rendering children");

  return (
    <SessionContext.Provider value={{ user, setUser, isLoading }}>
      {children}
    </SessionContext.Provider>
  );
}