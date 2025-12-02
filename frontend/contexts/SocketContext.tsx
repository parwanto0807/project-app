// contexts/SocketContext.tsx - FIXED VERSION
"use client";

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from 'react';
import ioClient from 'socket.io-client';
import { api } from '@/lib/http'; // IMPORT API CLIENT

const io = ioClient;

// Types (sama seperti sebelumnya)
export interface SessionData {
    id: string;
    createdAt: Date;
    revokedAt: Date | null;
    isRevoked: boolean;
    ipAddress: string;
    userAgent: string;
    expiresAt: Date;
}

export interface SocketEventMap {
    'session:updated': { sessions: SessionData[] };
    'session:revoked': { sessionId: string; userId: string };
    'session:logout-other': {
        userId: string;
        timestamp: string;
        revokedCount: number;
    };
    'session:logout-all': {
        userId: string;
        timestamp: string;
        revokedCount: number;
        currentSessionPreserved: boolean;
    };
    'pong': number;
    'connect': void;
    'disconnect': string;
    'connect_error': Error;
    'room-joined': { room: string; userId: string; success: boolean };
    'welcome': { message: string; socketId: string; timestamp: string };
}

export interface EmitEventMap {
    'join-user-room': string; // userId
    'ping': void;
    'session:revoke': { sessionId: string };
    'session:logout-other': void;
    'session:logout-all': void;
}

// Type untuk socket instance
type Socket = ReturnType<typeof io>;

// 🔥 GLOBAL FLAGS UNTUK CONTROL
let GLOBAL_LOGOUT_FLAG = false;
let IS_ON_LOGIN_PAGE = false;

export interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    sessions: SessionData[];
    authState: {
        isAuthenticated: boolean;
        userId: string | null;
    };
    updateSessions: (sessions: SessionData[]) => void;
    revokeSession: (sessionId: string) => Promise<void>;
    connectSocket: () => Promise<void>;
    disconnectSocket: () => void;
    sendEvent: <K extends keyof EmitEventMap>(
        event: K,
        data?: EmitEventMap[K]
    ) => void;
    checkAuthState: () => Promise<{ isAuthenticated: boolean; userId: string | null }>;
}

interface SocketProviderProps {
    children: ReactNode;
}

// Create context
const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    sessions: [],
    authState: { isAuthenticated: false, userId: null },
    updateSessions: () => { },
    revokeSession: async () => { },
    connectSocket: async () => { },
    disconnectSocket: () => { },
    sendEvent: () => { },
    checkAuthState: async () => ({ isAuthenticated: false, userId: null }),
});

// 🔥 EXPORT FUNCTIONS UNTUK DIACCESS DARI KOMPONEN LAIN
export const setSocketLogoutInProgress = (value: boolean) => {
    GLOBAL_LOGOUT_FLAG = value;
    console.log(`[Socket] 🚫 Global logout flag: ${value}`);

    // Auto reset setelah 30 detik
    if (value) {
        setTimeout(() => {
            GLOBAL_LOGOUT_FLAG = false;
            console.log('[Socket] 🔄 Global logout flag auto-reset');
        }, 30000);
    }
};

export const setSocketOnLoginPage = (value: boolean) => {
    IS_ON_LOGIN_PAGE = value;
    console.log(`[Socket] 🔧 Login page flag: ${value}`);
};

// 🔥 FUNCTION UNTUK CEK APAKAH BOLEH AUTH CHECK
const shouldSkipAuthCheck = (): boolean => {
    const skip = GLOBAL_LOGOUT_FLAG ||
        IS_ON_LOGIN_PAGE ||
        window.location.pathname.includes('/auth/login');

    if (skip) {
        console.log('[Socket] ⏸️ Skipping auth check due to:', {
            logoutFlag: GLOBAL_LOGOUT_FLAG,
            loginPageFlag: IS_ON_LOGIN_PAGE,
            pathname: window.location.pathname
        });
    }

    return skip;
};


