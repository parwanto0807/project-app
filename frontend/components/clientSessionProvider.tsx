// components/clientSessionProvider.tsx (SIMPLIFIED - NO AUTO REFRESH)
"use client";

import { createContext, useState, useContext, ReactNode, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext"; // ← IMPORT AUTH CONTEXT
import { LoadingScreen } from "@/components/ui/loading-gears";
import { api } from "@/lib/http";

export interface User {
  id: string;
  username: string;
  role: string;
  email?: string;
  name?: string;
  avatar?: string;
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
  avatar?: string;
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
  const { accessToken, isAuthenticated } = useAuth(); // ← USE AUTH CONTEXT

  const hasFetchedRef = useRef(false);
  const isMountedRef = useRef(true);

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
          avatar: userData.avatar,
        };

        return processedUser;
      }

      return null;
    } catch (error) {
      console.error("Error processing user data:", error);
      return null;
    }
  }, []);

  // ✅ SIMPLIFIED: Function untuk fetch profile
  const fetchProfile = useCallback(async (): Promise<User | null> => {
    try {
      const response = await api.get<ProfileResponse | User>(
        `/api/auth/user-login/profile`
      );

      const userData = extractUserData(response.data);
      return userData ?? null;
    } catch (err) {
      console.error("[fetchProfile] Error:", err);
      return null;
    }
  }, [extractUserData]);

  // ✅ SIMPLIFIED: Fetch profile hanya ketika ada token dan authenticated
  const fetchUserProfile = useCallback(async (): Promise<void> => {
    if (!isMountedRef.current || hasFetchedRef.current) return;

    // Hanya fetch jika ada accessToken dan user authenticated
    if (accessToken && isAuthenticated) {
      hasFetchedRef.current = true;

      console.log("Fetching user profile...");
      const userData = await fetchProfile();
      if (userData) {
        console.log("Profile fetched successfully");
        setUser(userData);
      } else {
        console.log("Profile fetch failed");
        setUser(null);
      }
    } else if (!isAuthenticated) {
      // Clear user ketika tidak authenticated
      setUser(null);
      hasFetchedRef.current = false;
    }

    setIsLoading(false);
  }, [accessToken, isAuthenticated, fetchProfile]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchUserProfile();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchUserProfile]);

  // Reset fetched state ketika auth state berubah
  useEffect(() => {
    if (!isAuthenticated) {
      hasFetchedRef.current = false;
      setUser(null);
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SessionContext.Provider value={{ user, setUser, isLoading }}>
      {children}
    </SessionContext.Provider>
  );
}