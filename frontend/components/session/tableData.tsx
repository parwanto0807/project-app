"use client";

import { useState } from "react";
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
  ArrowLeft,
  MapPin,
  Info,
  Wifi,
  WifiOff,
  AlertCircle,
  RefreshCw,
  Shield,
  Clock,
  Zap,
  Bell
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
  lastUpdateTime?: string;
}

type ViewMode = 'list' | 'detail';

export default function SessionListTable({
  sessions,
  isLoading,
  onRefresh,
  onRevokeSession,
  lastUpdateTime,
}: SessionListTableProps) {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [loadingRevokeId, setLoadingRevokeId] = useState<string | null>(null);

  const {
    isConnected,
    revokeSession: socketRevokeSession,
    sendEvent
  } = useSocket();

  const itemsPerPage = 20;
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  // Hapus useEffect yang tidak diperlukan
  // Deteksi ukuran layar sudah ditangani dengan CSS responsive (md:hidden, hidden md:block)

  // Handle revoke session
  const handleRevoke = async (id: string) => {
    setLoadingRevokeId(id);
    try {
      if (onRevokeSession) {
        await onRevokeSession(id);
      } else {
        await socketRevokeSession(id);
      }
      toast.success('Session revoked successfully');

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

  const handleLogoutOtherDevices = () => {
    sendEvent('session:logout-other');
    toast.info('Logging out from other devices...');
  };

  const handlePing = () => {
    sendEvent('ping');
    toast.info('Pinging server...');
  };

  // Pagination calculations
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

  // Format time duration since login
  const getTimeSince = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  // Check session and notification status
  const checkSessionStatus = (session: Session) => {
    const isSessionOn = !session.isRevoked;
    const isNotifOn = !!session.fcmToken;
    return { isSessionOn, isNotifOn };
  };

  // Helper function to get status labels
  const getStatusLabels = (session: Session) => {
    const { isSessionOn, isNotifOn } = checkSessionStatus(session);
    return {
      sessionLabel: isSessionOn ? "Active" : "Inactive",
      notifLabel: isNotifOn ? "Enabled" : "Disabled"
    };
  };

  // Enhanced Status Indicator Component
  const StatusIndicator = ({
    isActive,
    label,
    type = "session",
    size = "medium"
  }: {
    isActive: boolean;
    label: string;
    type?: "session" | "notification";
    size?: "small" | "medium" | "large";
  }) => {
    const sizeClasses = {
      small: "w-2 h-2",
      medium: "w-3 h-3",
      large: "w-4 h-4"
    };

    const iconSizeClasses = {
      small: "w-2.5 h-2.5",
      medium: "w-3.5 h-3.5",
      large: "w-4.5 h-4.5"
    };

    const animationDuration = type === "session" ? 1.4 : 1.5;

    return (
      <div className="flex items-center gap-1.5">
        <div className="relative">
          <motion.div
            className={`${sizeClasses[size]} rounded-full ${isActive ? "bg-green-500" : "bg-red-500"}`}
            animate={isActive ?
              {
                opacity: [0.6, 1, 0.6],
                scale: [1, 1.2, 1],
                boxShadow: isActive ? [
                  "0 0 0 0 rgba(34, 197, 94, 0)",
                  "0 0 0 4px rgba(34, 197, 94, 0.3)",
                  "0 0 0 0 rgba(34, 197, 94, 0)"
                ] : "none"
              } :
              { opacity: 1, scale: 1 }
            }
            transition={isActive ?
              {
                duration: animationDuration,
                repeat: Infinity,
                ease: "easeInOut"
              } :
              { duration: 0 }
            }
          />
          {isActive && (
            <motion.div
              className={`absolute inset-0 ${sizeClasses[size]} rounded-full ${isActive ? "bg-green-500" : "bg-red-500"}`}
              animate={{ scale: [1, 1.8], opacity: [0.7, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </div>
        <span className={`text-xs font-medium ${isActive ? "text-green-600" : "text-red-600"}`}>
          {label}
        </span>
        {type === "notification" && (
          <Bell className={`${iconSizeClasses[size]} ${isActive ? "text-green-500" : "text-red-400"}`} />
        )}
        {type === "session" && (
          <Zap className={`${iconSizeClasses[size]} ${isActive ? "text-green-500" : "text-red-400"}`} />
        )}
      </div>
    );
  };

  // Detail View Component
  const SessionDetailView = ({ session }: { session: Session }) => {
    const { isSessionOn, isNotifOn } = checkSessionStatus(session);
    const isRevoking = loadingRevokeId === session.id;
    const timeSinceLogin = getTimeSince(session.createdAt);

    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToList}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 h-9 px-3"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to List</span>
          </Button>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs px-2 py-1">
              <div className="flex items-center gap-1">
                <Info className="h-3 w-3" />
                Details
              </div>
            </Badge>
            <div className={`flex items-center gap-1 text-xs ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              {isConnected ? 'Live' : 'Offline'}
            </div>
          </div>
        </div>

        {/* Enhanced User Info */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 p-4 rounded-xl border border-blue-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-bold shadow-lg">
              {session.user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                {session.user?.name || 'Unknown User'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {session.user?.email}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 dark:text-gray-400">Active for</div>
              <div className="flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400">
                <Clock className="h-4 w-4" />
                {timeSinceLogin}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Status Indicators */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <Zap className="h-5 w-5 text-blue-500" />
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Session</span>
              </div>
              <Badge
                variant={isSessionOn ? "default" : "destructive"}
                className={`${isSessionOn ? 'bg-green-500 hover:bg-green-600' : ''}`}
              >
                {isSessionOn ? "Active" : "Inactive"}
              </Badge>
            </div>
            <StatusIndicator
              isActive={isSessionOn}
              label={isSessionOn ? "Live" : "Terminated"}
              type="session"
              size="large"
            />
          </div>

          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                  <Bell className="h-5 w-5 text-purple-500" />
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Notifications</span>
              </div>
              <Badge
                variant={isNotifOn ? "default" : "secondary"}
                className={`${isNotifOn ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-200 dark:bg-gray-800'}`}
              >
                {isNotifOn ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <StatusIndicator
              isActive={isNotifOn}
              label={isNotifOn ? "Receiving" : "Not Receiving"}
              type="notification"
              size="large"
            />
          </div>
        </div>

        {/* Enhanced Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <Monitor className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Device</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getDeviceIcon(session.userAgent)}</span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatDeviceInfo(session.userAgent)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {getBrowserInfo(session.userAgent)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Location</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-gray-400" />
              <Badge variant="outline" className="font-mono text-sm bg-blue-50 dark:bg-blue-950/30 h-6 px-2">
                {session.ipAddress}
              </Badge>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Login Time</span>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {new Date(session.createdAt).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-gray-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(session.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Duration</span>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                {timeSinceLogin}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Since login
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={handleBackToList}
            className="flex-1 h-10 text-sm font-medium"
          >
            Back to List
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleRevoke(session.id)}
            className="flex-1 h-10 text-sm font-medium flex items-center justify-center gap-2"
            disabled={session.isRevoked || isRevoking}
          >
            <LogOut className="h-4 w-4" />
            {session.isRevoked ? 'Already Revoked' : isRevoking ? 'Revoking...' : 'Revoke Session'}
          </Button>
        </div>
      </div>
    );
  };

  // Enhanced Mobile view component
  const MobileSessionCard = ({ session }: { session: Session }) => {
    const { isSessionOn, isNotifOn } = checkSessionStatus(session);
    const { sessionLabel, notifLabel } = getStatusLabels(session);
    const timeSinceLogin = getTimeSince(session.createdAt);

    return (
      <motion.div
        whileTap={{ scale: 0.98 }}
        className="mb-2"
      >
        <Card
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
          onClick={() => handleViewDetail(session)}
        >
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-medium flex-shrink-0">
                    {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  {/* Status dots on avatar */}
                  {/* <div className="absolute -bottom-1 -right-1 flex gap-0.5">
                    <motion.div
                      className={`w-2 h-2 rounded-full ${isSessionOn ? "bg-green-500" : "bg-red-500"}`}
                      animate={isSessionOn ? { opacity: [0.6, 1, 0.6] } : { opacity: 1 }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                    />
                    <motion.div
                      className={`w-2 h-2 rounded-full ${isNotifOn ? "bg-green-500" : "bg-red-500"}`}
                      animate={isNotifOn ? { opacity: [0.6, 1, 0.6] } : { opacity: 1 }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </div> */}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                      {session.user?.name || 'Unknown User'}
                    </p>
                    <Badge variant="outline" className="font-mono text-xs h-4 px-1.5">
                      {session.ipAddress}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <span className="flex items-center gap-1">
                      <span className="text-base">{getDeviceIcon(session.userAgent)}</span>
                      {formatDeviceInfo(session.userAgent)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(session.createdAt).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(session.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  {/* Enhanced Status Indicators */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="relative">
                        <motion.div
                          className={`w-2.5 h-2.5 rounded-full ${isSessionOn ? "bg-green-500" : "bg-red-500"}`}
                          animate={isSessionOn ?
                            { opacity: [0.6, 1, 0.6], scale: [1, 1.2, 1] } :
                            { opacity: 1 }
                          }
                          transition={{ duration: 1.4, repeat: Infinity }}
                        />
                        {isSessionOn && (
                          <motion.div
                            className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500"
                            animate={{ scale: [1, 2], opacity: [0.7, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                        )}
                      </div>
                      <span className={`text-xs font-medium ${isSessionOn ? "text-green-600" : "text-red-600"}`}>
                        {sessionLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="relative">
                        <motion.div
                          className={`w-2.5 h-2.5 rounded-full ${isNotifOn ? "bg-green-500" : "bg-red-500"}`}
                          animate={isNotifOn ?
                            { opacity: [0.6, 1, 0.6], scale: [1, 1.2, 1] } :
                            { opacity: 1 }
                          }
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                        {isNotifOn && (
                          <motion.div
                            className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500"
                            animate={{ scale: [1, 2], opacity: [0.7, 0] }}
                            transition={{ duration: 1.6, repeat: Infinity }}
                          />
                        )}
                      </div>
                      <span className={`text-xs font-medium ${isNotifOn ? "text-green-600" : "text-red-600"}`}>
                        {notifLabel}
                      </span>
                    </div>

                    <div className="ml-auto flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3" />
                      {timeSinceLogin}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetail(session);
                  }}
                >
                  <Info className="h-4 w-4" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={() => handleViewDetail(session)}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Info className="h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleRevoke(session.id)}
                      disabled={session.isRevoked || loadingRevokeId === session.id}
                      className="text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300 focus:bg-red-50 dark:focus:bg-red-950/50 flex items-center gap-2 text-sm"
                    >
                      <LogOut className="h-4 w-4" />
                      {session.isRevoked ? 'Revoked' : loadingRevokeId === session.id ? 'Revoking...' : 'Revoke Session'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // Desktop Table Row
  const DesktopTableRow = ({ session }: { session: Session }) => {
    const { isSessionOn, isNotifOn } = checkSessionStatus(session);
    const { sessionLabel, notifLabel } = getStatusLabels(session);
    const isRevoking = loadingRevokeId === session.id;
    const timeSinceLogin = getTimeSince(session.createdAt);

    return (
      <TableRow
        key={session.id}
        className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors duration-200 cursor-pointer h-14"
        onClick={() => handleViewDetail(session)}
      >
        <TableCell className="py-2">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-medium">
                {session.user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              {/* Status dots */}
              {/* <div className="absolute -bottom-1 -right-1 flex gap-0.5">
                <motion.div
                  className={`w-2 h-2 rounded-full ${isSessionOn ? "bg-green-500" : "bg-red-500"}`}
                  animate={isSessionOn ? { opacity: [0.6, 1, 0.6] } : { opacity: 1 }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
                <motion.div
                  className={`w-2 h-2 rounded-full ${isNotifOn ? "bg-green-500" : "bg-red-500"}`}
                  animate={isNotifOn ? { opacity: [0.6, 1, 0.6] } : { opacity: 1 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </div> */}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate max-w-[140px]">
                {session.user?.name || 'Unknown User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[140px]">
                {session.user?.email}
              </p>
            </div>
          </div>
        </TableCell>
        <TableCell className="py-2">
          <Badge variant="outline" className="font-mono text-xs bg-blue-50 dark:bg-blue-950/30 h-5 px-2">
            {session.ipAddress}
          </Badge>
        </TableCell>
        <TableCell className="py-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getDeviceIcon(session.userAgent)}</span>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {formatDeviceInfo(session.userAgent)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {getBrowserInfo(session.userAgent)}
              </p>
            </div>
          </div>
        </TableCell>
        <TableCell className="py-2">
          <div className="flex items-center gap-6">
            <StatusIndicator
              isActive={isSessionOn}
              label={sessionLabel}
              type="session"
              size="medium"
            />
            <StatusIndicator
              isActive={isNotifOn}
              label={notifLabel}
              type="notification"
              size="medium"
            />
          </div>
        </TableCell>
        <TableCell className="py-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-900 dark:text-gray-100 font-medium">
                {new Date(session.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {new Date(session.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <div className="mt-1">
              <Badge variant="outline" className="text-xs h-5 bg-gray-50 dark:bg-gray-800">
                {timeSinceLogin}
              </Badge>
            </div>
          </div>
        </TableCell>
        <TableCell className="py-2 text-right">
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetail(session);
              }}
              className="h-8 px-3 text-xs"
            >
              <Info className="h-3.5 w-3.5 mr-1" />
              Details
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => handleViewDetail(session)}
                  className="flex items-center gap-2 text-sm"
                >
                  <Info className="h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleRevoke(session.id)}
                  disabled={session.isRevoked || isRevoking}
                  className="text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300 focus:bg-red-50 dark:focus:bg-red-950/50 flex items-center gap-2 text-sm"
                >
                  <LogOut className="h-4 w-4" />
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
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-950/50 backdrop-blur-sm mx-auto max-w-lg w-full">
        <CardContent className="p-5">
          <SessionDetailView session={selectedSession} />
        </CardContent>
      </Card>
    );
  }

  // Render List View
  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-950/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-t-lg p-5 border-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-xl md:text-2xl font-bold text-white">
                Active Sessions
              </CardTitle>
              <Badge
                variant={isConnected ? "default" : "destructive"}
                className={`px-2 py-0.5 text-xs ${isConnected ? 'bg-green-500 hover:bg-green-600' : ''}`}
              >
                <div className="flex items-center gap-1">
                  {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  {isConnected ? 'Live' : 'Offline'}
                </div>
              </Badge>
            </div>
            <p className="text-blue-100 text-sm">
              Manage your active login sessions and devices
            </p>
            {lastUpdateTime && (
              <p className="text-blue-200 text-xs mt-1">
                Last updated: {new Date(lastUpdateTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="px-3 py-1.5 bg-white/20 text-white border-white/30 text-sm">
              <span className="font-bold">{sessions.filter(s => !s.isRevoked).length}</span> Active Sessions
            </Badge>

            <div className="flex items-center gap-1">
              {onRefresh && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 px-3 text-xs md:text-sm bg-white/10 border-white/30 text-white hover:bg-white/20"
                  onClick={onRefresh}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                className="h-9 px-3 text-xs md:text-sm bg-white/10 border-white/30 text-white hover:bg-white/20"
                onClick={handlePing}
                disabled={!isConnected}
              >
                Ping
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-9 px-3 text-xs md:text-sm bg-white/10 border-white/30 text-white hover:bg-white/20"
                onClick={handleLogoutOtherDevices}
                disabled={!isConnected || sessions.filter(s => !s.isRevoked).length <= 1}
              >
                <Shield className="h-4 w-4 mr-1" />
                Logout Others
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Connection Status Banner */}
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-yellow-400/10 to-orange-400/10 dark:from-yellow-900/20 dark:to-orange-900/20 border-b border-yellow-200 dark:border-yellow-800 p-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 10, 0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </motion.div>
                <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                  Disconnected from real-time updates
                </span>
              </div>
              {onRefresh && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-3 text-xs text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-800/30"
                  onClick={onRefresh}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry Connection
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/50 h-12">
                <TableHead className="w-[200px] py-3 pl-6">
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm font-semibold">
                    <User className="h-4 w-4" />
                    User Information
                  </div>
                </TableHead>
                <TableHead className="py-3">
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm font-semibold">
                    <Globe className="h-4 w-4" />
                    IP Address
                  </div>
                </TableHead>
                <TableHead className="py-3">
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm font-semibold">
                    <Monitor className="h-4 w-4" />
                    Device & Browser
                  </div>
                </TableHead>
                <TableHead className="py-3">
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm font-semibold">
                    Status Indicators
                  </div>
                </TableHead>
                <TableHead className="py-3">
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm font-semibold">
                    <Calendar className="h-4 w-4" />
                    Login Information
                  </div>
                </TableHead>
                <TableHead className="text-right py-3 pr-6 text-sm font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentSessions.map((session) => (
                <DesktopTableRow key={session.id} session={session} />
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View - Gunakan CSS responsive tanpa state JavaScript */}
        <div className="md:hidden p-3">
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Active Sessions ({currentSessions.length})
              </h3>
              {onRefresh && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs"
                  onClick={onRefresh}
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              )}
            </div>

            {currentSessions.length > 0 ? (
              currentSessions.map((session) => (
                <MobileSessionCard key={session.id} session={session} />
              ))
            ) : (
              <div className="text-center py-8 px-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 mb-4">
                  <Monitor className="h-8 w-8 text-blue-500 dark:text-blue-400" />
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm font-medium mb-1">No active sessions found</p>
                <p className="text-gray-500 dark:text-gray-500 text-xs">
                  {isConnected ? 'Start a new session to see it here' : 'Connect to server to view sessions'}
                </p>
                {!isConnected && onRefresh && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 text-xs"
                    onClick={onRefresh}
                  >
                    <Wifi className="h-3 w-3 mr-1" />
                    Connect Now
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {totalPages > 1 && viewMode === 'list' && (
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 rounded-b-lg">
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
      <CardHeader className="bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-t-lg p-5 border-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-7 w-40 bg-gray-300 dark:bg-gray-600" />
            <Skeleton className="h-3 w-48 bg-gray-300 dark:bg-gray-600" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-24 bg-gray-300 dark:bg-gray-600" />
            <Skeleton className="h-7 w-7 bg-gray-300 dark:bg-gray-600 rounded-md" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Desktop Skeleton */}
        <div className="hidden md:block p-4">
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-800 rounded-lg h-16">
                <div className="flex items-center gap-3 flex-1">
                  <Skeleton className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-800" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-3 w-28 bg-gray-200 dark:bg-gray-800" />
                    <Skeleton className="h-2.5 w-20 bg-gray-200 dark:bg-gray-800" />
                  </div>
                </div>
                <div className="flex-1">
                  <Skeleton className="h-4 w-20 bg-gray-200 dark:bg-gray-800" />
                </div>
                <div className="flex-1">
                  <Skeleton className="h-3.5 w-24 bg-gray-200 dark:bg-gray-800" />
                </div>
                <div className="flex-1">
                  <Skeleton className="h-3 w-16 bg-gray-200 dark:bg-gray-800" />
                </div>
                <Skeleton className="h-8 w-14 bg-gray-200 dark:bg-gray-800 rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Skeleton */}
        <div className="md:hidden p-3 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Skeleton className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-800" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-3 w-24 bg-gray-200 dark:bg-gray-800" />
                      <Skeleton className="h-2.5 w-16 bg-gray-200 dark:bg-gray-800" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-3 w-3 bg-gray-200 dark:bg-gray-800 rounded" />
                    <Skeleton className="h-3 w-3 bg-gray-200 dark:bg-gray-800 rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}