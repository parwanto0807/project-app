// page.tsx - COMPLETE FIXED VERSION
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { SuperLayout } from "@/components/admin-panel/super-layout";
import { LayoutProps } from "@/types/layout";
import { getAllSessions } from "@/lib/action/session/session";
import SessionListTable, { Session } from "@/components/session/tableData";
import { SocketProvider } from "@/contexts/SocketContext";
import { toast } from "sonner";

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

    // Fetch data function
    const fetchData = useCallback(async () => {
        if (typeof window === "undefined") return;

        try {
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

    // Real-time handler
    useEffect(() => {
        console.log('🎯 [PAGE] Setting up REAL-TIME event listener');

        const handleSessionsUpdated = (event: Event) => {
            const updateId = ++sessionUpdateCountRef.current;
            console.log(`📡 [PAGE] REAL-TIME EVENT #${updateId}`);

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
                return;
            }

            // Simpan data server untuk debugging
            lastServerUpdateRef.current = serverSessions;
            localStorage.setItem('lastServerUpdate', JSON.stringify({
                count: serverSessions.length,
                time: new Date().toISOString(),
                data: serverSessions.slice(0, 3)
            }));

            // REPLACE ALL strategy
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

            // UPDATE STATE - GANTI SEMUA
            setSessions(formattedSessions);
            setIsLoading(false);

            // Show success toast
            toast.success('Real-time Update', {
                description: `${formattedSessions.length} sessions updated`,
                duration: 3000,
            });

            // Debug log
            setTimeout(() => {
                console.log('✅ [PAGE] State updated:', {
                    sessionsCount: formattedSessions.length,
                    active: formattedSessions.filter(s => !s.isRevoked).length,
                    updateTime: new Date().toLocaleTimeString()
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

    // DEBUG: Log state changes
    useEffect(() => {
        console.log('📊 [PAGE] Sessions state changed:', {
            count: sessions.length,
            active: sessions.filter(s => !s.isRevoked).length
        });

        // Update ref
        sessionsRef.current = sessions;
    }, [sessions]);

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

                <div className="h-full w-full mt-4">
                    <div className="flex-1 space-y-4">
                        <SocketProvider>
                            <SessionListTable
                                sessions={sessions}
                                isLoading={isLoading}
                                onRefresh={fetchData}
                            />
                        </SocketProvider>
                    </div>
                </div>
            </>
        ),
    };

    return <SuperLayout {...layoutProps} />;
}