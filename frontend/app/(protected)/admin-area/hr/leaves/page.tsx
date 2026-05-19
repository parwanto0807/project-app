"use client";

import { useEffect, useState, useTransition } from "react";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { LayoutProps } from "@/types/layout";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import Link from "next/link";
import { 
  Calendar, 
  Check, 
  X, 
  FileText, 
  User, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  FileDown, 
  Search, 
  Filter, 
  RotateCcw,
  Eye
} from "lucide-react";
import { fetchAllLeaves, approveLeave, rejectLeave } from "@/lib/action/hr/leaves";
import { 
  Tooltip, 
  TooltipTrigger, 
  TooltipContent, 
  TooltipProvider 
} from "@/components/ui/tooltip";

export default function LeavesManagementPage() {
  const [leavesData, setLeavesData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);

  // Mutation parameters
  const [rejectReason, setRejectReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const filters: any = {};
      if (statusFilter !== "ALL") filters.status = statusFilter;
      if (typeFilter !== "ALL") filters.jenis = typeFilter;

      const result = await fetchAllLeaves(filters);
      
      if (result.error) {
        setError(result.error);
      } else {
        setLeavesData(result.leaves || []);
      }
    } catch (err) {
      console.error("Error loading leaves data:", err);
      setError("Gagal memuat data pengajuan cuti dan ijin.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, typeFilter]);

  const handleResetFilters = () => {
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setSearchQuery("");
  };

  const handleApprove = (leave: any) => {
    setSelectedLeave(leave);
    setIsApproveConfirmOpen(true);
  };

  const handleReject = (leave: any) => {
    setSelectedLeave(leave);
    setRejectReason("");
    setIsRejectOpen(true);
  };

  const submitApprove = () => {
    if (!selectedLeave) return;
    startTransition(async () => {
      const res = await approveLeave(selectedLeave.id);
      if (res.success) {
        setIsApproveConfirmOpen(false);
        loadData();
      } else {
        alert(res.error || "Gagal menyetujui pengajuan.");
      }
    });
  };

  const submitReject = () => {
    if (!selectedLeave || !rejectReason.trim()) return;
    startTransition(async () => {
      const res = await rejectLeave(selectedLeave.id, rejectReason);
      if (res.success) {
        setIsRejectOpen(false);
        loadData();
      } else {
        alert(res.error || "Gagal menolak pengajuan.");
      }
    });
  };

  // Filter local search query
  const filteredLeaves = leavesData.filter((item: any) => {
    const name = item.karyawan?.namaLengkap?.toLowerCase() || "";
    const nik = item.karyawan?.nik?.toLowerCase() || "";
    const ket = item.keterangan?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    return name.includes(query) || nik.includes(query) || ket.includes(query);
  });

  // Calculate Stats
  const totalRequests = leavesData.length;
  const pendingCount = leavesData.filter((item) => item.status === "PENDING").length;
  const approvedCount = leavesData.filter((item) => item.status === "APPROVED").length;
  const rejectedCount = leavesData.filter((item) => item.status === "REJECTED").length;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const layoutProps: LayoutProps = {
    title: "Leaves & Permits",
    role: "admin",
    children: (
      <div className="flex-1 space-y-8 p-4 pt-6 md:p-8 min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/50">
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Badge variant="outline" className="hover:bg-cyan-50 text-cyan-700 border-cyan-200 transition-all duration-300">
                  <Link href="/admin-area">Dashboard</Link>
                </Badge>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Badge variant="outline" className="text-gray-500 border-gray-200">
                <BreadcrumbPage>HR Management</BreadcrumbPage>
              </Badge>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Badge variant="secondary" className="bg-cyan-600 text-white border-none shadow-sm">
                <BreadcrumbPage>Ijin & Cuti Karyawan</BreadcrumbPage>
              </Badge>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Title Section */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 uppercase">
              Ijin & Cuti Karyawan
            </h1>
            <p className="text-slate-500 font-medium">
              Kelola dan setujui permohonan ijin, sakit, serta cuti tahunan karyawan.
            </p>
          </div>
          <Button 
            onClick={loadData}
            variant="outline"
            className="w-full md:w-auto border-cyan-200 text-cyan-700 hover:bg-cyan-50 gap-2 font-semibold shadow-sm transition-all duration-300 active:scale-95"
          >
            <RotateCcw className="h-4 w-4" /> Refresh Data
          </Button>
        </div>

        {/* Stats Dashboard */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-l-4 border-l-cyan-500 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="flex items-center justify-between p-6">
              <div className="space-y-1">
                <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">Total Pengajuan</p>
                <h3 className="text-3xl font-black text-slate-800">{totalRequests}</h3>
              </div>
              <div className="rounded-full bg-cyan-50 p-3 text-cyan-600">
                <FileText className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="flex items-center justify-between p-6">
              <div className="space-y-1">
                <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">Menunggu Approval</p>
                <h3 className="text-3xl font-black text-slate-800">{pendingCount}</h3>
              </div>
              <div className="rounded-full bg-amber-50 p-3 text-amber-600">
                <Clock className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="flex items-center justify-between p-6">
              <div className="space-y-1">
                <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">Telah Disetujui</p>
                <h3 className="text-3xl font-black text-slate-800">{approvedCount}</h3>
              </div>
              <div className="rounded-full bg-emerald-50 p-3 text-emerald-600">
                <CheckCircle className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-rose-500 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="flex items-center justify-between p-6">
              <div className="space-y-1">
                <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">Telah Ditolak</p>
                <h3 className="text-3xl font-black text-slate-800">{rejectedCount}</h3>
              </div>
              <div className="rounded-full bg-rose-50 p-3 text-rose-600">
                <XCircle className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Section */}
        <Card className="shadow-sm border-slate-100">
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Cari karyawan berdasarkan Nama, NIK, atau keperluan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-slate-200 focus-visible:ring-cyan-500"
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="w-full sm:w-[180px]">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="border-slate-200">
                      <div className="flex items-center gap-2">
                        <Filter className="h-3.5 w-3.5 text-slate-400" />
                        <SelectValue placeholder="Semua Status" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Semua Status</SelectItem>
                      <SelectItem value="PENDING">PENDING</SelectItem>
                      <SelectItem value="APPROVED">APPROVED</SelectItem>
                      <SelectItem value="REJECTED">REJECTED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full sm:w-[180px]">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="border-slate-200">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <SelectValue placeholder="Semua Jenis" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Semua Jenis</SelectItem>
                      <SelectItem value="CUTI">CUTI</SelectItem>
                      <SelectItem value="IZIN">IZIN</SelectItem>
                      <SelectItem value="SAKIT">SAKIT</SelectItem>
                      <SelectItem value="PENTING">PENTING</SelectItem>
                      <SelectItem value="LAINNYA">LAINNYA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleResetFilters}
                  variant="ghost" 
                  className="text-slate-500 hover:text-slate-800 font-semibold gap-1"
                >
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Table */}
        <Card className="shadow-sm border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/70 border-b border-slate-100">
                <TableRow>
                  <TableHead className="font-bold text-slate-700 py-4 pl-6">Karyawan</TableHead>
                  <TableHead className="font-bold text-slate-700">Jenis</TableHead>
                  <TableHead className="font-bold text-slate-700">Tanggal Cuti</TableHead>
                  <TableHead className="font-bold text-slate-700">Durasi</TableHead>
                  <TableHead className="font-bold text-slate-700">Keterangan / Keperluan</TableHead>
                  <TableHead className="font-bold text-slate-700 text-center">Status</TableHead>
                  <TableHead className="font-bold text-slate-700 text-center pr-6">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                      Memuat data permohonan...
                    </TableCell>
                  </TableRow>
                ) : filteredLeaves.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                      Tidak ada pengajuan ijin/cuti yang ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeaves.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="py-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-600 border border-cyan-100 font-bold text-sm">
                            {item.karyawan?.namaLengkap?.charAt(0) || <User className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 leading-none mb-1">
                              {item.karyawan?.namaLengkap || "Karyawan"}
                            </p>
                            <p className="text-xs text-slate-400 font-medium">
                              NIK: {item.karyawan?.nik || "-"} • {item.karyawan?.jabatan || "-"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={
                            item.jenis === "CUTI" 
                              ? "bg-blue-50/50 text-blue-700 border-blue-200 font-semibold"
                              : item.jenis === "SAKIT"
                              ? "bg-rose-50/50 text-rose-700 border-rose-200 font-semibold"
                              : item.jenis === "IZIN"
                              ? "bg-amber-50/50 text-amber-700 border-amber-200 font-semibold"
                              : "bg-purple-50/50 text-purple-700 border-purple-200 font-semibold"
                          }
                        >
                          {item.jenis}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-slate-600">
                        {formatDate(item.tanggalMulai)} - {formatDate(item.tanggalSelesai)}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-700">
                        {item.jumlahHari} Hari
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        <p className="text-sm text-slate-600 line-clamp-2">{item.keterangan || "-"}</p>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          className={
                            item.status === "PENDING"
                              ? "bg-amber-100 text-amber-800 hover:bg-amber-100 font-black shadow-sm"
                              : item.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 font-black shadow-sm"
                              : "bg-rose-100 text-rose-800 hover:bg-rose-100 font-black shadow-sm"
                          }
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                       <TableCell className="text-center pr-6">
                        <div className="flex items-center justify-center gap-2">
                          <TooltipProvider>
                            {/* Button Detail */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() => {
                                    setSelectedLeave(item);
                                    setIsDetailOpen(true);
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="h-8 border-cyan-200 text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800 gap-1.5 px-3 rounded-md font-semibold transition-all duration-200"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>Detail</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-slate-800 text-white font-medium">
                                Lihat detail pengajuan lengkap
                              </TooltipContent>
                            </Tooltip>

                            {item.status === "PENDING" && (
                              <>
                                {/* Button Approve */}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      onClick={() => handleApprove(item)}
                                      variant="outline"
                                      size="sm"
                                      className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 gap-1.5 px-3 rounded-md font-semibold transition-all duration-200"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                      <span>Setujui</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-emerald-800 text-white font-medium">
                                    Setujui permohonan ijin/cuti ini
                                  </TooltipContent>
                                </Tooltip>

                                {/* Button Reject */}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      onClick={() => handleReject(item)}
                                      variant="outline"
                                      size="sm"
                                      className="h-8 border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 gap-1.5 px-3 rounded-md font-semibold transition-all duration-200"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                      <span>Tolak</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-rose-800 text-white font-medium">
                                    Tolak permohonan dengan alasan
                                  </TooltipContent>
                                </Tooltip>
                              </>
                            )}
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* ========================================================================= */}
        {/* DIALOG 1: DETAIL DIALOG */}
        {/* ========================================================================= */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-[550px] border-slate-100 shadow-xl rounded-xl">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-xl font-bold text-slate-800 uppercase flex items-center gap-2">
                📋 Detail Pengajuan Cuti / Ijin
              </DialogTitle>
              <DialogDescription>
                Tinjau informasi lengkap pengajuan permohonan ijin atau cuti karyawan.
              </DialogDescription>
            </DialogHeader>

            {selectedLeave && (
              <div className="space-y-6 py-4">
                {/* Profile summary */}
                <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-cyan-600 flex items-center justify-center text-white font-extrabold">
                    {selectedLeave.karyawan?.namaLengkap?.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-base leading-none mb-1">
                      {selectedLeave.karyawan?.namaLengkap}
                    </h4>
                    <p className="text-xs text-slate-400 font-medium">
                      NIK: {selectedLeave.karyawan?.nik || "-"} • {selectedLeave.karyawan?.jabatan || "-"}
                    </p>
                  </div>
                </div>

                {/* Details layout */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jenis Pengajuan</p>
                    <Badge variant="outline" className="bg-cyan-50 border-cyan-200 text-cyan-700 font-bold px-2 py-0.5">
                      {selectedLeave.jenis}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Durasi Pengajuan</p>
                    <p className="font-bold text-slate-800">{selectedLeave.jumlahHari} Hari Kerja</p>
                  </div>

                  <div className="space-y-1 col-span-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Periode Tanggal</p>
                    <p className="font-semibold text-slate-600 flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {formatDate(selectedLeave.tanggalMulai)} s/d {formatDate(selectedLeave.tanggalSelesai)}
                    </p>
                  </div>

                  <div className="space-y-1 col-span-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Keterangan / Keperluan</p>
                    <p className="text-sm text-slate-600 bg-slate-50/50 p-3 border border-slate-100 rounded-md whitespace-pre-line leading-relaxed">
                      {selectedLeave.keterangan || "-"}
                    </p>
                  </div>

                  {selectedLeave.bukti && (
                    <div className="space-y-2 col-span-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dokumen Lampiran (Bukti)</p>
                      <div className="flex items-center gap-2">
                        <Button 
                          asChild
                          variant="outline" 
                          size="sm" 
                          className="border-cyan-200 text-cyan-700 hover:bg-cyan-50 font-semibold gap-1.5"
                        >
                          <a 
                            href={`${process.env.NEXT_PUBLIC_API_URL}${selectedLeave.bukti}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <FileDown className="h-4 w-4" /> Download Lampiran
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Approval / Rejection details */}
                  {selectedLeave.status !== "PENDING" && (
                    <div className="col-span-2 border-t pt-4 mt-2 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Akhir</p>
                        <Badge 
                          className={
                            selectedLeave.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 font-extrabold shadow-sm"
                              : "bg-rose-100 text-rose-800 hover:bg-rose-100 font-extrabold shadow-sm"
                          }
                        >
                          {selectedLeave.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 font-medium">Diproses Oleh:</span>
                          <p className="font-semibold text-slate-600 mt-0.5">{selectedLeave.approvedBy || "-"}</p>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium">Tanggal Proses:</span>
                          <p className="font-semibold text-slate-600 mt-0.5">{formatDate(selectedLeave.approvedAt)}</p>
                        </div>
                      </div>

                      {selectedLeave.status === "REJECTED" && selectedLeave.rejectedReason && (
                        <div className="bg-rose-50/50 border border-rose-100 p-3 rounded-md mt-2">
                          <span className="text-xs font-bold text-rose-700 flex items-center gap-1 uppercase">
                            <AlertCircle className="h-3.5 w-3.5" /> Alasan Penolakan:
                          </span>
                          <p className="text-sm text-rose-600 mt-1 font-medium">{selectedLeave.rejectedReason}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter className="border-t pt-4">
              {selectedLeave?.status === "PENDING" && (
                <div className="flex gap-2 w-full justify-end">
                  <Button
                    onClick={() => {
                      setIsDetailOpen(false);
                      handleReject(selectedLeave);
                    }}
                    variant="outline"
                    className="border-rose-200 text-rose-700 hover:bg-rose-50 gap-1.5 font-semibold"
                  >
                    <X className="h-4 w-4" /> Tolak
                  </Button>
                  <Button
                    onClick={() => {
                      setIsDetailOpen(false);
                      handleApprove(selectedLeave);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-semibold"
                  >
                    <Check className="h-4 w-4" /> Setujui
                  </Button>
                </div>
              )}
              {selectedLeave?.status !== "PENDING" && (
                <Button 
                  onClick={() => setIsDetailOpen(false)}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-semibold"
                >
                  Tutup
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ========================================================================= */}
        {/* DIALOG 2: CONFIRM APPROVAL */}
        {/* ========================================================================= */}
        <Dialog open={isApproveConfirmOpen} onOpenChange={setIsApproveConfirmOpen}>
          <DialogContent className="sm:max-w-[420px] border-slate-100 shadow-xl rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-emerald-800 flex items-center gap-2">
                ✅ Setujui Pengajuan
              </DialogTitle>
              <DialogDescription className="pt-2">
                Apakah Anda yakin ingin menyetujui permohonan {selectedLeave?.jenis || "cuti"} dari{" "}
                <strong className="text-slate-800">{selectedLeave?.karyawan?.namaLengkap}</strong> selama{" "}
                <strong className="text-slate-800">{selectedLeave?.jumlahHari} Hari</strong>?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button
                disabled={isPending}
                onClick={() => setIsApproveConfirmOpen(false)}
                variant="outline"
                className="border-slate-200 font-semibold"
              >
                Batal
              </Button>
              <Button
                disabled={isPending}
                onClick={submitApprove}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
              >
                {isPending ? "Memproses..." : "Ya, Setujui"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ========================================================================= */}
        {/* DIALOG 3: REJECT REQUEST */}
        {/* ========================================================================= */}
        <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
          <DialogContent className="sm:max-w-[450px] border-slate-100 shadow-xl rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-rose-800 flex items-center gap-2">
                ❌ Tolak Pengajuan
              </DialogTitle>
              <DialogDescription className="pt-2">
                Tuliskan alasan penolakan permohonan {selectedLeave?.jenis || "cuti"} dari{" "}
                <strong className="text-slate-800">{selectedLeave?.karyawan?.namaLengkap}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Alasan Penolakan (Wajib)</p>
              <Textarea
                placeholder="Contoh: Kuota cuti divisi sudah penuh atau membutuhkan koordinasi lebih lanjut."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="border-slate-200 focus-visible:ring-rose-500 min-h-[100px]"
              />
            </div>

            <DialogFooter>
              <Button
                disabled={isPending}
                onClick={() => setIsRejectOpen(false)}
                variant="outline"
                className="border-slate-200 font-semibold"
              >
                Batal
              </Button>
              <Button
                disabled={isPending || !rejectReason.trim()}
                onClick={submitReject}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-1.5"
              >
                {isPending ? "Memproses..." : "Ya, Tolak"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    ),
  };

  return <AdminLayout {...layoutProps} />;
}
