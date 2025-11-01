"use client";

import { Session } from "@/types/session";
import { revokeSession } from "@/lib/action/session/session";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
  Info
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SessionListProps {
  sessions: Session[];
  isLoading: boolean;
}

type ViewMode = 'list' | 'detail';

export default function SessionListTable({ sessions, isLoading }: SessionListProps) {
  const [data, setData] = useState<Session[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const itemsPerPage = 20;

  useEffect(() => {
    setData(sessions);
  }, [sessions]);

  const handleRevoke = async (id: string) => {
    await revokeSession(id);
    setData((prev) => prev.filter((s) => s.id !== id));
    if (selectedSession?.id === id) {
      setViewMode('list');
      setSelectedSession(null);
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

  // Pagination calculations
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentSessions = data.slice(startIndex, startIndex + itemsPerPage);

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

  // Detail View Component - More Compact
  const SessionDetailView = ({ session }: { session: Session }) => (
    <div className="space-y-3 animate-in fade-in duration-300">
      {/* Header */}
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
        <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
          Session Details
        </Badge>
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
              {new Date(session.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
        >
          <LogOut className="h-3 w-3" />
          Revoke
        </Button>
      </div>
    </div>
  );

  // Mobile view component - Super Compact
  const MobileSessionCard = ({ session }: { session: Session }) => (
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
          <Info className="h-3 w-3 text-gray-400 flex-shrink-0 ml-1" />
        </div>
      </CardContent>
    </Card>
  );

  // Desktop Table Row - More Compact
  const DesktopTableRow = ({ session }: { session: Session }) => (
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
        <div className="flex flex-col">
          <span className="text-xs text-gray-900 dark:text-gray-100 font-medium">
            {new Date(session.createdAt).toLocaleDateString()}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(session.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
                className="text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300 focus:bg-red-50 dark:focus:bg-red-950/50 flex items-center gap-2 text-xs"
              >
                <LogOut className="h-3 w-3" />
                Revoke Session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );

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
            <p className="text-blue-100 text-xs">
              Manage your active login sessions
            </p>
          </div>
          <Badge variant="secondary" className="px-2 py-1 bg-white/20 text-white border-white/30 text-xs">
            {data.length} Active
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
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

        {data.length === 0 && (
          <div className="text-center py-2">
            <div className="text-gray-400 dark:text-gray-500 mb-2">
              <Monitor className="h-12 w-12 mx-auto mb-2 opacity-40" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">No active sessions</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs">
              No active sessions to display
            </p>
          </div>
        )}
      </CardContent>

      {totalPages > 1 && viewMode === 'list' && (
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 rounded-b-lg">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer h-8 w-8"}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer h-8 w-8 text-xs"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer h-8 w-8"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </Card>
  );
}

// More Compact Skeleton Loader
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