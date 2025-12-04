"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
  Bell,
  Activity,
  Timer,
  Smartphone,
  Laptop,
  Tablet,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
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
import { cn } from "@/lib/utils";

// Types
export interface Session {
  id: string;
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
  userAgent: string;
  ipAddress: string;
  isRevoked: boolean;
  createdAt: string;
  expiresAt: string;
  lastActiveAt: string; // Last active timestamp
  fcmToken?: string | null;
  location?: {
    country?: string;
    city?: string;
    region?: string;
    timezone?: string;
  };
  deviceInfo?: {
    os?: string;
    osVersion?: string;
    browserVersion?: string;
    isMobile?: boolean;
    isTablet?: boolean;
    isDesktop?: boolean;
  };
}

interface SessionListTableProps {
  sessions: Session[];
  isLoading: boolean;
  onRefresh?: () => void;
  onRevokeSession?: (sessionId: string) => Promise<void>;
  onRevokeAllOtherSessions?: () => Promise<void>;
  lastUpdateTime?: string;
  currentSessionId?: string;
  showCurrentSessionIndicator?: boolean;
}

type ViewMode = 'list' | 'detail';
type SortField = 'lastActiveAt' | 'createdAt' | 'device' | 'status' | 'user';
type SortDirection = 'asc' | 'desc';

