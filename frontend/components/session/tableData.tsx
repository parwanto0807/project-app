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
  Smartphone
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

export default function SessionListTable({ sessions, isLoading }: SessionListProps) {
  const [data, setData] = useState<Session[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setData(sessions);
  }, [sessions]);

  const handleRevoke = async (id: string) => {
    await revokeSession(id);
    setData((prev) => prev.filter((s) => s.id !== id));
  };

  // Pagination calculations
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentSessions = data.slice(startIndex, startIndex + itemsPerPage);

  const formatDeviceInfo = (userAgent: string) => {
    // Simple device detection
    if (userAgent.includes('Mobile')) return 'Mobile Device';
    if (userAgent.includes('Tablet')) return 'Tablet';
    if (userAgent.includes('Windows')) return 'Windows Desktop';
    if (userAgent.includes('Mac')) return 'Mac Desktop';
    if (userAgent.includes('Linux')) return 'Linux Desktop';
    return 'Desktop Device';
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

  // Mobile view component
  const MobileSessionCard = ({ session }: { session: Session }) => (
    <Card className="mb-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-medium">
              {session.user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {session.user?.name || 'Unknown User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {session.user?.email}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => handleRevoke(session.id)}
                className="text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300 focus:bg-red-50 dark:focus:bg-red-950/50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Revoke Session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Globe className="h-3 w-3" />
              <span className="text-xs font-medium">IP Address</span>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {session.ipAddress}
            </Badge>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Monitor className="h-3 w-3" />
              <span className="text-xs font-medium">Device</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">{getDeviceIcon(session.userAgent)}</span>
              <span className="text-xs text-gray-700 dark:text-gray-300">
                {formatDeviceInfo(session.userAgent)}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Smartphone className="h-3 w-3" />
              <span className="text-xs font-medium">Browser</span>
            </div>
            <span className="text-xs text-gray-700 dark:text-gray-300">
              {getBrowserInfo(session.userAgent)}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Calendar className="h-3 w-3" />
              <span className="text-xs font-medium">Login Time</span>
            </div>
            <div className="text-xs">
              <div className="text-gray-700 dark:text-gray-300">
                {new Date(session.createdAt).toLocaleDateString()}
              </div>
              <div className="text-gray-500 dark:text-gray-400">
                {new Date(session.createdAt).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) return <SessionListSkeleton />;

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-950/50 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-t-lg p-6 border-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-white mb-2">
              Active Sessions
            </CardTitle>
            <p className="text-blue-100 text-sm">
              Manage your active login sessions across devices
            </p>
          </div>
          <Badge variant="secondary" className="px-3 py-1 bg-white/20 text-white border-white/30">
            {data.length} Active
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/50">
                <TableHead className="w-[250px]">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <User className="h-4 w-4" />
                    User & Device
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Globe className="h-4 w-4" />
                    IP Address
                  </div>
                </TableHead>
                <TableHead className="w-[200px]">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Monitor className="h-4 w-4" />
                    Device Info
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4" />
                    Login Time
                  </div>
                </TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentSessions.map((session) => (
                <TableRow 
                  key={session.id} 
                  className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors duration-200"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-medium">
                        {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {session.user?.name || 'Unknown User'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {session.user?.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs bg-blue-50 dark:bg-blue-950/30">
                      {session.ipAddress}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{getDeviceIcon(session.userAgent)}</span>
                      <div>
                        <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                          {formatDeviceInfo(session.userAgent)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-wrap">
                          {getBrowserInfo(session.userAgent)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(session.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => handleRevoke(session.id)}
                          className="text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300 focus:bg-red-50 dark:focus:bg-red-950/50"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Revoke Session
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden p-4">
          {currentSessions.map((session) => (
            <MobileSessionCard key={session.id} session={session} />
          ))}
        </div>

        {data.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 mb-2">
              <Monitor className="h-16 w-16 mx-auto mb-4 opacity-40" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-1">No active sessions</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              There are no active sessions to display
            </p>
          </div>
        )}
      </CardContent>

      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 rounded-b-lg">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </Card>
  );
}

// Skeleton Loader Component
function SessionListSkeleton() {
  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-950/50 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-t-lg p-6 border-0">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 bg-gray-300 dark:bg-gray-600" />
            <Skeleton className="h-4 w-64 bg-gray-300 dark:bg-gray-600" />
          </div>
          <Skeleton className="h-6 w-16 bg-gray-300 dark:bg-gray-600" />
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Desktop Skeleton */}
        <div className="hidden md:block p-1">
          <div className="space-y-4 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-800 rounded-lg">
                <div className="flex items-center gap-4 flex-1">
                  <Skeleton className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-800" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32 bg-gray-200 dark:bg-gray-800" />
                    <Skeleton className="h-3 w-24 bg-gray-200 dark:bg-gray-800" />
                  </div>
                </div>
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-20 bg-gray-200 dark:bg-gray-800" />
                </div>
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-40 bg-gray-200 dark:bg-gray-800" />
                </div>
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-24 bg-gray-200 dark:bg-gray-800" />
                  <Skeleton className="h-3 w-20 bg-gray-200 dark:bg-gray-800" />
                </div>
                <Skeleton className="h-8 w-8 bg-gray-200 dark:bg-gray-800 rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Skeleton */}
        <div className="md:hidden p-4 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-800" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24 bg-gray-200 dark:bg-gray-800" />
                      <Skeleton className="h-3 w-20 bg-gray-200 dark:bg-gray-800" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8 bg-gray-200 dark:bg-gray-800 rounded-md" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="space-y-2">
                      <Skeleton className="h-3 w-16 bg-gray-200 dark:bg-gray-800" />
                      <Skeleton className="h-4 w-full bg-gray-200 dark:bg-gray-800" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}