// Custom hook
export const useSocket = (): SocketContextType => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within SocketProvider');
    }
    return context;
};

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [sessions, setSessions] = useState<SessionData[]>([]);
    const socketRef = useRef<Socket | null>(null);

    // Auth state menggunakan ref dan state
    const authStateRef = useRef<{
        isAuthenticated: boolean;
        userId: string | null;
    }>({
        isAuthenticated: false,
        userId: null
    });

    const [authState, setAuthState] = useState(authStateRef.current);

    // Refs untuk kontrol lifecycle
    const isConnectingRef = useRef<boolean>(false);
    const authCheckInProgressRef = useRef<boolean>(false);
    const hasConnectedRef = useRef<boolean>(false);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const mountRef = useRef<boolean>(true);
    const connectionAttemptRef = useRef<number>(0);

    // Function untuk check auth state - FIXED dengan flag mounted
    const checkAuthState = useCallback(async (): Promise<{
        isAuthenticated: boolean;
        userId: string | null;
    }> => {
        // 🔥 CHECK 1: Skip jika logout flag active atau di login page
        if (shouldSkipAuthCheck()) {
            console.log('[Socket] ⏸️ Skipping auth check - logout/login page flag active');
            return authStateRef.current; // Return cached state
        }

        // 🔥 CHECK 2: Jika di login page dengan parameter logout
        if (window.location.pathname.includes('/auth/login')) {
            const params = new URLSearchParams(window.location.search);
            if (params.has('logout') || params.has('reason') || params.has('session_expired')) {
                console.log('[Socket] ⏸️ Skipping auth check - on login page with logout param');
                return { isAuthenticated: false, userId: null };
            }
        }

        // Skip jika sudah ada yang sedang check
        if (authCheckInProgressRef.current) {
            console.log('[Socket] Auth check already in progress, returning cached state');
            return authStateRef.current;
        }

        authCheckInProgressRef.current = true;
        console.log('[Socket] Checking auth state via profile API...');

        try {
            // 🔥 GUNAKAN ABORT CONTROLLER
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 detik timeout

            const response = await api.get('/api/auth/user-login/profile', {
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            console.log('[Socket] Profile API response:', response.data);

            let newAuthState: { isAuthenticated: boolean; userId: string | null };

            if (response.data?.user?.id || response.data?.id) {
                const userId = response.data.user?.id || response.data.id;
                console.log('[Socket] ✅ User authenticated:', userId);

                newAuthState = {
                    isAuthenticated: true,
                    userId
                };
            } else {
                console.warn('[Socket] ❌ No user ID in response');
                newAuthState = {
                    isAuthenticated: false,
                    userId: null
                };
            }

            // Update state jika berbeda
            if (authStateRef.current.isAuthenticated !== newAuthState.isAuthenticated ||
                authStateRef.current.userId !== newAuthState.userId) {

                authStateRef.current = newAuthState;
                setAuthState(newAuthState);
                console.log('[Socket] Auth state updated:', newAuthState);
            }

            return newAuthState;

        } catch (error: unknown) {
            // 🔥 CLEAR TIMEOUT JIKA ERROR
            // clearTimeout(timeoutId);

            // 🔥 ABORT ERROR - IGNORE
            if (error instanceof Error && error.name === 'AbortError') {
                console.log('[Socket] Auth check timeout');
                return authStateRef.current;
            }

            console.error('[Socket] ❌ Auth check failed:', error);

            // 🔥 UNTUK 401 ERROR, SET STATE KE FALSE TAPI JANGAN PANIC
            const is401Error = (err: unknown): boolean => {
                return (
                    err !== null &&
                    typeof err === 'object' &&
                    'response' in err &&
                    err.response !== null &&
                    typeof err.response === 'object' &&
                    'status' in err.response &&
                    err.response.status === 401
                );
            };

            if (is401Error(error)) {
                console.log('[Socket] 🔒 401 detected - user not authenticated');
            }

            const newAuthState = {
                isAuthenticated: false,
                userId: null
            };

            // Update hanya jika berbeda
            if (authStateRef.current.isAuthenticated !== newAuthState.isAuthenticated) {
                authStateRef.current = newAuthState;
                setAuthState(newAuthState);
                console.log('[Socket] Auth state updated to false due to error');
            }

            return newAuthState;

        } finally {
            // Reset flag
            setTimeout(() => {
                authCheckInProgressRef.current = false;
            }, 50);
        }
    }, []);

    // Function untuk connect socket - FIXED dengan connectionAttempt
    const connectSocket = useCallback(async (): Promise<void> => {
        console.log('[Socket] connectSocket() called, attempt:', connectionAttemptRef.current + 1);

        // Clear any pending reconnect timeout
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        // Jika sudah connecting, skip
        if (isConnectingRef.current) {
            console.log('[Socket] Already connecting, skipping...');
            return;
        }

        // Jika sudah connected, skip
        if (socketRef.current?.connected) {
            console.log('[Socket] Socket already connected');
            return;
        }

        // Batasi attempt maksimum
        connectionAttemptRef.current++;
        if (connectionAttemptRef.current > 3) {
            console.warn('[Socket] Max connection attempts reached, waiting...');
            return;
        }

        // Check auth state
        const currentAuth = authStateRef.current;
        if (!currentAuth.isAuthenticated || !currentAuth.userId) {
            console.warn('[Socket] Cannot connect: User not authenticated');
            return;
        }

        console.log('[Socket] Connecting with user ID:', currentAuth.userId);

        // Disconnect existing socket
        if (socketRef.current) {
            console.log('[Socket] Cleaning up existing socket');
            socketRef.current.removeAllListeners();
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        isConnectingRef.current = true;

        try {
            const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
            console.log('[Socket] Connecting to:', socketUrl);

            // Socket connection options
            const socketInstance = io(socketUrl, {
                transports: ["websocket", "polling"],
                autoConnect: true,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 2000,
                timeout: 10000,
                // PENTING: denganCredentials untuk kirim cookies
                // withCredentials: true,
                query: {
                    userId: currentAuth.userId,
                    timestamp: Date.now().toString(),
                    attempt: connectionAttemptRef.current.toString()
                },
                ...(process.env.NODE_ENV === 'development' && {
                    // Debug options
                    forceNew: false,
                    upgrade: true
                })
            });

            // Setup event handlers
            const setupEventListeners = () => {
                // Di function connectSocket(), bagian socketInstance.on('connect'):
                // Di SocketContext.tsx, bagian socketInstance.on('connect'):
                // Di socket.on('connect'):
                socketInstance.on('connect', () => {
                    console.log('✅ [Socket] CONNECTED! ID:', socketInstance.id);
                    setIsConnected(true);
                    isConnectingRef.current = false;
                    hasConnectedRef.current = true;
                    connectionAttemptRef.current = 0;

                    console.log(`[Socket] Connected as user: ${currentAuth.userId}`);

                    // ⚠️ TAMBAHKAN: Request session updates setelah connect
                    setTimeout(() => {
                        if (mountRef.current && socketInstance.connected) {
                            console.log('[Socket] Requesting latest sessions...');
                            // Emit event ke server untuk minta session terbaru
                            socketInstance.emit('session:get-latest');
                        }
                    }, 1000); // Tunggu 1 detik setelah connect
                });

                socketInstance.on('disconnect', (reason: string) => {
                    console.log('🔴 [Socket] DISCONNECTED:', reason);
                    setIsConnected(false);
                    isConnectingRef.current = false;

                    // Hanya reconnect jika user masih authenticated
                    if (mountRef.current && authStateRef.current.isAuthenticated) {
                        console.log('[Socket] Scheduling reconnect in 2s...');
                        reconnectTimeoutRef.current = setTimeout(() => {
                            reconnectTimeoutRef.current = null;
                            if (mountRef.current && authStateRef.current.isAuthenticated) {
                                connectSocket();
                            }
                        }, 2000);
                    }
                });

                socketInstance.on('connect_error', (error: Error) => {
                    console.error('❌ [Socket] CONNECT ERROR:', error.message);
                    setIsConnected(false);
                    isConnectingRef.current = false;

                    // Handle auth errors
                    const errorMessage = error.message.toLowerCase();
                    if (errorMessage.includes('auth') ||
                        errorMessage.includes('token') ||
                        errorMessage.includes('401') ||
                        errorMessage.includes('unauthorized')) {

                        console.log('[Socket] Authentication error detected, checking auth...');
                        checkAuthState();
                    }
                });

                socketInstance.on('room-joined', (data: SocketEventMap['room-joined']) => {
                    console.log('🏠 [Socket] ROOM JOINED:', data);
                });

                socketInstance.on('welcome', (data: SocketEventMap['welcome']) => {
                    console.log('👋 [Socket] WELCOME:', data.message);
                });

                // Realtime events
                socketInstance.on('session:updated', (data: SocketEventMap['session:updated']) => {
                    console.log('📡 [Socket] SESSION UPDATED:', data.sessions.length, 'sessions');
                    setSessions(data.sessions);

                    // Dispatch event untuk komponen lain
                    if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('sessions:updated', {
                            detail: data.sessions
                        }));
                    }
                });

                socketInstance.on('session:revoked', (data: SocketEventMap['session:revoked']) => {
                    console.log('📡 [Socket] SESSION REVOKED:', data);

                    // Jika session saat ini yang direvoke
                    if (data.sessionId === socketInstance.id) {
                        console.log('[Socket] Current session revoked, logging out...');
                        checkAuthState();
                    }
                });

                socketInstance.on('pong', (latency: number) => {
                    console.log(`🏓 [Socket] PONG: ${latency}ms`);
                });
            };

            setupEventListeners();
            socketRef.current = socketInstance;
            setSocket(socketInstance);

            console.log('[Socket] Socket instance created successfully');

        } catch (error) {
            console.error('❌ [Socket] ERROR creating socket:', error);
            isConnectingRef.current = false;
            setIsConnected(false);
            hasConnectedRef.current = false;

            // Jangan reset attempt counter di sini, biarkan reconnect logic handle
        }
    }, [checkAuthState]);

    // Function untuk disconnect socket
    const disconnectSocket = useCallback((): void => {
        console.log('[Socket] disconnectSocket() called');

        // Clear pending reconnects
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        isConnectingRef.current = false;
        hasConnectedRef.current = false;
        connectionAttemptRef.current = 0;

        if (socketRef.current) {
            // Remove all listeners first
            socketRef.current.removeAllListeners();

            // Disconnect
            socketRef.current.disconnect();
            socketRef.current = null;
            setSocket(null);
        }

        setIsConnected(false);
        console.log('[Socket] Socket manually disconnected');
    }, []);

    // Function untuk revoke session
    const revokeSession = useCallback(async (sessionId: string): Promise<void> => {
        console.log('[Socket] revokeSession() called for:', sessionId);
        try {
            await api.post('/api/user/sessions/revoke', { sessionId });
            console.log('[Socket] Session revoked successfully');

            // Emit event ke socket
            if (socketRef.current?.connected) {
                socketRef.current.emit('session:revoke', { sessionId });
            }
        } catch (error) {
            console.error('[Socket] Error revoking session:', error);
            throw error;
        }
    }, []);

    // Function untuk update sessions
    const updateSessions = useCallback((newSessions: SessionData[]): void => {
        setSessions(newSessions);
    }, []);

    // Function untuk send event
    const sendEvent = useCallback(<K extends keyof EmitEventMap>(
        event: K,
        data?: EmitEventMap[K]
    ): void => {
        console.log(`[Socket] sendEvent() called: ${event}`);
        if (socketRef.current?.connected) {
            socketRef.current.emit(event, data);
            console.log(`[Socket] Event sent: ${event}`);
        } else {
            console.warn('[Socket] Cannot send event: Socket not connected');
        }
    }, []);

    useEffect(() => {
        console.log(`[Socket] Connection state changed: ${isConnected ? 'CONNECTED' : 'DISCONNECTED'}`);

        if (isConnected && socket) {
            console.log(`[Socket] Current socket ID: ${socket.id}`);
            console.log(`[Socket] Socket connected: ${socket.connected}`);
        }
    }, [isConnected, socket]);

    useEffect(() => {
        if (!socket) return;

        console.log('[Socket] Setting up session update listener...');

        const handleSessionUpdated = (data: SocketEventMap['session:updated']) => {
            console.log('📡 [Socket] SESSION UPDATED RECEIVED:', data.sessions.length, 'sessions');
            setSessions(data.sessions);

            // Dispatch ke window event
            window.dispatchEvent(new CustomEvent('sessions:updated', {
                detail: data.sessions
            }));
        };

        socket.on('session:updated', handleSessionUpdated);

        return () => {
            socket.off('session:updated', handleSessionUpdated);
        };
    }, [socket]);

    // Effect utama untuk inisialisasi - FIXED untuk React Strict Mode
    useEffect(() => {
        console.log('[Socket] Provider mounted');
        mountRef.current = true;
        connectionAttemptRef.current = 0;

        const initialize = async () => {
            // Tunggu sedikit untuk menghindari race condition dengan Strict Mode
            await new Promise(resolve => setTimeout(resolve, 100));

            if (!mountRef.current) return;

            // Check auth state
            const authResult = await checkAuthState();

            if (authResult.isAuthenticated && authResult.userId && mountRef.current) {
                console.log('[Socket] Initial auth check passed, scheduling socket connection...');

                // Tunggu extra untuk pastikan tidak ada double mount
                setTimeout(() => {
                    if (mountRef.current &&
                        authStateRef.current.isAuthenticated &&
                        !hasConnectedRef.current &&
                        !isConnectingRef.current) {
                        connectSocket();
                    }
                }, 800);
            }
        };

        initialize();

        // Cleanup
        return () => {
            console.log('[Socket] Provider unmounting');
            mountRef.current = false;

            // Clear semua timeout
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }

            disconnectSocket();
        };
    }, [checkAuthState, connectSocket, disconnectSocket]);

    // Effect untuk handle auth state changes - FIXED dengan debouncing
    useEffect(() => {
        const { isAuthenticated, userId } = authState;
        console.log('[Socket] Auth state changed:', { isAuthenticated, userId });

        // Gunakan const karena timeoutId hanya diassign sekali
        const timeoutId = setTimeout(() => {
            // Jika user logout, disconnect
            if (!isAuthenticated && (socketRef.current?.connected || isConnectingRef.current)) {
                console.log('[Socket] User logged out, disconnecting...');
                disconnectSocket();
            }
            // Jika user login, belum connected, dan bukan dari initial mount
            else if (isAuthenticated && userId && !hasConnectedRef.current && !isConnectingRef.current) {
                console.log('[Socket] User authenticated, attempting connection...');
                connectSocket();
            }
        }, 300); // Debounce 300ms

        return () => clearTimeout(timeoutId);
    }, [authState, connectSocket, disconnectSocket]);

    // Listen untuk storage events
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key?.includes('token') || e.key?.includes('auth')) {
                console.log('[Socket] Auth storage changed, checking auth...');
                checkAuthState();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [checkAuthState]);

    // Context value
    const contextValue: SocketContextType = {
        socket,
        isConnected,
        sessions,
        authState,
        updateSessions,
        revokeSession,
        connectSocket,
        disconnectSocket,
        sendEvent,
        checkAuthState,
    };

    return (
        <SocketContext.Provider value={contextValue}>
            {children}
        </SocketContext.Provider>
    );
};

// Custom hook untuk listen specific events
export const useSocketEvent = <K extends keyof SocketEventMap>(
    event: K,
    callback: (data: SocketEventMap[K]) => void
): void => {
    const { socket } = useSocket();

    useEffect(() => {
        if (!socket) return;

        const handler = (data: SocketEventMap[K]) => callback(data);
        socket.on(event, handler);

        return () => {
            socket.off(event, handler);
        };
    }, [socket, event, callback]);
};

// Hook untuk listen session updates
export const useSessionUpdates = (): {
    sessions: SessionData[];
    updateSessions: (sessions: SessionData[]) => void
} => {
    const { sessions, updateSessions } = useSocket();

    useEffect(() => {
        const handleSessionsUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<SessionData[]>;
            if (customEvent.detail) {
                updateSessions(customEvent.detail);
            }
        };

        window.addEventListener('sessions:updated', handleSessionsUpdated);

        return () => {
            window.removeEventListener('sessions:updated', handleSessionsUpdated);
        };
    }, [updateSessions]);

    return { sessions, updateSessions };
};

// Type untuk custom event
declare global {
    interface WindowEventMap {
        'sessions:updated': CustomEvent<SessionData[]>;
    }
}