export default function SessionListTable({
  sessions,
  isLoading,
  onRefresh,
  onRevokeSession,
  onRevokeAllOtherSessions,
  lastUpdateTime,
  currentSessionId,
}: SessionListTableProps) {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [loadingRevokeId, setLoadingRevokeId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('lastActiveAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isRevokingAll, setIsRevokingAll] = useState(false);
  const [timeAgoUpdate, setTimeAgoUpdate] = useState<string>('');

  const {
    isConnected,
    revokeSession: socketRevokeSession,
    sendEvent
  } = useSocket();

  const itemsPerPage = 20;
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  // Update time ago for last update
  useEffect(() => {
    if (lastUpdateTime) {
      const updateTimeAgo = () => {
        setTimeAgoUpdate(formatTimeAgo(lastUpdateTime));
      };

      updateTimeAgo();
      const interval = setInterval(updateTimeAgo, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [lastUpdateTime]);

  // Sort sessions based on sortField and sortDirection
  const sortedSessions = useMemo(() => {
    const sessionsCopy = [...sessions];

    return sessionsCopy.sort((a, b) => {
      let aValue: string | number, bValue: string | number;

      switch (sortField) {
        case 'lastActiveAt':
          aValue = new Date(a.lastActiveAt || a.createdAt).getTime();
          bValue = new Date(b.lastActiveAt || b.createdAt).getTime();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'device':
          aValue = formatDeviceInfo(a.userAgent).toLowerCase();
          bValue = formatDeviceInfo(b.userAgent).toLowerCase();
          break;
        case 'user':
          aValue = a.user?.name?.toLowerCase() || a.user?.email?.toLowerCase() || '';
          bValue = b.user?.name?.toLowerCase() || b.user?.email?.toLowerCase() || '';
          break;
        case 'status':
          aValue = a.isRevoked ? 1 : 0;
          bValue = b.isRevoked ? 1 : 0;
          break;
        default:
          aValue = 0;
          bValue = 0;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [sessions, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortableHeader = ({
    field,
    children
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <div
      className="flex items-center gap-1 cursor-pointer hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      onClick={() => handleSort(field)}
    >
      {children}
      {sortField === field ? (
        sortDirection === 'asc' ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-50" />
      )}
    </div>
  );

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

  const handleRevokeAllOther = async () => {
    if (!onRevokeAllOtherSessions) {
      toast.error('Revoke all function not available');
      return;
    }

    setIsRevokingAll(true);
    try {
      await onRevokeAllOtherSessions();
      toast.success('All other sessions revoked successfully');
    } catch (error) {
      console.error('Failed to revoke all sessions:', error);
      toast.error('Failed to revoke all sessions');
    } finally {
      setIsRevokingAll(false);
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

  // const handleLogoutOtherDevices = () => {
  //   sendEvent('session:logout-other');
  //   toast.info('Logging out from other devices...');
  // };

  const handlePing = () => {
    sendEvent('ping');
    toast.info('Pinging server...');
  };

  // Pagination calculations
  const totalPages = Math.ceil(sortedSessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentSessions = sortedSessions.slice(startIndex, startIndex + itemsPerPage);

  // Utility Functions
  const formatDeviceInfo = (userAgent: string) => {
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'Mac';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Desktop';
  };

  const getBrowserInfo = (userAgent: string) => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'Browser';
  };

  const getDeviceIcon = (userAgent: string, className: string = "h-5 w-5") => {
    if (userAgent.includes('Mobile')) {
      return <Smartphone className={`text-blue-500 ${className}`} />;
    }
    if (userAgent.includes('Tablet')) {
      return <Tablet className={`text-purple-500 ${className}`} />;
    }
    return <Laptop className={`text-green-500 ${className}`} />;
  };

  const getDeviceIconComponent = (userAgent: string) => {
    if (userAgent.includes('Mobile')) return '📱';
    if (userAgent.includes('Tablet')) return '📱';
    return '💻';
  };

  // Time formatting functions
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 30) {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } else if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else if (diffSeconds > 30) {
      return `${diffSeconds}s ago`;
    } else {
      return 'Just now';
    }
  };

  const getTimeSince = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d`;
    if (diffHours > 0) return `${diffHours}h`;
    if (diffMins > 0) return `${diffMins}m`;
    return '<1m';
  };

  const getTimeAgo = useCallback((dateString: string) => {
    return formatTimeAgo(dateString);
  }, []); // Add dependencies if formatTimeAgo uses variables from component scope

  useEffect(() => {
    if (lastUpdateTime) {
      const updateTimeAgo = () => {
        setTimeAgoUpdate(getTimeAgo(lastUpdateTime));
      };

      updateTimeAgo();
      const interval = setInterval(updateTimeAgo, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [lastUpdateTime, getTimeAgo]);
  const formatDetailedTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }),
      full: date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };
  };

  const calculateIdleTime = (lastActiveAt: string) => {
    const now = new Date();
    const lastActive = new Date(lastActiveAt);
    const diffMs = now.getTime() - lastActive.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return { value: diffDays, unit: 'days' };
    if (diffHours > 0) return { value: diffHours, unit: 'hours' };
    if (diffMins > 0) return { value: diffMins, unit: 'minutes' };
    return { value: Math.floor(diffMs / 1000), unit: 'seconds' };
  };

  const getIdleBadgeVariant = (lastActiveAt: string) => {
    const idleTime = calculateIdleTime(lastActiveAt);

    if (idleTime.unit === 'days' && idleTime.value > 7) return 'destructive';
    if (idleTime.unit === 'days' && idleTime.value > 3) return 'secondary';
    if (idleTime.unit === 'hours' && idleTime.value > 12) return 'secondary';
    if (idleTime.unit === 'minutes' && idleTime.value > 30) return 'outline';
    return 'default';
  };

  // Check session and notification status
  const checkSessionStatus = (session: Session) => {
    const isSessionOn = !session.isRevoked;
    const isNotifOn = !!session.fcmToken;
    const isCurrentSession = currentSessionId === session.id;

    // Calculate if session is recently active (within last 5 minutes)
    const lastActive = new Date(session.lastActiveAt || session.createdAt);
    const now = new Date();
    const isRecentlyActive = (now.getTime() - lastActive.getTime()) < 5 * 60 * 1000;

    return { isSessionOn, isNotifOn, isCurrentSession, isRecentlyActive };
  };

  // Helper function to get status labels
  const getStatusLabels = (session: Session) => {
    const { isSessionOn, isNotifOn, isCurrentSession, isRecentlyActive } = checkSessionStatus(session);

    return {
      sessionLabel: isCurrentSession ? "Current" : (isSessionOn ? "Active" : "Inactive"),
      notifLabel: isNotifOn ? "Enabled" : "Disabled",
      activityLabel: isRecentlyActive ? "Recently Active" : "Idle"
    };
  };

  // Enhanced Status Indicator Component
  const StatusIndicator = ({
    isActive,
    label,
    type = "session",
    size = "medium",
    isCurrent = false
  }: {
    isActive: boolean;
    label: string;
    type?: "session" | "notification" | "activity";
    size?: "small" | "medium" | "large";
    isCurrent?: boolean;
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

    const animationDuration = type === "session" ? 1.4 :
      type === "activity" ? 1.2 : 1.5;

    const getIcon = () => {
      if (type === "notification") return <Bell className={iconSizeClasses[size]} />;
      if (type === "activity") return <Activity className={iconSizeClasses[size]} />;
      return <Zap className={iconSizeClasses[size]} />;
    };

    const getColorClasses = () => {
      if (isCurrent) return {
        bg: "bg-blue-500",
        text: "text-blue-600",
        icon: "text-blue-500"
      };

      return isActive ? {
        bg: "bg-green-500",
        text: "text-green-600",
        icon: "text-green-500"
      } : {
        bg: "bg-red-500",
        text: "text-red-600",
        icon: "text-red-400"
      };
    };

    const colors = getColorClasses();

    return (
      <div className="flex items-center gap-1.5">
        <div className="relative">
          <motion.div
            className={`${sizeClasses[size]} rounded-full ${colors.bg}`}
            animate={isActive && !isCurrent ?
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
            transition={isActive && !isCurrent ?
              {
                duration: animationDuration,
                repeat: Infinity,
                ease: "easeInOut"
              } :
              { duration: 0 }
            }
          />
          {isActive && !isCurrent && (
            <motion.div
              className={`absolute inset-0 ${sizeClasses[size]} rounded-full ${colors.bg}`}
              animate={{ scale: [1, 1.8], opacity: [0.7, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </div>
        <span className={`text-xs font-medium ${colors.text}`}>
          {label}
        </span>
        {getIcon()}
      </div>
    );
  };

  // Detail View Component
  const SessionDetailView = ({ session }: { session: Session }) => {
    const { isSessionOn, isNotifOn, isCurrentSession, isRecentlyActive } = checkSessionStatus(session);
    const isRevoking = loadingRevokeId === session.id;
    const timeSinceLogin = getTimeSince(session.createdAt);
    const lastActiveTime = formatDetailedTime(session.lastActiveAt || session.createdAt);
    const idleTime = calculateIdleTime(session.lastActiveAt || session.createdAt);
    const isSessionExpired = new Date(session.expiresAt) < new Date();

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
                Session Details
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
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-bold shadow-lg">
                {session.user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              {isCurrentSession && (
                <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs bg-blue-500">
                  Current
                </Badge>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                  {session.user?.name || 'Unknown User'}
                </p>
                {isCurrentSession && (
                  <Badge variant="outline" className="text-blue-600 dark:text-blue-400 border-blue-300">
                    This Device
                  </Badge>
                )}
              </div>
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
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <Zap className="h-5 w-5 text-blue-500" />
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Session</span>
              </div>
              <Badge
                variant={isCurrentSession ? "default" : (isSessionOn ? "default" : "destructive")}
                className={cn(
                  isCurrentSession ? "bg-blue-500 hover:bg-blue-600" :
                    isSessionOn ? "bg-green-500 hover:bg-green-600" : ""
                )}
              >
                {isCurrentSession ? "Current" : (isSessionOn ? "Active" : "Inactive")}
              </Badge>
            </div>
            <StatusIndicator
              isActive={isSessionOn}
              label={isCurrentSession ? "Current" : (isSessionOn ? "Live" : "Terminated")}
              type="session"
              size="large"
              isCurrent={isCurrentSession}
            />
            {isSessionExpired && (
              <p className="text-xs text-red-500 mt-2">Session expired</p>
            )}
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
                className={cn(
                  isNotifOn ? "bg-green-500 hover:bg-green-600" : "bg-gray-200 dark:bg-gray-800"
                )}
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

          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <Activity className="h-5 w-5 text-green-500" />
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Activity</span>
              </div>
              <Badge
                variant={getIdleBadgeVariant(session.lastActiveAt || session.createdAt)}
                className="text-xs"
              >
                {isRecentlyActive ? "Active" : "Idle"}
              </Badge>
            </div>
            <StatusIndicator
              isActive={isRecentlyActive}
              label={isRecentlyActive ? "Recently Active" : `Idle ${idleTime.value}${idleTime.unit.charAt(0)}`}
              type="activity"
              size="large"
            />
            <p className="text-xs text-gray-500 mt-2">
              Last active: {formatTimeAgo(session.lastActiveAt || session.createdAt)}
            </p>
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
              <span className="text-2xl">{getDeviceIconComponent(session.userAgent)}</span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatDeviceInfo(session.userAgent)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {getBrowserInfo(session.userAgent)}
                </p>
                {session.deviceInfo?.os && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {session.deviceInfo.os} {session.deviceInfo.osVersion}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Location</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-400" />
                <Badge variant="outline" className="font-mono text-sm bg-blue-50 dark:bg-blue-950/30 h-6 px-2">
                  {session.ipAddress}
                </Badge>
              </div>
              {session.location && (
                <div className="text-xs text-gray-600 dark:text-gray-400 pl-6">
                  {session.location.city && `${session.location.city}, `}
                  {session.location.region && `${session.location.region}, `}
                  {session.location.country}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Login Time</span>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {formatDetailedTime(session.createdAt).date}
              </p>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-gray-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDetailedTime(session.createdAt).time}
                </p>
              </div>
              <Badge variant="outline" className="text-xs mt-1 bg-green-50 dark:bg-green-950/30">
                {getTimeSince(session.createdAt)} ago
              </Badge>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <Timer className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Active</span>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {lastActiveTime.date.split(',')[0]}
              </p>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-gray-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {lastActiveTime.time}
                </p>
              </div>
              <Badge
                variant={getIdleBadgeVariant(session.lastActiveAt || session.createdAt)}
                className="text-xs mt-1"
              >
                {formatTimeAgo(session.lastActiveAt || session.createdAt)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Session Duration & Expiry */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Session Timeline
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="text-center relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-0.5 bg-gray-300 dark:bg-gray-700"></div>
              </div>
              <div className="relative">
                <Badge variant="outline" className="bg-white dark:bg-gray-900">
                  {getTimeSince(session.createdAt)} active
                </Badge>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Expires</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                {new Date(session.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
          {!isCurrentSession && (
            <Button
              variant="destructive"
              onClick={() => handleRevoke(session.id)}
              className="flex-1 h-10 text-sm font-medium flex items-center justify-center gap-2"
              disabled={session.isRevoked || isRevoking}
            >
              <LogOut className="h-4 w-4" />
              {session.isRevoked ? 'Already Revoked' : isRevoking ? 'Revoking...' : 'Revoke Session'}
            </Button>
          )}
        </div>
      </div>
    );
  };

  // Enhanced Mobile view component
  const MobileSessionCard = ({ session }: { session: Session }) => {
    const { isSessionOn, isNotifOn, isCurrentSession } = checkSessionStatus(session);
    const { sessionLabel, notifLabel } = getStatusLabels(session);
    const timeSinceLogin = getTimeSince(session.createdAt);
    const lastActiveTime = formatTimeAgo(session.lastActiveAt || session.createdAt);

    return (
      <motion.div
        whileTap={{ scale: 0.98 }}
        className="mb-2"
      >
        <Card
          className={cn(
            "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden",
            isCurrentSession && "ring-2 ring-blue-500 ring-opacity-50"
          )}
          onClick={() => handleViewDetail(session)}
        >
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="relative">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-white text-sm font-medium flex-shrink-0",
                    isCurrentSession
                      ? "bg-gradient-to-br from-blue-500 to-blue-700"
                      : "bg-gradient-to-br from-blue-500 to-purple-600"
                  )}>
                    {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  {isCurrentSession && (
                    <Badge className="absolute -top-1 -right-1 px-1 py-0.5 text-[10px] bg-blue-500">
                      You
                    </Badge>
                  )}
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
                      {getDeviceIcon(session.userAgent)}
                      {formatDeviceInfo(session.userAgent)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Timer className="h-3 w-3" />
                      Last Active : {lastActiveTime}
                    </span>
                  </div>

                  {/* Enhanced Status Indicators */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <div className="relative">
                        <motion.div
                          className={cn(
                            "w-2.5 h-2.5 rounded-full",
                            isCurrentSession ? "bg-blue-500" :
                              isSessionOn ? "bg-green-500" : "bg-red-500"
                          )}
                          animate={isSessionOn && !isCurrentSession ?
                            { opacity: [0.6, 1, 0.6], scale: [1, 1.2, 1] } :
                            { opacity: 1 }
                          }
                          transition={{ duration: 1.4, repeat: Infinity }}
                        />
                        {isSessionOn && !isCurrentSession && (
                          <motion.div
                            className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500"
                            animate={{ scale: [1, 2], opacity: [0.7, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                        )}
                      </div>
                      <span className={cn(
                        "text-xs font-medium",
                        isCurrentSession ? "text-blue-600" :
                          isSessionOn ? "text-green-600" : "text-red-600"
                      )}>
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
                      Last Login : {timeSinceLogin}
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
                    {!isCurrentSession && (
                      <DropdownMenuItem
                        onClick={() => handleRevoke(session.id)}
                        disabled={session.isRevoked || loadingRevokeId === session.id}
                        className="text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300 focus:bg-red-50 dark:focus:bg-red-950/50 flex items-center gap-2 text-sm"
                      >
                        <LogOut className="h-4 w-4" />
                        {session.isRevoked ? 'Revoked' : loadingRevokeId === session.id ? 'Revoking...' : 'Revoke Session'}
                      </DropdownMenuItem>
                    )}
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
    const { isSessionOn, isNotifOn, isCurrentSession, isRecentlyActive } = checkSessionStatus(session);
    const { sessionLabel, notifLabel } = getStatusLabels(session);
    const isRevoking = loadingRevokeId === session.id;
    // const timeSinceLogin = getTimeSince(session.createdAt);
    const lastActiveTime = formatTimeAgo(session.lastActiveAt || session.createdAt);

    return (
      <TableRow
        key={session.id}
        className={cn(
          "border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors duration-200 cursor-pointer h-14",
          isCurrentSession && "bg-blue-50/30 dark:bg-blue-900/10"
        )}
        onClick={() => handleViewDetail(session)}
      >
        <TableCell className="py-2">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full text-white text-sm font-medium",
                isCurrentSession
                  ? "bg-gradient-to-br from-blue-500 to-blue-700"
                  : "bg-gradient-to-br from-blue-500 to-purple-600"
              )}>
                {session.user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              {isCurrentSession && (
                <Badge className="absolute -top-1 -right-1 px-1 py-0.5 text-[10px] bg-blue-500">
                  You
                </Badge>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate max-w-[140px]">
                {session.user?.name || 'Unknown User'}
                {isCurrentSession && (
                  <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(Current)</span>
                )}
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
            {getDeviceIcon(session.userAgent)}
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
          <div className="space-y-1">
            <StatusIndicator
              isActive={isSessionOn}
              label={sessionLabel}
              type="session"
              size="small"
              isCurrent={isCurrentSession}
            />
            <StatusIndicator
              isActive={isNotifOn}
              label={notifLabel}
              type="notification"
              size="small"
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
          </div>
        </TableCell>
        <TableCell className="py-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <Timer className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-900 dark:text-gray-100 font-medium">
                {lastActiveTime}
              </span>
            </div>
            <Badge variant={getIdleBadgeVariant(session.lastActiveAt || session.createdAt)} className="text-xs h-5 mt-1">
              {isRecentlyActive ? "Active" : "Idle"}
            </Badge>
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
                {!isCurrentSession && (
                  <DropdownMenuItem
                    onClick={() => handleRevoke(session.id)}
                    disabled={session.isRevoked || isRevoking}
                    className="text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300 focus:bg-red-50 dark:focus:bg-red-950/50 flex items-center gap-2 text-sm"
                  >
                    <LogOut className="h-4 w-4" />
                    {session.isRevoked ? 'Already Revoked' : isRevoking ? 'Revoking...' : 'Revoke Session'}
                  </DropdownMenuItem>
                )}
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
              Manage your active login sessions and devices • Sorted by Last Active
            </p>
            {lastUpdateTime && (
              <p className="text-blue-200 text-xs mt-1">
                Last updated: {formatDetailedTime(lastUpdateTime).time} ({timeAgoUpdate})
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
              {onRevokeAllOtherSessions && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 px-3 text-xs md:text-sm bg-white/10 border-white/30 text-white hover:bg-white/20"
                  onClick={handleRevokeAllOther}
                  disabled={!isConnected || sessions.filter(s => !s.isRevoked && s.id !== currentSessionId).length === 0 || isRevokingAll}
                >
                  <Shield className="h-4 w-4 mr-1" />
                  {isRevokingAll ? 'Revoking...' : 'Logout Others'}
                </Button>
              )}
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
                  <SortableHeader field="user">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm font-semibold">
                      <User className="h-4 w-4" />
                      User Information
                    </div>
                  </SortableHeader>
                </TableHead>
                <TableHead className="py-3">
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm font-semibold">
                    <Globe className="h-4 w-4" />
                    IP Address
                  </div>
                </TableHead>
                <TableHead className="py-3">
                  <SortableHeader field="device">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm font-semibold">
                      <Monitor className="h-4 w-4" />
                      Device & Browser
                    </div>
                  </SortableHeader>
                </TableHead>
                <TableHead className="py-3">
                  <SortableHeader field="status">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm font-semibold">
                      Status Indicators
                    </div>
                  </SortableHeader>
                </TableHead>
                <TableHead className="py-3">
                  <SortableHeader field="createdAt">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm font-semibold">
                      <Calendar className="h-4 w-4" />
                      Login Time
                    </div>
                  </SortableHeader>
                </TableHead>
                <TableHead className="py-3">
                  <SortableHeader field="lastActiveAt">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm font-semibold">
                      <Timer className="h-4 w-4" />
                      Last Active
                      {sortField === 'lastActiveAt' && (
                        <span className="text-xs font-normal ml-1">
                          ({sortDirection === 'desc' ? 'Newest' : 'Oldest'})
                        </span>
                      )}
                    </div>
                  </SortableHeader>
                </TableHead>
                <TableHead className="text-right py-3 pr-6 text-sm font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentSessions.length > 0 ? (
                currentSessions.map((session) => (
                  <DesktopTableRow key={session.id} session={session} />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center">
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
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden p-3">
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Active Sessions ({currentSessions.length})
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Sorted by Last Active • {sortDirection === 'desc' ? 'Newest first' : 'Oldest first'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs"
                  onClick={() => handleSort('lastActiveAt')}
                >
                  <Timer className="h-3 w-3" />
                  {sortDirection === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
                </Button>
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