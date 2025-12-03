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
    const logoutInProgressRef = useRef(false);
    const hasRedirectedRef = useRef(false); // 🔹 pastikan redirect hanya sekali

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
        executeRefreshRef.current = null;
        isMountedRef.current = false;
    }, []);

    const logout = useCallback(async (): Promise<void> => {
        if (logoutInProgressRef.current) return;
        logoutInProgressRef.current = true;

        cleanup();

        if (isMountedRef.current) {
            setAccessToken(null);
            setAuthState({ isAuthenticated: false, role: null });
            setLoading(false);
        }

        clearAuthCookies();

        if (!hasRedirectedRef.current) {
            hasRedirectedRef.current = true;
            router.replace("/auth/login?reason=logout");
        }

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
        } catch {
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
        // CEK: Jika sudah di halaman unauthorized, JANGAN jalankan refresh
        if (typeof window !== 'undefined' &&
            (window.location.pathname === '/unauthorized' ||
                localStorage.getItem('refreshDisabled') === 'true')) {
            return false;
        }

        if (!isMountedRef.current || logoutInProgressRef.current || hasRedirectedRef.current) {
            return false;
        }

        try {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

            const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
                method: "POST",
                credentials: "include",
            });

            if (res.status === 401) {
                console.log('[Auth] 401 - Handling unauthorized');
                const errorData = await res.json().catch(() => ({}));

                // Handle device conflict
                if (errorData.error === "SESSION_REVOKED" || errorData.code === "DEVICE_CONFLICT") {
                    console.log('[Auth] 🚫 Device conflict detected!');

                    // 1. Clear semua state dan cookies
                    cleanup();
                    clearAuthCookies();

                    // 2. Set flag untuk mencegah loop
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('hasDeviceConflict', 'true');

                        // 3. Redirect hanya jika belum di halaman unauthorized
                        if (window.location.pathname !== '/unauthorized') {
                            console.log('[Auth] 🔀 Redirecting to /unauthorized');
                            window.location.href = '/unauthorized';
                        }
                    }

                    return false;
                }

                // Untuk error 401 lainnya
                if (isMountedRef.current) {
                    setAccessToken(null);
                    setAuthState({ isAuthenticated: false, role: null });
                    setLoading(false);
                }

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

                // Clear conflict flag jika berhasil refresh
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('hasDeviceConflict');
                }
            }

            return true;

        } catch (error) {
            console.error('[Auth] Refresh error:', error);
            cleanup();
            if (isMountedRef.current) {
                setAccessToken(null);
                setAuthState({ isAuthenticated: false, role: null });
                setLoading(false);
            }
            clearAuthCookies();

            // Hanya redirect jika bukan di halaman unauthorized
            if (!hasRedirectedRef.current &&
                typeof window !== 'undefined' &&
                window.location.pathname !== '/unauthorized') {
                hasRedirectedRef.current = true;
                router.replace("/auth/login?reason=session_error");
            }
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
            setLoading(false);
            return;
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
                setLoading(false);
                return;
            }
        }

        const refreshed = await executeRefresh();

        if (!refreshed) {
            setAuthState({ isAuthenticated: false, role: null });
        }

        setLoading(false);
    }, [executeRefresh, validateAndDecodeToken, setAuth, scheduleRefreshFromToken]);

    useEffect(() => {
        isMountedRef.current = true;
        logoutInProgressRef.current = false;
        hasRedirectedRef.current = false;

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
