"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LogOut,
  Monitor,
  Globe,
  User,
  Calendar,
  MoreHorizontal,
  Smartphone,
  ArrowLeft,
  MapPin,
  Info,
  Wifi,
  WifiOff,
  AlertCircle,
  RefreshCw,
  Shield
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PaginationComponent from "@/components/ui/paginationNew";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useSocket } from '../../contexts/SocketContext';
import { toast } from "sonner";

// Types
export interface Session {
  id: string;
  user?: {
    name?: string;
    email?: string;
  };
  userAgent: string;
  ipAddress: string;
  isRevoked: boolean;
  createdAt: string;
  expiresAt: string;
  fcmToken?: string | null;
}

interface SessionListTableProps {
  sessions: Session[];
  isLoading: boolean;
  onRefresh?: () => void;
  onRevokeSession?: (sessionId: string) => Promise<void>;
  lastUpdateTime?: string; // ✅ Tambah ini
}

type ViewMode = 'list' | 'detail';

export default function SessionListTable({
  sessions,
  isLoading,
  onRefresh,
  onRevokeSession,
  lastUpdateTime,
}: SessionListTableProps) {
  // Hanya UI state, tidak ada data state!
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [loadingRevokeId, setLoadingRevokeId] = useState<string | null>(null);

  // Gunakan socket HANYA untuk status connection dan revoke (jika tidak ada callback)
  const {
    isConnected,
    revokeSession: socketRevokeSession,
    sendEvent
  } = useSocket();

  const itemsPerPage = 20;
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  // Tambah debug log untuk lihat kapan re-render
  useEffect(() => {
    console.log('📊 SessionListTable re-rendered with', sessions.length, 'sessions');
    console.log('🕐 Last update:', lastUpdateTime);
  }, [sessions, lastUpdateTime]);

  // Handle revoke session - gunakan callback dari parent jika ada, jika tidak gunakan socket
  const handleRevoke = async (id: string) => {
    setLoadingRevokeId(id);
    try {
      if (onRevokeSession) {
        // Gunakan callback dari parent
        await onRevokeSession(id);
      } else {
        // Fallback: gunakan socket
        await socketRevokeSession(id);
      }
      toast.success('Session revoked successfully');

      // Jika ada selected session yang direvoke, kembali ke list
      if (selectedSession?.id === id) {
        handleBackToList();
      }
    } catch (error) {
      console.error('Failed to revoke session:', error);
      toast.error('Failed to revoke session');
    } finally {
      setLoadingRevokeId(null);
    }
  };

  const handleViewDetail = (session: Session) => {
    setSelectedSession(session);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedSession(null);
  };

  // Handle logout other devices via socket
  const handleLogoutOtherDevices = () => {
    sendEvent('session:logout-other');
    toast.info('Logging out from other devices...');
  };

  // Send ping to server
  const handlePing = () => {
    sendEvent('ping');
    toast.info('Pinging server...');
  };

  // Pagination calculations - langsung dari prop sessions
  const totalPages = Math.ceil(sessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentSessions = sessions.slice(startIndex, startIndex + itemsPerPage);

  // UI Helper functions
  const formatDeviceInfo = (userAgent: string) => {
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'Mac';
    if (userAgent.includes('Linux')) return 'Linux';
    return 'Desktop';
  };

  const getBrowserInfo = (userAgent: string) => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Browser';
  };

  const getDeviceIcon = (userAgent: string) => {
    if (userAgent.includes('Mobile')) return '📱';
    if (userAgent.includes('Tablet')) return '📱';
    return '💻';
  };

  // Check session and notification status
  const checkSessionStatus = (session: Session) => {
    const isSessionOn = !session.isRevoked;
    let isNotifOn = false;

    if (session.isRevoked) {
      // Session revoked cases
      isNotifOn = !!session.fcmToken; // 🔴 OFF / 🟢 ON jika ada token
    } else {
      // Active session cases
      isNotifOn = !!session.fcmToken; // 🟢 ON / 🟢 ON jika ada token
    }

    return { isSessionOn, isNotifOn };
  };

  // Helper function to get status labels
  const getStatusLabels = (session: Session) => {
    const { isSessionOn, isNotifOn } = checkSessionStatus(session);
    return {
      sessionLabel: isSessionOn ? "ON" : "OFF",
      notifLabel: isNotifOn ? "ON" : "OFF"
    };
  };

  // Detail View Component
  const SessionDetailView = ({ session }: { session: Session }) => {
    const { isSessionOn, isNotifOn } = checkSessionStatus(session);
    const isRevoking = loadingRevokeId === session.id;

    return (
      <div className="space-y-3 animate-in fade-in duration-300">
        {/* Header with Connection Status */}
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToList}
            className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 h-8 px-2"
          >
            <ArrowLeft className="h-3 w-3" />
            Back
          </Button>
          <div className="flex items-center gap-2 ml-auto">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
              Session Details
            </Badge>
            <div className={`flex items-center gap-1 text-xs ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isConnected ? 'Live' : 'Offline'}
            </div>
          </div>
        </div>

        {/* Compact User Info */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-medium">
            {session.user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
              {session.user?.name || 'Unknown User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {session.user?.email}
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">Session Status</span>
            </div>
            <div className="flex items-center gap-1">
              <motion.div
                className={`w-2 h-2 rounded-full ${isSessionOn ? "bg-green-500" : "bg-red-500"}`}
                animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.25, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className={`text-xs font-medium ${isSessionOn ? "text-green-600" : "text-red-600"}`}>
                {isSessionOn ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <div className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">Notifications</span>
            </div>
            <div className="flex items-center gap-1">
              <motion.div
                className={`w-2 h-2 rounded-full ${isNotifOn ? "bg-green-500" : "bg-red-500"}`}
                animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.25, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className={`text-xs font-medium ${isNotifOn ? "text-green-600" : "text-red-600"}`}>
                {isNotifOn ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>
        </div>

        {/* Compact Info Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Device Info */}
          <div className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <Monitor className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Device</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm">{getDeviceIcon(session.userAgent)}</span>
              <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                {formatDeviceInfo(session.userAgent)}
              </span>
            </div>
          </div>

          {/* Browser Info */}
          <div className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <Smartphone className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Browser</span>
            </div>
            <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
              {getBrowserInfo(session.userAgent)}
            </span>
          </div>

          {/* IP Address */}
          <div className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <MapPin className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">IP Address</span>
            </div>
            <Badge variant="outline" className="font-mono text-xs bg-blue-50 dark:bg-blue-950/30 h-5">
              {session.ipAddress}
            </Badge>
          </div>

          {/* Login Time */}
          <div className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <Calendar className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Login</span>
            </div>
            <div className="text-xs">
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {new Date(session.createdAt).toLocaleDateString()}
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-xs">
                {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>

        {/* Compact Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={handleBackToList}
            className="flex-1 h-8 text-xs"
          >
            Back to List
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleRevoke(session.id)}
            className="flex-1 h-8 text-xs flex items-center gap-1"
            disabled={session.isRevoked || isRevoking}
          >
            <LogOut className="h-3 w-3" />
            {session.isRevoked ? 'Revoked' : isRevoking ? 'Revoking...' : 'Revoke'}
          </Button>
        </div>
      </div>
    );
  };

  // Mobile view component
  const MobileSessionCard = ({ session }: { session: Session }) => {
    const { isSessionOn, isNotifOn } = checkSessionStatus(session);

    return (
      <Card
        className="mb-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98] cursor-pointer"
        onClick={() => handleViewDetail(session)}
      >
        <CardContent className="p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-medium flex-shrink-0">
                {session.user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                  {session.user?.name || 'Unknown User'}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Badge variant="outline" className="text-xs font-mono h-4 px-1">
                    {session.ipAddress}
                  </Badge>
                  <span className="text-xs text-gray-400">{getDeviceIcon(session.userAgent)}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Info className="h-3 w-3 text-gray-400 flex-shrink-0" />
              <div className="flex gap-1">
                <motion.div
                  className={`w-1.5 h-1.5 rounded-full ${isSessionOn ? "bg-green-500" : "bg-red-500"}`}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
                <motion.div
                  className={`w-1.5 h-1.5 rounded-full ${isNotifOn ? "bg-green-500" : "bg-red-500"}`}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Desktop Table Row
  const DesktopTableRow = ({ session }: { session: Session }) => {
    const { isSessionOn, isNotifOn } = checkSessionStatus(session);
    const { sessionLabel, notifLabel } = getStatusLabels(session);
    const isRevoking = loadingRevokeId === session.id;

    return (
      <TableRow
        key={session.id}
        className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors duration-200 cursor-pointer h-12"
        onClick={() => handleViewDetail(session)}
      >
        <TableCell className="py-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-medium">
              {session.user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate max-w-[120px]">
                {session.user?.name || 'Unknown User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                {session.user?.email}
              </p>
            </div>
          </div>
        </TableCell>
        <TableCell className="py-1">
          <Badge variant="outline" className="font-mono text-xs bg-blue-50 dark:bg-blue-950/30 h-5">
            {session.ipAddress}
          </Badge>
        </TableCell>
        <TableCell className="py-1">
          <div className="flex items-center gap-1">
            <span className="text-sm">{getDeviceIcon(session.userAgent)}</span>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {formatDeviceInfo(session.userAgent)}
            </span>
          </div>
        </TableCell>
        <TableCell className="py-1">
          <div className="flex items-center gap-8">
            {/* Session Status */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">Session</span>
              <span className={`flex items-center gap-1 ${isSessionOn ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                <motion.div
                  className={`w-2 h-2 rounded-full ${isSessionOn ? "bg-green-500" : "bg-red-300"}`}
                  animate={isSessionOn ?
                    { opacity: [0.4, 1, 0.4], scale: [1, 1.25, 1] } :
                    { opacity: 1, scale: 1 }
                  }
                  transition={isSessionOn ?
                    { duration: 1.4, repeat: Infinity, ease: "easeInOut" } :
                    { duration: 0 }
                  }
                />
                {sessionLabel}
              </span>
            </div>

            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

            {/* Notification Status */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">Notif</span>
              <span className={`flex items-center gap-1 ${isNotifOn ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                <motion.div
                  className={`w-2 h-2 rounded-full ${isNotifOn ? "bg-green-500" : "bg-red-300"}`}
                  animate={isNotifOn ?
                    { opacity: [0.4, 1, 0.4], scale: [1, 1.25, 1] } :
                    { opacity: 1, scale: 1 }
                  }
                  transition={isNotifOn ?
                    { duration: 1.5, repeat: Infinity, ease: "easeInOut" } :
                    { duration: 0 }
                  }
                />
                {notifLabel}
              </span>
            </div>
          </div>
        </TableCell>
        <TableCell className="py-1">
          <div className="flex flex-col">
            <span className="text-xs text-gray-900 dark:text-gray-100 font-medium">
              {new Date(session.createdAt).toLocaleDateString()}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </TableCell>
        <TableCell className="py-1 text-right">
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetail(session);
              }}
              className="h-6 w-6 p-0"
            >
              <Info className="h-3 w-3" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={() => handleViewDetail(session)}
                  className="flex items-center gap-2 text-xs"
                >
                  <Info className="h-3 w-3" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleRevoke(session.id)}
                  disabled={session.isRevoked || isRevoking}
                  className="text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300 focus:bg-red-50 dark:focus:bg-red-950/50 flex items-center gap-2 text-xs"
                >
                  <LogOut className="h-3 w-3" />
                  {session.isRevoked ? 'Already Revoked' : isRevoking ? 'Revoking...' : 'Revoke Session'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  if (isLoading) return <SessionListSkeleton />;

  // Render Detail View
  if (viewMode === 'detail' && selectedSession) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-950/50 backdrop-blur-sm mx-auto max-w-md">
        <CardContent className="p-4">
          <SessionDetailView session={selectedSession} />
        </CardContent>
      </Card>
    );
  }

  // Render List View
  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-950/50 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-t-lg p-4 border-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-white mb-1">
              Active Sessions
            </CardTitle>
            <div className="flex items-center gap-2">
              <p className="text-blue-100 text-xs">
                Manage your active login sessions
              </p>
              {/* Connection Status Badge */}
              <Badge
                variant={isConnected ? "default" : "destructive"}
                className={`px-2 py-0.5 text-xs ${isConnected ? 'bg-green-500 hover:bg-green-600' : ''}`}
              >
                <div className="flex items-center gap-1">
                  {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  {isConnected ? 'Live Updates' : 'Offline'}
                </div>
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-2 py-1 bg-white/20 text-white border-white/30 text-xs">
              {sessions.filter(s => !s.isRevoked).length} Active
            </Badge>

            {/* Refresh Button */}
            {onRefresh && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs bg-white/10 border-white/30 text-white hover:bg-white/20"
                onClick={onRefresh}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
            )}

            {/* Action Buttons */}
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs bg-white/10 border-white/30 text-white hover:bg-white/20"
              onClick={handlePing}
              disabled={!isConnected}
            >
              Ping
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs bg-white/10 border-white/30 text-white hover:bg-white/20"
              onClick={handleLogoutOtherDevices}
              disabled={!isConnected || sessions.filter(s => !s.isRevoked).length <= 1}
            >
              <Shield className="h-3 w-3 mr-1" />
              Logout Others
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Connection Status Banner */}
        {!isConnected && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-xs text-yellow-700 dark:text-yellow-300">
                  Disconnected from real-time updates
                </span>
              </div>
              {onRefresh && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 px-2 text-xs text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-800/30"
                  onClick={onRefresh}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/50 h-10">
                <TableHead className="w-[200px] py-2">
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 text-xs">
                    <User className="h-3 w-3" />
                    User
                  </div>
                </TableHead>
                <TableHead className="py-2">
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 text-xs">
                    <Globe className="h-3 w-3" />
                    IP Address
                  </div>
                </TableHead>
                <TableHead className="py-2">
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 text-xs">
                    <Monitor className="h-3 w-3" />
                    Device
                  </div>
                </TableHead>
                <TableHead className="py-2">
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 text-xs">
                    Session & Notification Status
                  </div>
                </TableHead>
                <TableHead className="py-2">
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 text-xs">
                    <Calendar className="h-3 w-3" />
                    Login Time
                  </div>
                </TableHead>
                <TableHead className="text-right w-[80px] py-2 text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentSessions.map((session) => (
                <DesktopTableRow key={session.id} session={session} />
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden p-2">
          {currentSessions.map((session) => (
            <MobileSessionCard key={session.id} session={session} />
          ))}
        </div>

        {sessions.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-gray-500 mb-2">
              <Monitor className="h-12 w-12 mx-auto mb-2 opacity-40" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">No active sessions</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs">
              {isConnected ? 'Waiting for session data...' : 'Connect to server to see sessions'}
            </p>
            <div className="flex gap-2 justify-center mt-3">
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={onRefresh}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {totalPages > 1 && viewMode === 'list' && (
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 rounded-b-lg">
          <PaginationComponent totalPages={totalPages} />
        </div>
      )}
    </Card>
  );
}

// Skeleton Loader
function SessionListSkeleton() {
  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-950/50 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-t-lg p-4 border-0">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-6 w-32 bg-gray-300 dark:bg-gray-600" />
            <Skeleton className="h-3 w-40 bg-gray-300 dark:bg-gray-600" />
          </div>
          <Skeleton className="h-5 w-12 bg-gray-300 dark:bg-gray-600" />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Desktop Skeleton */}
        <div className="hidden md:block p-1">
          <div className="space-y-1 p-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-2 border border-gray-100 dark:border-gray-800 rounded h-12">
                <div className="flex items-center gap-2 flex-1">
                  <Skeleton className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-800" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-3 w-24 bg-gray-200 dark:bg-gray-800" />
                    <Skeleton className="h-2 w-20 bg-gray-200 dark:bg-gray-800" />
                  </div>
                </div>
                <div className="flex-1">
                  <Skeleton className="h-4 w-16 bg-gray-200 dark:bg-gray-800" />
                </div>
                <div className="flex-1">
                  <Skeleton className="h-3 w-20 bg-gray-200 dark:bg-gray-800" />
                </div>
                <div className="flex-1">
                  <Skeleton className="h-3 w-16 bg-gray-200 dark:bg-gray-800" />
                </div>
                <Skeleton className="h-6 w-12 bg-gray-200 dark:bg-gray-800 rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Skeleton */}
        <div className="md:hidden p-2 space-y-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <CardContent className="p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <Skeleton className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-800" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-3 w-20 bg-gray-200 dark:bg-gray-800" />
                      <Skeleton className="h-2 w-16 bg-gray-200 dark:bg-gray-800" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-3 bg-gray-200 dark:bg-gray-800 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}