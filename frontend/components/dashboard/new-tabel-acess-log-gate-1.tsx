"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSocket } from "@/contexts/SocketContext";

interface AccessLog {
  id: string;
  kartuId: string;
  kartuIdGuest: string;
  userAccess?: {
    warga?: {
      nama: string;
      blok: string;
      noBlok: string;
    };
  };
  guestAccess?: {
    name: string;
  }
  accessTime: string;
  accessPoint?: {
    name: string;
  };
  status: string;
  keterangan?: string;
}

export default function NewAccessLogTableGate1() {
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const MAX_ROWS = 5; // Batasi maksimal 10 row

  // Fungsi fetch data
  const fetchAccessLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/access-log/getAccessLogsGate1?`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      // Asumsikan API mengembalikan { newLog, totalPages, totalLogs }
      setAccessLogs(data.newLog || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data saat komponen mount
  useEffect(() => {
    fetchAccessLogs();
  }, [fetchAccessLogs]);

  // Setup WebSocket untuk update realtime data access log
  const { socket } = useSocket();
  // console.log("Socket:", socket);

  useEffect(() => {
    if (!socket) return;

    const handleNewAccessLog = (data: AccessLog | AccessLog[]) => {
      // console.log("Received new access log via WebSocket:", data);
      setAccessLogs((prevLogs) => {
        const newLogsArray = Array.isArray(data) ? data : [data];
        const combined = [...newLogsArray, ...prevLogs];
        // Filter duplikat berdasarkan id
        const uniqueLogs = combined.filter((log, index, self) =>
          index === self.findIndex((l) => l.id === log.id)
        );
        return uniqueLogs;
      });
    };

    socket.on("new-access-log-gate1", handleNewAccessLog);

    return () => {
      socket.off("new-access-log-gate1", handleNewAccessLog);
    };
  }, [socket]);

  return (
    <Card className="mt-8 shadow-lg">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Access Log</h2>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <p className="text-red-500">Error: {error}</p>
        ) : accessLogs.length === 0 ? (
          <p className="text-gray-600 dark:text-white">Tidak ada data access log.</p>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-100">
                <TableRow>
                  <TableHead className="w-[50px] dark:text-black">No.</TableHead>
                  <TableHead className="dark:text-black" >Kartu ID</TableHead>
                  <TableHead className="dark:text-black" >Nama Warga</TableHead>
                  <TableHead className="dark:text-black" >Access Time</TableHead>
                  <TableHead className="dark:text-black" >Blok</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accessLogs.slice(0, MAX_ROWS).map((log, index) => (
                  <TableRow key={`${log.id}-${index}`}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{log.kartuId || log.kartuIdGuest}</TableCell>
                    <TableCell>
                      {log.kartuIdGuest ? (
                        <span className="text-orange-600 font-semibold">
                          {log.guestAccess?.name} (Tamu)
                        </span>
                      ) : (
                        log.userAccess?.warga?.nama
                      )}
                    </TableCell>

                    <TableCell>{new Date(log.accessTime).toLocaleString()}</TableCell>
                    <TableCell>{log.userAccess?.warga?.blok || "N/A"} - {log.userAccess?.warga?.noBlok || "N/A"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </Card>
  );
}
