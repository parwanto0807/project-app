// page.tsx - FIXED VERSION WITH PROPER ERROR HANDLING
"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { SuperLayout } from "@/components/admin-panel/super-layout";
import { LayoutProps } from "@/types/layout";
import { getAllSessions } from "@/lib/action/session/session";
import SessionListTable, { Session } from "@/components/session/tableData";
// import { SocketProvider } from "@/contexts/SocketContext";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Define proper types
interface ApiSession {
    id: string;
    userId: string;
    userAgent: string;
    ipAddress: string;
    isRevoked: boolean;
    createdAt: string;
    expiresAt: string;
    fcmToken: string | null;
    lastActiveAt: string;
    user?: {
        name: string;
        email: string;
    };
}

interface ApiResponse {
    success: boolean;
    data?: ApiSession[];
    message?: string;
    sessions?: ApiSession[];
    error?: string;
    items?: string;
}

interface CustomSessionsEvent extends Event {
    detail: ApiSession[];
}

// Helper functions
const formatSession = (session: ApiSession): Session => ({
    id: session.id || '',
    userAgent: session.userAgent || '',
    ipAddress: session.ipAddress || '',
    isRevoked: session.isRevoked || false,
    createdAt: session.createdAt || new Date().toISOString(),
    lastActiveAt: session.lastActiveAt || new Date().toISOString(),
    expiresAt: session.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    fcmToken: session.fcmToken || null,
    user: session.user || {
        name: 'Unknown User',
        email: 'unknown@example.com'
    }
});

const sortSessions = (sessions: Session[]): Session[] => {
    return [...sessions].sort((a, b) => {
        if (a.isRevoked !== b.isRevoked) {
            return a.isRevoked ? 1 : -1;
        }

        const dateA = new Date(a.lastActiveAt || a.createdAt).getTime();
        const dateB = new Date(b.lastActiveAt || b.createdAt).getTime();

        if (dateA !== dateB) {
            return dateB - dateA;
        }

        const createA = new Date(a.createdAt).getTime();
        const createB = new Date(b.createdAt).getTime();

        if (createA !== createB) {
            return createB - createA;
        }

        const nameA = a.user?.name || '';
        const nameB = b.user?.name || '';

        if (nameA && nameB) {
            return nameA.localeCompare(nameB);
        }

        return 0;
    });
};

// Helper untuk extract sessions dari berbagai format response
const extractSessionsFromResponse = (result: ApiResponse): ApiSession[] => {
    console.log('[Extract] Raw result:', result);

    // Jika sudah array langsung return
    if (Array.isArray(result)) {
        console.log('[Extract] Result is already array');
        return result;
    }

    // Jika result adalah object dengan property data
    if (result && typeof result === 'object') {
        // Coba berbagai kemungkinan property
        if (Array.isArray(result.data)) {
            console.log('[Extract] Found sessions in result.data');
            return result.data;
        }

        if (Array.isArray(result.sessions)) {
            console.log('[Extract] Found sessions in result.sessions');
            return result.sessions;
        }

        if (Array.isArray(result.items)) {
            console.log('[Extract] Found sessions in result.items');
            return result.items;
        }

        // Jika ada success property (standard API response)
        if (result.success && Array.isArray(result.data)) {
            console.log('[Extract] Found sessions in result.data (success response)');
            return result.data;
        }

        // Jika response adalah error
        if (result.error || result.message) {
            console.error('[Extract] API returned error:', result);
            throw new Error(result.message || result.error || 'API error');
        }
    }

    // Jika tidak ada format yang cocok, log warning dan return empty array
    console.warn('[Extract] Unexpected response format, returning empty array:', result);
    return [];
};

