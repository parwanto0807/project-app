"use client";
import React, {
    createContext,
    useContext,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

interface AuthContextType {
    accessToken: string | null;
    loading: boolean;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    role: string | null;
}

interface AuthState {
    isAuthenticated: boolean;
    role: string | null;
}

const AuthContext = createContext<AuthContextType>({
    accessToken: null,
    loading: true,
    logout: async () => { },
    isAuthenticated: false,
    role: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [authState, setAuthState] = useState<AuthState>({
        isAuthenticated: false,
        role: null,
    });

    const executeRefreshRef = useRef<(() => Promise<boolean>) | null>(null);
    const isMountedRef = useRef(true);
    const logoutInProgressRef = useRef(false); // 🔥 TAMBAHKAN INI

    const getCookie = (name: string) => {
        if (typeof document === 'undefined') return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
        return null;
    };

    const clearAuthCookies = () => {
        document.cookie = "accessToken=; Max-Age=0; path=/; SameSite=Strict";
        document.cookie = "accessTokenReadable=; Max-Age=0; path=/; SameSite=Strict";
        document.cookie = "refreshToken=; Max-Age=0; path=/; SameSite=Strict";
    };

    const cleanup = useCallback(() => {
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }
        isMountedRef.current = false;
        executeRefreshRef.current = null;
    }, []);

    const logout = useCallback(async (): Promise<void> => {
        // 🔥 CEK JIKA SUDAH DALAM PROSES LOGOUT
        if (logoutInProgressRef.current) return;
        logoutInProgressRef.current = true;

        cleanup();

        if (isMountedRef.current) {
            setAccessToken(null);
            setAuthState({ isAuthenticated: false, role: null });
            setLoading(false);
        }

        clearAuthCookies();

        // 🔥 HAPUS CALL BACKEND LOGOUT JIKA TOKEN SUDAH INVALID
        // Tidak perlu call logout endpoint jika token sudah 401
        // Karena akan dapat error lagi

        // Redirect langsung tanpa menunggu
        router.replace("/auth/login?reason=logout");
        
        // 🔥 RESET FLAG SETELAH REDIRECT
        setTimeout(() => {
            logoutInProgressRef.current = false;
        }, 1000);
    }, [router, cleanup]);

    const setAuth = useCallback(({ isAuthenticated, role }: AuthState) => {
        if (isMountedRef.current) {
            setAuthState({ isAuthenticated, role });
        }
    }, []);

    const calculateTimeUntilExpiry = (token: string): number => {
        try {
            const decoded = jwtDecode<{ exp: number }>(token);
            const currentTime = Math.floor(Date.now() / 1000);
            const expiresIn = decoded.exp - currentTime;
            return expiresIn;
        } catch  {
            return 0;
        }
    };

    const scheduleRefreshFromToken = useCallback((token: string) => {
        if (!isMountedRef.current || logoutInProgressRef.current) return;

        const expiresIn = calculateTimeUntilExpiry(token);

        if (expiresIn <= 0) {
            if (executeRefreshRef.current) {
                executeRefreshRef.current();
            }
            return;
        }

        const refreshTime = Math.max(expiresIn * 1000 - 10000, 5000);

        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
        }

        refreshTimerRef.current = setTimeout(() => {
            if (executeRefreshRef.current && isMountedRef.current && !logoutInProgressRef.current) {
                executeRefreshRef.current();
            }
        }, refreshTime);
    }, []);

    const executeRefresh = useCallback(async (): Promise<boolean> => {
        // 🔥 CEK JIKA SEDANG LOGOUT ATAU TIDAK MOUNTED
        if (!isMountedRef.current || logoutInProgressRef.current) {
            return false;
        }

        try {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

            const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
                method: "POST",
                credentials: "include",
            });

            if (res.status === 401) {
                // 🔥 JANGAN PANGGIL LOGOUT() LAGI - LANGSUNG CLEANUP SAJA
                cleanup();
                if (isMountedRef.current) {
                    setAccessToken(null);
                    setAuthState({ isAuthenticated: false, role: null });
                    setLoading(false);
                }
                clearAuthCookies();
                router.replace("/auth/login?reason=session_expired");
                return false;
            }

            if (!res.ok) {
                return false;
            }

            const data = await res.json();

            if (!data.success || !data.accessToken) {
                return false;
            }

            if (isMountedRef.current) {
                setAccessToken(data.accessToken);

                const decoded = jwtDecode<{ exp: number; role: string }>(data.accessToken);
                setAuth({
                    isAuthenticated: true,
                    role: decoded.role
                });

                scheduleRefreshFromToken(data.accessToken);
            }

            return true;

        } catch {
            // 🔥 JANGAN PANGGIL LOGOUT() - LANGSUNG CLEANUP
            cleanup();
            if (isMountedRef.current) {
                setAccessToken(null);
                setAuthState({ isAuthenticated: false, role: null });
                setLoading(false);
            }
            clearAuthCookies();
            return false;
        }
    }, [setAuth, scheduleRefreshFromToken, cleanup, router]);

    useEffect(() => {
        executeRefreshRef.current = executeRefresh;
    }, [executeRefresh]);

    const validateAndDecodeToken = useCallback((token: string) => {
        try {
            const decoded = jwtDecode<{ exp: number; role: string }>(token);
            const currentTime = Date.now() / 1000;

            if (decoded.exp < currentTime) {
                return null;
            }

            return decoded;
        } catch {
            return null;
        }
    }, []);

    const initCheck = useCallback(async () => {
    if (logoutInProgressRef.current) {
        return setLoading(false);
    }

    const tokenReadable = getCookie("accessTokenReadable");

    if (tokenReadable) {
        const decoded = validateAndDecodeToken(tokenReadable);
        if (decoded) {
            setAccessToken(tokenReadable);
            setAuth({
                isAuthenticated: true,
                role: decoded.role
            });
            scheduleRefreshFromToken(tokenReadable);
            return setLoading(false);
        }
    }

    const refreshed = await executeRefresh();

    if (!refreshed) {
        setAuthState({ isAuthenticated: false, role: null });
    }

    setLoading(false); // 🔥 PASTIKAN INI HANYA DI SINI
}, [executeRefresh, validateAndDecodeToken, setAuth, scheduleRefreshFromToken]);


    useEffect(() => {
        isMountedRef.current = true;
        logoutInProgressRef.current = false;

        initCheck();

        return () => {
            cleanup();
        };
    }, [initCheck, cleanup]);

    const value: AuthContextType = {
        accessToken,
        loading,
        logout,
        isAuthenticated: authState.isAuthenticated,
        role: authState.role,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
    
};
