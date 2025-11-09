// components/clientSessionProvider.tsx (FIXED - NO ESLINT WARNINGS)
"use client";

import { createContext, useState, useContext, ReactNode, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import {
  initAuthFromStorage,
  setRefreshExecutor,
  setAccessToken,
  onTokenChange,
  getAccessToken,
} from "@/lib/autoRefresh";
import { LoadingScreen } from "@/components/ui/loading-gears";

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
  };

  // ✅ Function untuk fetch profile menggunakan Authorization Header
  const fetchProfileWithAuthHeader = useCallback(async (token: string): Promise<User | null> => {
    try {
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

      if (!response.ok) {
        return null;
      }

      const data: ProfileResponse | User = await response.json();
      const userData = extractUserData(data);

      if (userData) {
        return userData;
      }

      return null;
    } catch {
      console.error("Profile fetch error");
      return null;
    }
  }, []);

  // ✅ FIXED: Hanya fetch profile jika ada token yang valid
  const testAllFetchApproaches = useCallback(async (): Promise<void> => {
    if (!isMountedRef.current || hasFetchedRef.current) return;

    // ✅ CHECK: Jika tidak ada token sama sekali, skip fetch dan set loading false
    const readableToken = getReadableToken();
    const currentToken = getAccessToken();
    
    // Cek manual di cookies juga
    let cookieToken = null;
    try {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'accessToken' && value) {
          cookieToken = value;
          break;
        }
      }
    } catch {
      // Ignore cookie errors
    }

    const hasAnyValidToken = !!(readableToken || currentToken || cookieToken);

    if (!hasAnyValidToken) {
      console.log("No valid token found, skipping profile fetch");
      setUser(null);
      setIsLoading(false);
      return;
    }

    hasFetchedRef.current = true;

    // APPROACH 1: Gunakan accessTokenReadable dengan Authorization Header
    try {
      if (readableToken) {
        const userData = await fetchProfileWithAuthHeader(readableToken);
        if (userData) {
          setUser(userData);
          setAccessToken(readableToken);
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // Continue to next approach
    }

    // APPROACH 2: Gunakan token dari autoRefresh system dengan Authorization Header
    try {
      if (currentToken) {
        const userData = await fetchProfileWithAuthHeader(currentToken);
        if (userData) {
          setUser(userData);
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // Continue to next approach
    }

    // APPROACH 3: Manual cookie extraction + Authorization Header
    try {
      if (cookieToken) {
        const userData = await fetchProfileWithAuthHeader(cookieToken);
        if (userData) {
          setUser(userData);
          setAccessToken(cookieToken);
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // Continue to next approach
    }

    // APPROACH 4: Fallback - withCredentials (jika semua Authorization Header gagal)
    try {
      const res = await axios.get<ProfileResponse | User>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/user-login/profile`,
        {
          withCredentials: true,
          timeout: 5000,
        }
      );

      const userData = extractUserData(res.data);
      if (userData) {
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch {
      // Final fallback - set no user
      console.log("All profile fetch approaches failed, setting user to null");
      setUser(null);
    }

    setIsLoading(false);
  }, [fetchProfileWithAuthHeader]); // ✅ FIXED: No missing dependencies

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

        // Setup refresh executor  
        setRefreshExecutor(async (): Promise<string | null> => {
          try {
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
              return newToken;
            }
            return null;
          } catch (error) {
            console.error("Token refresh failed", error);
            setAccessToken(null);
            setUser(null);
            hasFetchedRef.current = false;
            return null;
          }
        });

        onTokenChange((token: string | null) => {
          if (!isMountedRef.current) return;

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
            fetchProfileWithAuthHeader(token)
              .then(userData => {
                if (userData && isMountedRef.current) {
                  setUser(userData);
                }
              })
              .catch(() => {
                console.error("Failed to refetch profile");
              });
          }
        });

        // ✅ FIXED: Check tokens inline instead of using separate function
        const readableTokenCheck = getReadableToken();
        const currentTokenCheck = getAccessToken();
        
        let cookieTokenCheck = null;
        try {
          const cookies = document.cookie.split(';');
          for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'accessToken' && value) {
              cookieTokenCheck = value;
              break;
            }
          }
        } catch {
          // Ignore cookie errors
        }

        const hasAnyValidToken = !!(readableTokenCheck || currentTokenCheck || cookieTokenCheck);

        if (hasAnyValidToken) {
          testAllFetchApproaches();
        } else {
          // ✅ No tokens found, skip profile fetch and finish loading
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
  }, [testAllFetchApproaches, fetchProfileWithAuthHeader]); // ✅ FIXED: No missing dependencies

  // ✅ RETURN LOADING SCREEN JIKA MASIH LOADING
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SessionContext.Provider value={{ user, setUser, isLoading }}>
      {children}
    </SessionContext.Provider>
  );
}