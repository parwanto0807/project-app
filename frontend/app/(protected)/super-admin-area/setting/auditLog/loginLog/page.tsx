// page.tsx - COMPLETE FIXED VERSION
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { SuperLayout } from "@/components/admin-panel/super-layout";
import { LayoutProps } from "@/types/layout";
import { getAllSessions } from "@/lib/action/session/session";
import SessionListTable, { Session } from "@/components/session/tableData";
import { SocketProvider } from "@/contexts/SocketContext";
import { toast } from "sonner";
import { RefreshCw, Shield, Bell, Zap, AlertCircle } from "lucide-react";

// Define proper types for session data from API
interface ApiSession {
  id: string;
  userId: string;
  userAgent: string;
  ipAddress: string;
  isRevoked: boolean;
  createdAt: string;
  expiresAt: string;
  fcmToken: string | null;
  user?: {
    name: string;
    email: string;
  };
}

interface CustomSessionsEvent extends Event {
  detail: ApiSession[];
}

export default function SessionPage() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [newUpdatesCount, setNewUpdatesCount] = useState(0);
    const [realTimeStatus, setRealTimeStatus] = useState<'idle' | 'connected' | 'updating'>('idle');
    
    const router = useRouter();
    const userRole = "super";
    const hasInitializedRef = useRef(false);
    
    // Refs untuk debugging
    const sessionUpdateCountRef = useRef(0);
    const sessionsRef = useRef<Session[]>([]);
    const lastServerUpdateRef = useRef<Session[]>([]);

    // Sync ref dengan state
    useEffect(() => {
        sessionsRef.current = sessions;
    }, [sessions]);

    // Fetch data function - PERBAIKAN: Tambah logging
    const fetchData = useCallback(async () => {
        if (typeof window === "undefined") return;

        try {
            setIsRefreshing(true);
            console.log('[Page] 📥 Fetching sessions via API...');
            
            const result = await getAllSessions();
            console.log('[Page] API Response:', {
                isArray: Array.isArray(result),
                length: Array.isArray(result) ? result.length : 'N/A',
                sample: Array.isArray(result) ? result[0] : result
            });
            
            const formattedSessions: Session[] = Array.isArray(result) 
                ? result.map((item: ApiSession) => ({
                    id: item.id || '',
                    userId: item.userId || '',
                    userAgent: item.userAgent || '',
                    ipAddress: item.ipAddress || '',
                    isRevoked: item.isRevoked || false,
                    createdAt: item.createdAt || new Date().toISOString(),
                    expiresAt: item.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                    fcmToken: item.fcmToken || null,
                    user: item.user || {
                        name: 'Unknown User',
                        email: 'unknown@example.com'
                    }
                }))
                : [];
            
            console.log('[Page] ✅ Formatted sessions:', formattedSessions.length);
            
            setSessions(formattedSessions);
            setLastUpdate(new Date());
            setNewUpdatesCount(0);
            
            // Debug: Simpan ke localStorage
            localStorage.setItem('lastManualFetch', JSON.stringify({
                count: formattedSessions.length,
                time: new Date().toISOString(),
                firstId: formattedSessions[0]?.id
            }));
            
            toast.success(`${formattedSessions.length} sessions loaded`);
            
        } catch (err) {
            console.error("[Page] ❌ Failed to fetch sessions:", err);
            toast.error("Failed to load sessions");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        if (userRole !== "super") {
            router.push("/unauthorized");
            return;
        }

        if (!hasInitializedRef.current) {
            hasInitializedRef.current = true;
            console.log('[Page] 🚀 Initial fetch');
            fetchData();
        }
    }, [router, userRole, fetchData]);

    // ✅ CRITICAL FIX: Real-time handler yang benar
    useEffect(() => {
        console.log('🎯 [PAGE] Setting up REAL-TIME event listener');
        
        const handleSessionsUpdated = (event: Event) => {
            const updateId = ++sessionUpdateCountRef.current;
            console.log(`📡 [PAGE] REAL-TIME EVENT #${updateId}`);
            
            setRealTimeStatus('updating');
            
            const customEvent = event as CustomSessionsEvent;
            const serverSessions = customEvent.detail;
            
            console.log('📡 [PAGE] Server data:', {
                hasDetail: !!serverSessions,
                isArray: Array.isArray(serverSessions),
                serverCount: serverSessions?.length || 0,
                clientCount: sessionsRef.current.length,
                timestamp: new Date().toISOString(),
                sampleSession: serverSessions?.[0]
            });
            
            if (!Array.isArray(serverSessions)) {
                console.error('📡 [PAGE] Server data is not an array:', serverSessions);
                setRealTimeStatus('connected');
                return;
            }
            
            // Simpan data server untuk debugging
            lastServerUpdateRef.current = serverSessions;
            localStorage.setItem('lastServerUpdate', JSON.stringify({
                count: serverSessions.length,
                time: new Date().toISOString(),
                data: serverSessions.slice(0, 3)
            }));
            
            // ✅ STRATEGI: REPLACE ALL (untuk admin)
            // Karena server sudah mengirim semua sessions yang perlu ditampilkan
            const formattedSessions: Session[] = serverSessions.map((session: ApiSession) => ({
                id: session.id || '',
                userId: session.userId || '',
                userAgent: session.userAgent || '',
                ipAddress: session.ipAddress || '',
                isRevoked: session.isRevoked || false,
                createdAt: session.createdAt || new Date().toISOString(),
                expiresAt: session.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                fcmToken: session.fcmToken || null,
                user: session.user || {
                    name: 'Unknown User',
                    email: 'unknown@example.com'
                }
            }));
            
            console.log('🔄 [PAGE] Updating client sessions:', {
                from: sessionsRef.current.length,
                to: formattedSessions.length,
                strategy: 'REPLACE_ALL'
            });
            
            // ✅ UPDATE STATE - GANTI SEMUA
            setSessions(formattedSessions);
            
            // Update timestamp
            const now = new Date();
            setLastUpdate(now);
            setNewUpdatesCount(prev => prev + 1);
            
            // Show success toast
            toast.success('Real-time Update', {
                description: `${formattedSessions.length} sessions updated`,
                duration: 3000,
                icon: <Zap className="h-4 w-4" />
            });
            
            setRealTimeStatus('connected');
            
            // Debug log
            setTimeout(() => {
                console.log('✅ [PAGE] State updated:', {
                    sessionsCount: formattedSessions.length,
                    active: formattedSessions.filter(s => !s.isRevoked).length,
                    updateTime: now.toLocaleTimeString()
                });
            }, 100);
        };
        
        // Add event listener
        window.addEventListener('sessions:updated', handleSessionsUpdated);
        console.log('✅ [PAGE] Event listener registered');
        
        // Cleanup
        return () => {
            console.log('🧹 [PAGE] Removing event listener');
            window.removeEventListener('sessions:updated', handleSessionsUpdated);
        };
    }, []); // Empty dependency array - setup sekali saja

    // ✅ DEBUG: Log state changes
    useEffect(() => {
        console.log('📊 [PAGE] Sessions state changed:', {
            count: sessions.length,
            active: sessions.filter(s => !s.isRevoked).length,
            updateTime: lastUpdate.toLocaleTimeString()
        });
        
        // Update ref
        sessionsRef.current = sessions;
    }, [sessions, lastUpdate]);

    // ✅ DEBUG: Manual test function
    const triggerTestUpdate = useCallback(() => {
        console.log('🧪 [PAGE] Triggering manual test update...');
        
        const testSessions = [
            {
                id: 'test-' + Date.now(),
                userId: 'test-user-123',
                userAgent: 'Test Browser/1.0',
                ipAddress: '192.168.1.100',
                isRevoked: false,
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 3600000).toISOString(),
                fcmToken: null,
                user: { 
                    name: 'Test User', 
                    email: 'test@example.com' 
                }
            }
        ];
        
        const event = new CustomEvent('sessions:updated', {
            detail: testSessions
        });
        
        window.dispatchEvent(event);
        
        toast.info('Test update triggered');
    }, []);

    // ✅ DEBUG: Compare data function
    const compareData = useCallback(() => {
        console.log('🔍 [PAGE] DATA COMPARISON:');
        console.log('- Manual fetch:', JSON.parse(localStorage.getItem('lastManualFetch') || '{}'));
        console.log('- Server update:', JSON.parse(localStorage.getItem('lastServerUpdate') || '{}'));
        console.log('- Current state:', sessions.length, 'sessions');
        console.log('- Server sent:', lastServerUpdateRef.current.length, 'sessions');
        
        if (lastServerUpdateRef.current.length > 0 && sessions.length > 0) {
            const serverIds = lastServerUpdateRef.current.map(s => s.id);
            const clientIds = sessions.map(s => s.id);
            const missingInClient = serverIds.filter(id => !clientIds.includes(id));
            const extraInClient = clientIds.filter(id => !serverIds.includes(id));
            
            console.log('📊 Comparison results:');
            console.log('  - Missing in client:', missingInClient.length);
            console.log('  - Extra in client:', extraInClient.length);
            
            if (missingInClient.length > 0) {
                console.log('  - Missing IDs:', missingInClient.slice(0, 5));
            }
        }
    }, [sessions]);

    // Format time
    const formatTime = (date: Date): string => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    // Filter active sessions
    const activeSessionsCount = sessions.filter(s => !s.isRevoked).length;

    const layoutProps: LayoutProps = {
        title: "Session Management",
        role: "super",
        children: (
            <>
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Badge variant="outline">
                                    <Link href="/super-admin-area">Dashboard</Link>
                                </Badge>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <Badge variant="outline">
                                <BreadcrumbPage>Security</BreadcrumbPage>
                            </Badge>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <Badge variant="outline">
                                <BreadcrumbPage>Session Management</BreadcrumbPage>
                            </Badge>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                {/* Header dengan live updates indicator */}
                <div className="flex items-center justify-between mb-4 mt-2">
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-500" />
                        <h2 className="text-lg font-semibold">Active Login Sessions</h2>
                        <Badge variant="secondary" className="ml-2">
                            {activeSessionsCount} Active
                        </Badge>
                        
                        {/* Live update indicator */}
                        <div className="flex items-center gap-2 ml-4">
                            <div className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${
                                    realTimeStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                                    realTimeStatus === 'updating' ? 'bg-yellow-500 animate-pulse' :
                                    'bg-gray-400'
                                }`} />
                                <span className="text-xs">
                                    {realTimeStatus === 'connected' ? 'Live' :
                                     realTimeStatus === 'updating' ? 'Updating...' :
                                     'Idle'}
                                </span>
                            </div>
                            {newUpdatesCount > 0 && (
                                <Badge variant="default" className="animate-pulse">
                                    <Bell className="h-3 w-3 mr-1" />
                                    {newUpdatesCount} New
                                </Badge>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {/* Last update time */}
                        <div className="text-xs text-gray-500 mr-2">
                            Updated: {formatTime(lastUpdate)}
                        </div>
                        
                        {/* Debug buttons - hanya development */}
                        {process.env.NODE_ENV === 'development' && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={compareData}
                                    className="mr-1"
                                >
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Debug
                                </Button>
                                
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={triggerTestUpdate}
                                    className="mr-1"
                                >
                                    <Zap className="h-3 w-3 mr-1" />
                                    Test
                                </Button>
                            </>
                        )}
                        
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchData}
                            disabled={isRefreshing}
                        >
                            <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                            {isRefreshing ? 'Refreshing...' : 'Refresh'}
                        </Button>
                    </div>
                </div>

                <div className="h-full w-full">
                    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
                        <SocketProvider>
                            <SessionListTable 
                                sessions={sessions} 
                                isLoading={isLoading} 
                                onRefresh={fetchData}
                                lastUpdateTime={formatTime(lastUpdate)}
                            />
                        </SocketProvider>
                    </div>
                </div>
            </>
        ),
    };

    return <SuperLayout {...layoutProps} />;
}