export default function SessionPage() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();
    const userRole = "super";
    const hasInitializedRef = useRef(false);
    const isProcessingRef = useRef(false);

    const sessionUpdateCountRef = useRef(0);
    const sessionsRef = useRef<Session[]>([]);

    useEffect(() => {
        sessionsRef.current = sessions;
    }, [sessions]);

    const sortedSessions = useMemo(() => {
        console.log('[Page] Sorting sessions:', sessions.length);
        return sortSessions(sessions);
    }, [sessions]);

    // Fetch data dengan handling berbagai format response
    const fetchData = useCallback(async (isManualRefresh: boolean = false) => {
        if (typeof window === "undefined") return;
        if (isProcessingRef.current && !isManualRefresh) return;

        isProcessingRef.current = true;
        setIsLoading(true);
        setError(null);

        try {
            console.log('[Page] 📥 Fetching sessions...', {
                manual: isManualRefresh,
                currentCount: sessionsRef.current.length
            });

            const result = await getAllSessions();
            console.log('[Page] Raw API result:', {
                type: typeof result,
                isArray: Array.isArray(result),
                keys: result && typeof result === 'object' ? Object.keys(result) : 'N/A'
            });

            // Extract sessions dari berbagai format response
            const extractedSessions = extractSessionsFromResponse(result);

            console.log('[Page] Extracted sessions:', {
                count: extractedSessions.length,
                sample: extractedSessions[0]
            });

            const formattedSessions: Session[] = extractedSessions.map(formatSession);

            // Jika tidak ada data, tampilkan warning
            if (formattedSessions.length === 0) {
                console.warn('[Page] No sessions found in response');
                toast.warning('No sessions found', {
                    description: 'The server returned an empty list',
                    duration: 3000,
                });
            }

            const finalSessions = sortSessions(formattedSessions);

            setSessions(finalSessions);
            setLastFetchTime(new Date());
            setIsLoading(false);
            setError(null);

            // Debug storage
            localStorage.setItem('lastManualFetch', JSON.stringify({
                count: finalSessions.length,
                time: new Date().toISOString(),
                rawResultType: typeof result,
                extractedCount: extractedSessions.length
            }));

            if (isManualRefresh) {
                toast.success(`Refreshed: ${finalSessions.length} sessions`);
            }

        } catch (err) {
            console.error("[Page] ❌ Fetch failed:", err);

            const errorMessage = err instanceof Error
                ? err.message
                : 'Failed to load sessions';

            setError(errorMessage);

            toast.error("Failed to load sessions", {
                description: errorMessage,
                duration: 5000,
            });

            // Fallback: Jika ada data sebelumnya, pertahankan
            if (sessionsRef.current.length > 0) {
                console.log('[Page] Using cached data due to error');
                toast.info('Using cached data', {
                    description: 'Showing previously loaded sessions',
                    duration: 3000,
                });
            }

            setIsLoading(false);
        } finally {
            isProcessingRef.current = false;
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
            console.log('[Page] Initializing...');
            fetchData();
        }
    }, [router, userRole, fetchData]);

    // Real-time handler
    useEffect(() => {
        console.log('[PAGE] Setting up real-time listener');

        const handleSessionsUpdated = (event: Event) => {
            const updateId = ++sessionUpdateCountRef.current;
            console.log(`[PAGE] Real-time event #${updateId}`);

            const customEvent = event as CustomSessionsEvent;
            const serverSessions = customEvent.detail;

            if (!Array.isArray(serverSessions)) {
                console.error('[PAGE] Invalid real-time data:', serverSessions);
                return;
            }

            const formattedSessions: Session[] = serverSessions.map(formatSession);
            const sortedServerSessions = sortSessions(formattedSessions);

            console.log('[PAGE] Applying real-time update:', {
                updateId,
                from: sessionsRef.current.length,
                to: sortedServerSessions.length
            });

            setSessions(sortedServerSessions);
            setIsLoading(false);

            toast.success('Real-time Update', {
                description: `${sortedServerSessions.length} sessions updated`,
                duration: 2000,
            });
        };

        window.addEventListener('sessions:updated', handleSessionsUpdated);
        console.log('[PAGE] Event listener registered');

        return () => {
            window.removeEventListener('sessions:updated', handleSessionsUpdated);
        };
    }, []);

    const handleRefresh = useCallback(() => {
        console.log('[Page] Manual refresh');
        fetchData(true);
    }, [fetchData]);

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
                        {error && (
                            <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
                                <div className="flex items-center gap-2 text-destructive">
                                    <AlertCircle className="h-5 w-5" />
                                    <h3 className="font-semibold">Error Loading Sessions</h3>
                                </div>
                                <p className="text-sm mt-1">{error}</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-2"
                                    onClick={() => fetchData(true)}
                                >
                                    Try Again
                                </Button>
                            </div>
                        )}

                        {/* <SocketProvider> */}
                        <SessionListTable
                            sessions={sortedSessions}
                            isLoading={isLoading}
                            onRefresh={handleRefresh}
                            lastUpdated={lastFetchTime}
                            error={error}
                        />
                        {/* </SocketProvider> */}
                    </div>
                </div>
            </>
        ),
    };

    return <SuperLayout {...layoutProps} />;
}