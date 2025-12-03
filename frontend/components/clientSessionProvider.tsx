// components/clientSessionProvider.tsx
"use client";

import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingScreen } from "@/components/ui/loading-gears";
import { api } from "@/lib/http";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios"; // Import AxiosError untuk typing catch block

// --- 1. Definisi Tipe Data (Types) ---

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

// Menyesuaikan dengan struktur response backend Anda
interface ProfileResponse {
  success?: boolean;
  user?: User;
  // Fallback properties jika backend mengembalikan flat object
  id?: string;
  username?: string;
  role?: string;
  email?: string;
  name?: string;
  avatar?: string;
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  setUser: () => {},
  isLoading: true,
});

export function useSession() {
  return useContext(SessionContext);
}

// --- 2. Komponen Provider Utama ---

export default function ClientSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Mengambil state auth dari Context global
  const { accessToken, isAuthenticated } = useAuth();

  // Ref untuk mencegah "Double Fetch" di React Strict Mode (Development)
  const hasFetchedRef = useRef(false);
  const isMountedRef = useRef(true);
  const router = useRouter();

  // --- Helper: Extract Data User dengan Aman ---
  const extractUserData = useCallback(
    (data: ProfileResponse | User): User | null => {
      try {
        let userData: Partial<User> | undefined;

        // Cek apakah data dibungkus dalam properti 'user' (misal: { user: {...} })
        if (data && typeof data === "object" && "user" in data && data.user) {
          userData = data.user;
        } else {
          // Jika data langsung berupa object user
          userData = data as Partial<User>;
        }

        // Validasi minimal: harus punya ID
        if (userData && userData.id) {
          return {
            id: userData.id,
            username:
              userData.username ||
              userData.email?.split("@")[0] ||
              "user",
            role: userData.role || "user",
            email: userData.email,
            name: userData.name || userData.username,
            avatar: userData.avatar,
          };
        }

        return null;
      } catch (error) {
        console.error("[Session] Error processing user data:", error);
        return null;
      }
    },
    []
  );

  // --- 3. Fungsi Fetch Profile ke Backend ---
  const fetchProfile = useCallback(async (): Promise<User | null> => {
    try {
      // ✅ PERBAIKAN 1: Hapus '/api' di depan.
      // 'api' instance biasanya sudah punya baseURL: 'http://localhost:5000/api'
      // Jadi cukup panggil endpoint lanjutannya.
      const response = await api.get<ProfileResponse>("/api/auth/user-login/profile");

      const userData = extractUserData(response.data);
      return userData ?? null;

    } catch (err: unknown) {
      console.error("[fetchProfile] Error fetching profile:", err);

      let reason = "session_terminated";

      // ✅ PERBAIKAN 2: Type checking yang aman tanpa 'any'
      if (err instanceof AxiosError && err.response) {
        // Jika 401 lolos dari interceptor http.ts, berarti token refresh gagal total
        if (err.response.status === 401) {
          reason = "token_expired";
        } else if (err.response.status === 403) {
          reason = "access_denied";
        }
      } else if (err instanceof Error) {
        const msg = err.message.toLowerCase();
        if (msg.includes("single")) reason = "device_limit";
      }

      // Jika errornya fatal (bukan sekadar jaringan putus), redirect ke unauthorized
      if (err instanceof AxiosError && err.response?.status === 401) {
         router.replace(`/unauthorized?reason=${reason}`);
      }

      return null;
    }
  }, [router, extractUserData]);

  // --- 4. Logic Utama Inisialisasi Session ---
  const initializeSession = useCallback(async () => {
    if (!isMountedRef.current) return;

    // A. Jika belum login atau tidak ada token, reset state
    if (!isAuthenticated || !accessToken) {
      setUser(null);
      setIsLoading(false);
      hasFetchedRef.current = false; // Reset lock agar bisa fetch lagi nanti
      return;
    }

    // B. Proteksi React Strict Mode:
    // Jika sudah pernah fetch (dan sukses/sedang jalan), jangan fetch lagi.
    if (hasFetchedRef.current) {
      return;
    }

    // C. Eksekusi Fetch
    hasFetchedRef.current = true; // Kunci dulu sebelum request jalan

    const fetchedUser = await fetchProfile();

    if (isMountedRef.current) {
      if (fetchedUser) {
        setUser(fetchedUser);
        // hasFetchedRef tetap true karena data sudah valid
      } else {
        // Gagal fetch (misal koneksi error)
        setUser(null);
        // Buka kunci (false) agar useEffect berikutnya bisa mencoba lagi
        hasFetchedRef.current = false; 
      }
      setIsLoading(false);
    }
  }, [accessToken, isAuthenticated, fetchProfile]);

  // --- 5. useEffect Trigger ---
  useEffect(() => {
    isMountedRef.current = true;
    
    initializeSession();

    return () => {
      isMountedRef.current = false;
    };
  }, [initializeSession]);

  // Reset state jika user logout secara eksplisit
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