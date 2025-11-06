"use client";

import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import axios from "axios";
import {
  initAuthFromStorage,
  setRefreshExecutor,
  setAccessToken,
  onTokenChange,
  getAccessToken,
} from "@/lib/autoRefresh";

// Tipe data user
export interface User {
  id: string;
  username: string;
  role: string;
  // tambahkan fields lain sesuai kebutuhan
  email?: string;
  name?: string;
}

// Context type
interface SessionContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
}

// Context dengan default values
const SessionContext = createContext<SessionContextType>({
  user: null,
  setUser: () => { },
  isLoading: true,
});

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a ClientSessionProvider");
  }
  return context;
}

export default function ClientSessionProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser: User | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    const initializeAuth = async () => {
      try {
        // Initialize auth system
        initAuthFromStorage();

        // Setup refresh executor
        setRefreshExecutor(async () => {
          try {
            const res = await axios.post(
              `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
              {},
              { 
                withCredentials: true,
                timeout: 10000 // 10 second timeout
              }
            );

            const newToken = res.data.token;
            if (newToken) {
              setAccessToken(newToken);
              return newToken;
            }
            return null;
          } catch (error) {
            console.error("Token refresh failed:", error);
            setAccessToken(null);
            setUser(null);
            return null;
          }
        });

        // Setup token change listener
        unsubscribe = onTokenChange(async (token) => {
          if (!isMounted) return;

          if (!token) {
            setUser(null);
            setIsLoading(false);
            return;
          }

          try {
            // Fetch user data when token changes
            const res = await axios.get(
              `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
              { 
                withCredentials: true,
                timeout: 10000,
                headers: {
                  Authorization: `Bearer ${token}`, // Explicitly send token
                }
              }
            );
            
            if (isMounted) {
              setUser(res.data);
            }
          } catch (error) {
            console.error("Failed to fetch user data:", error);
            if (isMounted) {
              setUser(null);
            }
          } finally {
            if (isMounted) {
              setIsLoading(false);
            }
          }
        });

        // Check if we have a token but no user data (initial load)
        const currentToken = getAccessToken();
        if (currentToken && !initialUser && isMounted) {
          // Trigger user data fetch
          const fetchUserData = async () => {
            try {
              const res = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
                { 
                  withCredentials: true,
                  headers: {
                    Authorization: `Bearer ${currentToken}`,
                  }
                }
              );
              if (isMounted) {
                setUser(res.data);
              }
            } catch (error) {
              console.error("Failed to fetch initial user data:", error);
              if (isMounted) {
                setUser(null);
              }
            } finally {
              if (isMounted) {
                setIsLoading(false);
              }
            }
          };
          
          fetchUserData();
        } else {
          setIsLoading(false);
        }

      } catch (error) {
        console.error("Auth initialization failed:", error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Cleanup function
    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [initialUser]); // Add initialUser as dependency

  return (
    <SessionContext.Provider value={{ user, setUser, isLoading }}>
      {children}
    </SessionContext.Provider>
  );
}