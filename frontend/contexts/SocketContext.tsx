// contexts/SocketContext.tsx - ALTERNATIVE (NO ESLINT WARNING)
"use client";

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from 'react';
import ioClient from 'socket.io-client';
import { api } from '@/lib/http';

const io = ioClient;

// Types (same as before)
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
    'join-user-room': string;
    'ping': void;
    'session:revoke': { sessionId: string };
    'session:logout-other': void;
    'session:logout-all': void;
}

type Socket = ReturnType<typeof io>;

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

export const setSocketLogoutInProgress = (value: boolean) => {
    GLOBAL_LOGOUT_FLAG = value;
    if (value) {
        setTimeout(() => {
            GLOBAL_LOGOUT_FLAG = false;
        }, 30000);
    }
};

export const setSocketOnLoginPage = (value: boolean) => {
    IS_ON_LOGIN_PAGE = value;
};

const shouldSkipAuthCheck = (): boolean => {
    return GLOBAL_LOGOUT_FLAG ||
        IS_ON_LOGIN_PAGE ||
        window.location.pathname.includes('/auth/login');
};

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

    const authStateRef = useRef<{
        isAuthenticated: boolean;
        userId: string | null;
    }>({
        isAuthenticated: false,
        userId: null
    });

    const [authState, setAuthState] = useState(authStateRef.current);

    const isConnectingRef = useRef<boolean>(false);
    const authCheckInProgressRef = useRef<boolean>(false);
    const hasConnectedRef = useRef<boolean>(false);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const mountRef = useRef<boolean>(true);
    const connectionAttemptRef = useRef<number>(0);
    const authCheckDebounceRef = useRef<NodeJS.Timeout | null>(null);
    const connectDebounceRef = useRef<NodeJS.Timeout | null>(null);
    const lastAuthCheckRef = useRef<number>(0);
    const lastConnectAttemptRef = useRef<number>(0);

    // 🔥 FIX: Use ref untuk store functions
    const functionsRef = useRef<{
        checkAuthState: () => Promise<{ isAuthenticated: boolean; userId: string | null }>;
        connectSocket: () => Promise<void>;
        disconnectSocket: () => void;
    } | null>(null);

    // Check auth state
    const checkAuthState = useCallback(async (): Promise<{
        isAuthenticated: boolean;
        userId: string | null;
    }> => {
        const now = Date.now();
        const timeSinceLastCheck = now - lastAuthCheckRef.current;

        if (timeSinceLastCheck < 2000) {
            return authStateRef.current;
        }

        if (shouldSkipAuthCheck()) {
            return authStateRef.current;
        }

        if (authCheckInProgressRef.current) {
            return authStateRef.current;
        }

        authCheckInProgressRef.current = true;
        lastAuthCheckRef.current = now;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await api.get('/api/auth/user-login/profile', {
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            let newAuthState: { isAuthenticated: boolean; userId: string | null };

            if (response.data?.user?.id || response.data?.id) {
                const userId = response.data.user?.id || response.data.id;
                newAuthState = {
                    isAuthenticated: true,
                    userId
                };
            } else {
                newAuthState = {
                    isAuthenticated: false,
                    userId: null
                };
            }

            if (authStateRef.current.isAuthenticated !== newAuthState.isAuthenticated ||
                authStateRef.current.userId !== newAuthState.userId) {
                authStateRef.current = newAuthState;
                setAuthState(newAuthState);
            }

            return newAuthState;

        } catch (error: unknown) {
            if (error instanceof Error && error.name === 'AbortError') {
                return authStateRef.current;
            }

            const newAuthState = {
                isAuthenticated: false,
                userId: null
            };

            if (authStateRef.current.isAuthenticated !== newAuthState.isAuthenticated) {
                authStateRef.current = newAuthState;
                setAuthState(newAuthState);
            }

            return newAuthState;

        } finally {
            authCheckInProgressRef.current = false;
        }
    }, []);

    // Disconnect socket
    const disconnectSocket = useCallback((): void => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        if (authCheckDebounceRef.current) {
            clearTimeout(authCheckDebounceRef.current);
            authCheckDebounceRef.current = null;
        }
        if (connectDebounceRef.current) {
            clearTimeout(connectDebounceRef.current);
            connectDebounceRef.current = null;
        }

        isConnectingRef.current = false;
        hasConnectedRef.current = false;
        connectionAttemptRef.current = 0;

        if (socketRef.current) {
            socketRef.current.removeAllListeners();
            socketRef.current.disconnect();
            socketRef.current = null;
            setSocket(null);
        }

        setIsConnected(false);
    }, []);

    // Connect socket
    const connectSocket = useCallback(async (): Promise<void> => {
        const now = Date.now();
        const timeSinceLastAttempt = now - lastConnectAttemptRef.current;

        if (timeSinceLastAttempt < 3000) {
            return;
        }

        if (connectDebounceRef.current) {
            clearTimeout(connectDebounceRef.current);
            connectDebounceRef.current = null;
        }

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (isConnectingRef.current || socketRef.current?.connected) {
            return;
        }

        connectionAttemptRef.current++;
        if (connectionAttemptRef.current > 5) {
            setTimeout(() => {
                connectionAttemptRef.current = 0;
            }, 30000);
            return;
        }

        const currentAuth = authStateRef.current;
        if (!currentAuth.isAuthenticated || !currentAuth.userId) {
            return;
        }

        lastConnectAttemptRef.current = now;

        if (socketRef.current) {
            socketRef.current.removeAllListeners();
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        isConnectingRef.current = true;

        try {
            const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

            const socketInstance = io(socketUrl, {
                transports: ["websocket", "polling"],
                autoConnect: true,
                reconnection: true,
                reconnectionAttempts: 3,
                reconnectionDelay: 3000,
                reconnectionDelayMax: 10000,
                timeout: 10000,
                query: {
                    userId: currentAuth.userId,
                    timestamp: Date.now().toString(),
                },
            });

            socketInstance.on('connect', () => {
                console.log('✅ [Socket] CONNECTED! ID:', socketInstance.id);
                setIsConnected(true);
                isConnectingRef.current = false;
                hasConnectedRef.current = true;
                connectionAttemptRef.current = 0;

                if (mountRef.current) {
                    setTimeout(() => {
                        if (mountRef.current && socketInstance.connected) {
                            socketInstance.emit('session:get-latest');
                        }
                    }, 1000);
                }
            });

            socketInstance.on('disconnect', (reason: string) => {
                console.log('🔴 [Socket] DISCONNECTED:', reason);
                setIsConnected(false);
                isConnectingRef.current = false;

                const shouldReconnect = reason === 'transport close' ||
                    reason === 'ping timeout' ||
                    reason === 'transport error';

                if (mountRef.current &&
                    authStateRef.current.isAuthenticated &&
                    shouldReconnect &&
                    connectionAttemptRef.current < 5) {

                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectTimeoutRef.current = null;
                        if (mountRef.current && authStateRef.current.isAuthenticated) {
                            functionsRef.current?.connectSocket();
                        }
                    }, 5000);
                }
            });

            socketInstance.on('connect_error', (error: Error) => {
                console.error('❌ [Socket] CONNECT ERROR:', error.message);
                setIsConnected(false);
                isConnectingRef.current = false;
            });

            socketInstance.on('session:updated', (data: SocketEventMap['session:updated']) => {
                setSessions(data.sessions);
            });

            socketInstance.on('session:revoked', (data: SocketEventMap['session:revoked']) => {
                if (data.sessionId === socketInstance.id) {
                    functionsRef.current?.checkAuthState();
                }
            });

            socketRef.current = socketInstance;
            setSocket(socketInstance);

        } catch (error) {
            console.error('❌ [Socket] ERROR:', error);
            isConnectingRef.current = false;
            setIsConnected(false);
        }
    }, []);

    // 🔥 Store functions in ref
    functionsRef.current = {
        checkAuthState,
        connectSocket,
        disconnectSocket
    };

    const revokeSession = useCallback(async (sessionId: string): Promise<void> => {
        try {
            await api.post('/api/user/sessions/revoke', { sessionId });
            if (socketRef.current?.connected) {
                socketRef.current.emit('session:revoke', { sessionId });
            }
        } catch (error) {
            console.error('[Socket] Error revoking session:', error);
            throw error;
        }
    }, []);

    const updateSessions = useCallback((newSessions: SessionData[]): void => {
        setSessions(newSessions);
    }, []);

    const sendEvent = useCallback(<K extends keyof EmitEventMap>(
        event: K,
        data?: EmitEventMap[K]
    ): void => {
        if (socketRef.current?.connected) {
            socketRef.current.emit(event, data);
        }
    }, []);

    // 🔥 Initialize - NO WARNING
    useEffect(() => {
        mountRef.current = true;

        const initialize = async () => {
            await new Promise(resolve => setTimeout(resolve, 500));

            if (!mountRef.current) return;

            const authResult = await functionsRef.current?.checkAuthState();

            if (authResult?.isAuthenticated && mountRef.current) {
                connectDebounceRef.current = setTimeout(() => {
                    if (mountRef.current &&
                        authStateRef.current.isAuthenticated &&
                        !hasConnectedRef.current) {
                        functionsRef.current?.connectSocket();
                    }
                }, 1000);
            }
        };

        initialize();

        return () => {
            mountRef.current = false;
            functionsRef.current?.disconnectSocket();
        };
    }, []); // ✅ NO WARNING - uses functionsRef

    // 🔥 Auth state handler - NO WARNING
    useEffect(() => {
        const { isAuthenticated, userId } = authState;

        if (authCheckDebounceRef.current) {
            clearTimeout(authCheckDebounceRef.current);
        }

        authCheckDebounceRef.current = setTimeout(() => {
            if (!isAuthenticated && (socketRef.current?.connected || isConnectingRef.current)) {
                functionsRef.current?.disconnectSocket();
            } else if (isAuthenticated && userId && !hasConnectedRef.current && !isConnectingRef.current) {
                functionsRef.current?.connectSocket();
            }
        }, 500);

        return () => {
            if (authCheckDebounceRef.current) {
                clearTimeout(authCheckDebounceRef.current);
            }
        };
    }, [authState]); // ✅ NO WARNING

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

export const useSocketEvent = <K extends keyof SocketEventMap>(
    event: K,
    callback: (data: SocketEventMap[K]) => void
): void => {
    const { socket } = useSocket();
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        if (!socket) return;

        const handler = (data: SocketEventMap[K]) => callbackRef.current(data);
        socket.on(event, handler);

        return () => {
            socket.off(event, handler);
        };
    }, [socket, event]);
};

export const useSessionUpdates = (): {
    sessions: SessionData[];
    updateSessions: (sessions: SessionData[]) => void
} => {
    const { sessions, updateSessions } = useSocket();
    return { sessions, updateSessions };
};