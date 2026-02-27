"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Edit2,
  FileDigit,
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  User,
  Briefcase,
  Building,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Hash,
  ChevronsUpDown,
  FileText,
  Shield,
  BookOpen,
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { makeImageSrc } from "@/utils/makeImageSrc";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

interface TeamKaryawan {
  id: string;
  team: { id: string; namaTeam: string };
}

interface Document {
  id: string;
  title: string;
  type: string;
  version: number;
}

interface DocumentKaryawan {
  documentId: string;
  karyawanId: string;
  document: Document;
}

interface Karyawan {
  id: string;
  nik: string;
  namaLengkap: string;
  jabatan: string;
  departemen?: string;
  statusKerja: string;
  teamKaryawan: TeamKaryawan[];
  documents?: DocumentKaryawan[];
  email?: string;
  tanggalBergabung?: string;
  nomorTelepon?: string;
  foto?: string;
  alamat?: string;
  tanggalLahir?: string;
  jenisKelamin?: string;
}

interface EmployeeTableProps {
  karyawan: Karyawan[];
  isLoading: boolean;
  role: string;
}

type SortableKey = keyof Pick<Karyawan, 'nik' | 'namaLengkap' | 'jabatan' | 'departemen' | 'statusKerja'> | 'teamKaryawan';

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  karyawan,
  isLoading,
  role,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: 'asc' | 'desc' } | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  // Tambahkan state untuk delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Karyawan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [data, setData] = useState<Karyawan[]>([]);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // const router = useRouter();

  React.useEffect(() => {
    if (karyawan && Array.isArray(karyawan)) {
      setData(karyawan);
    }
  }, [karyawan]);

  // Fungsi untuk membuka dialog konfirmasi hapus
  const handleDeleteClick = (employee: Karyawan, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setEmployeeToDelete(employee);
    setDeleteDialogOpen(true);
  };

  // Fungsi untuk menghapus karyawan
  // Fungsi untuk menghapus karyawan
  const handleDeleteConfirm = async () => {
    if (!employeeToDelete) return;

    setIsDeleting(true);
    try {
      // Panggil API untuk menghapus karyawan
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/karyawan/deleteKaryawan/${employeeToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Hapus karyawan dari state lokal
        setData(prev => {
          const newData = prev.filter(emp => emp.id !== employeeToDelete.id);

          // Reset pagination jika hanya ada 1 item di halaman saat ini
          if (newData.length <= (currentPage - 1) * itemsPerPage) {
            setCurrentPage(prevPage => Math.max(prevPage - 1, 1));
          }

          return newData;
        });

        // Tampilkan notifikasi sukses
        toast.success("Karyawan berhasil dihapus");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal menghapus karyawan");
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast.error("Gagal menghapus karyawan", {
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat menghapus karyawan. Silakan coba lagi."
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    }
  };

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    const filteredData = data.filter((item) => {
      const matchesSearch =
        item.nik.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.jabatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.departemen && item.departemen.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === "all" || item.statusKerja === statusFilter;

      return matchesSearch && matchesStatus;
    });

    if (sortConfig !== null) {
      const sortedData = [...filteredData].sort((a, b) => {
        let aValue: string;
        let bValue: string;

        if (sortConfig.key === 'teamKaryawan') {
          aValue = a.teamKaryawan.map(tk => tk.team.namaTeam).join(', ');
          bValue = b.teamKaryawan.map(tk => tk.team.namaTeam).join(', ');
        } else {
          aValue = String(a[sortConfig.key] || '');
          bValue = String(b[sortConfig.key] || '');
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });

      return sortedData;
    }

    return filteredData;
  }, [data, searchTerm, sortConfig, statusFilter]); // Pastikan menggunakan 'data' bukan 'karyawan'

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);

  // Handle sort
  const handleSort = (key: SortableKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Toggle row expansion
  const toggleRowExpansion = (id: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(id)) {
      newExpandedRows.delete(id);
    } else {
      newExpandedRows.add(id);
    }
    setExpandedRows(newExpandedRows);
  };

  // Handle row click
  const handleRowClick = (id: string, e: React.MouseEvent) => {
    // Prevent expansion when clicking on actions (dropdown menu)
    if ((e.target as HTMLElement).closest('button, a, [role="menuitem"]')) {
      return;
    }
    toggleRowExpansion(id);
  };

  // Get sort icon
  const getSortIcon = (key: SortableKey) => {
    if (sortConfig && sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
    }
    return <ChevronsUpDown size={16} className="text-gray-400" />;
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aktif":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 flex items-center gap-1"><CheckCircle size={14} /> Aktif</Badge>;
      case "cuti":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 flex items-center gap-1"><Clock size={14} /> Cuti</Badge>;
      default:
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle size={14} /> Non-Aktif</Badge>;
    }
  };

  // Get avatar fallback initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Mobile card view for employee
  const EmployeeCard = ({ employee }: { employee: Karyawan }) => {
    const isExpanded = expandedRows.has(employee.id);

    return (
      <Card className="mb-4 overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-2">
          <div className="flex items-start gap-2">
            <Avatar className="h-12 w-12 border">
              <AvatarImage
                src={makeImageSrc(employee.foto)}
                alt={employee.namaLengkap}
                crossOrigin="anonymous"
                className="object-cover"
              />
              <AvatarFallback className="bg-blue-100 text-blue-800">
                {getInitials(employee.namaLengkap)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">{employee.namaLengkap}</h3>
                {getStatusBadge(employee.statusKerja)}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Hash size={14} className="text-blue-500" />
                  <span className="font-medium">NIK:</span>
                  <span>{employee.nik}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Briefcase size={14} className="text-blue-500" />
                  <span className="font-medium">Jabatan:</span>
                  <span>{employee.jabatan}</span>
                </div>

                {employee.departemen && (
                  <div className="flex items-center gap-2">
                    <Building size={14} className="text-blue-500" />
                    <span className="font-medium">Dept:</span>
                    <span>{employee.departemen}</span>
                  </div>
                )}

                {employee.teamKaryawan.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Users size={14} className="text-blue-500 mt-0.5" />
                    <span className="font-medium">Team:</span>
                    <span>{employee.teamKaryawan.map(tk => tk.team.namaTeam).join(", ")}</span>
                  </div>
                )}

                {employee.documents && employee.documents.length > 0 && (
                  <div className="flex items-start gap-2">
                    <FileText size={14} className="text-blue-500 mt-0.5" />
                    <span className="font-medium">Docs:</span>
                    <div className="flex flex-wrap gap-1">
                      {[...employee.documents].sort((a, b) => {
                        if (a.document.type === "JOB_DESCRIPTION" && b.document.type !== "JOB_DESCRIPTION") return -1;
                        if (a.document.type !== "JOB_DESCRIPTION" && b.document.type === "JOB_DESCRIPTION") return 1;
                        return 0;
                      }).map((dk) => (
                        <Badge
                          key={dk.document.id}
                          variant="outline"
                          className={cn(
                            "text-[10px] py-0 px-1.5 h-4",
                            dk.document.type === "JOB_DESCRIPTION"
                              ? "bg-cyan-50 text-cyan-700 border-cyan-100"
                              : "bg-indigo-50 text-indigo-700 border-indigo-100"
                          )}
                        >
                          {dk.document.type === "JOB_DESCRIPTION" ? "JD" : "SOP"} v{dk.document.version}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 min-w-[100px]">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 h-8 gap-1 px-3 text-xs font-bold transition-all"
              >
                <Link href={`/admin-area/karyawan/edit/${employee.id}`}>
                  <Edit2 size={14} className="text-blue-500" /> Edit
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 h-8 gap-1 px-3 text-xs font-bold transition-all"
              >
                <Link href={`/admin-area/master/documents?department=${employee.departemen || ""}&employeeId=${employee.id}`}>
                  <FileText size={14} className="text-orange-500" /> JobDesk
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0 self-end" onClick={(e) => e.stopPropagation()}>
                    <MoreVertical size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="#" className="flex items-center gap-2 cursor-pointer">
                      <FileDigit size={16} className="text-green-500" /> Detail
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => handleDeleteClick(employee, e)} className="text-red-600 cursor-pointer">
                    <XCircle size={16} className="mr-2" /> Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-3 flex items-center justify-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700"
            onClick={() => toggleRowExpansion(employee.id)}
          >
            {isExpanded ? (
              <>
                <ChevronUp size={14} /> Sembunyikan Detail
              </>
            ) : (
              <>
                <ChevronDown size={14} /> Lihat Detail
              </>
            )}
          </Button>
        </div>

        {isExpanded && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 border-t">
            <div className="flex flex-col items-center mb-4">
              <Avatar className="h-24 w-24 border-2 border-white shadow-md mb-3">
                <AvatarImage
                  src={makeImageSrc(employee.foto)}
                  alt={employee.namaLengkap}
                  crossOrigin="anonymous"
                  className="object-cover"
                />
                <AvatarFallback className="bg-blue-100 text-blue-800 text-xl">
                  {getInitials(employee.namaLengkap)}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-bold text-xl text-center">{employee.namaLengkap}</h3>
              <p className="text-gray-600 text-center">{employee.jabatan}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <User size={16} className="text-blue-500" />
                  Informasi Pribadi
                </h4>
                <div className="text-sm space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-md">
                    <Hash size={14} className="text-blue-500" />
                    <span className="font-medium">NIK:</span>
                    <span>{employee.nik}</span>
                  </div>

                  {employee.tanggalLahir && (
                    <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-md">
                      <Calendar size={14} className="text-blue-500" />
                      <span className="font-medium">Tanggal Lahir:</span>
                      <span>{formatDate(employee.tanggalLahir)}</span>
                    </div>
                  )}

                  {employee.jenisKelamin && (
                    <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-md">
                      <User size={14} className="text-blue-500" />
                      <span className="font-medium">Jenis Kelamin:</span>
                      <span>{employee.jenisKelamin}</span>
                    </div>
                  )}

                  {employee.nomorTelepon && (
                    <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-md">
                      <Phone size={14} className="text-blue-500" />
                      <span className="font-medium">Telepon:</span>
                      <span>{employee.nomorTelepon}</span>
                    </div>
                  )}

                  {employee.email && (
                    <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-md">
                      <Mail size={14} className="text-blue-500" />
                      <span className="font-medium">Email:</span>
                      <span className="truncate">{employee.email}</span>
                    </div>
                  )}

                  {employee.alamat && (
                    <div className="flex items-start gap-2 p-2 bg-white dark:bg-gray-800 rounded-md">
                      <MapPin size={14} className="text-blue-500 mt-0.5" />
                      <span className="font-medium">Alamat:</span>
                      <span className="flex-1">{employee.alamat}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <Briefcase size={16} className="text-blue-500" />
                  Informasi Pekerjaan
                </h4>
                <div className="text-sm space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-md">
                    <Briefcase size={14} className="text-blue-500" />
                    <span className="font-medium">Jabatan:</span>
                    <span>{employee.jabatan}</span>
                  </div>

                  {employee.departemen && (
                    <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-md">
                      <Building size={14} className="text-blue-500" />
                      <span className="font-medium">Departemen:</span>
                      <span>{employee.departemen}</span>
                    </div>
                  )}

                  {employee.tanggalBergabung && (
                    <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-md">
                      <Calendar size={14} className="text-blue-500" />
                      <span className="font-medium">Bergabung:</span>
                      <span>{formatDate(employee.tanggalBergabung)}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-md">
                    <CheckCircle size={14} className="text-blue-500" />
                    <span className="font-medium">Status:</span>
                    {getStatusBadge(employee.statusKerja)}
                  </div>

                  {employee.teamKaryawan.length > 0 && (
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-md">
                      <div className="flex items-center gap-2 mb-1">
                        <Users size={14} className="text-blue-500" />
                        <span className="font-medium">Team:</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {employee.teamKaryawan.map((tk, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            {tk.team.namaTeam}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    );
  };

  // Mobile skeleton loading
  const MobileSkeleton = () => (
    <Card className="mb-4 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <Skeleton className="h-8 w-full mt-3 rounded-md" />
      </div>
    </Card>
  );

  return (
    <div>
      <CardContent className="p-2 md:p-0">
        {isMobile ? (
          <div>
            <CardHeader className="flex flex-col gap-4 bg-gradient-to-r from-cyan-600 to-purple-600 p-4 rounded-2xl text-white shadow-lg">
              <div className="flex flex-col space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Karyawan Management</CardTitle>
                    <p className="text-sm text-white/90">
                      Manage all karyawan
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>

            <div className="flex flex-col md:flex-row gap-4 my-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Cari berdasarkan NIK, nama, jabatan, atau departemen..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="cuti">Cuti</SelectItem>
                  <SelectItem value="non-aktif">Non-Aktif</SelectItem>
                </SelectContent>
              </Select>

              <Link href="/admin-area/master/karyawan/create" className="group">
                <Button
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 px-4 md:px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-2 w-full md:w-auto"
                  aria-label="Tambah Karyawan Baru"
                >
                  <Plus size={18} className="transition-transform duration-300 group-hover:rotate-90" />
                  <span className="hidden md:inline">Tambah Karyawan</span>
                  <span className="md:hidden">Tambah</span>
                </Button>
              </Link>
            </div>
          </div>
        ) : (

          <CardHeader className="bg-gradient-to-r from-cyan-600 to-purple-600 p-6 rounded-t-2xl text-white mb-6">
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center h-14 w-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">Karyawan Management</CardTitle>
                  <p className="text-sm text-white/90">
                    Manage all karyawan
                  </p>
                </div>
              </div>
              <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    placeholder="Cari berdasarkan NIK, nama, jabatan, atau departemen..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="aktif">Aktif</SelectItem>
                    <SelectItem value="cuti">Cuti</SelectItem>
                    <SelectItem value="non-aktif">Non-Aktif</SelectItem>
                  </SelectContent>
                </Select>

                <Link href="/admin-area/master/karyawan/create" className="group">
                  <Button
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 px-4 md:px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-2 w-full md:w-auto"
                    aria-label="Tambah Karyawan Baru"
                  >
                    <Plus size={18} className="transition-transform duration-300 group-hover:rotate-90" />
                    <span className="hidden md:inline">Tambah Karyawan</span>
                    <span className="md:hidden">Tambah</span>
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>

        )}

        {/* Desktop Table View (hidden on mobile) */}
        <div className="hidden md:block rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-gray-700">
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-200 hover:dark:bg-gray-600"
                    onClick={() => handleSort('nik')}
                  >
                    <div className="flex items-center gap-1">
                      <User size={16} className="text-blue-500" />
                      NIK
                      {getSortIcon('nik')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-200 hover:dark:bg-gray-600"
                    onClick={() => handleSort('namaLengkap')}
                  >
                    <div className="flex items-center gap-1">
                      Nama Lengkap
                      {getSortIcon('namaLengkap')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-200 hover:dark:bg-gray-600"
                    onClick={() => handleSort('jabatan')}
                  >
                    <div className="flex items-center gap-1">
                      <Briefcase size={16} className="text-blue-500" />
                      Jabatan
                      {getSortIcon('jabatan')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-200 hover:dark:bg-gray-600"
                    onClick={() => handleSort('departemen')}
                  >
                    <div className="flex items-center gap-1">
                      <Building size={16} className="text-blue-500" />
                      Departemen
                      {getSortIcon('departemen')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-200 hover:dark:bg-gray-600"
                    onClick={() => handleSort('statusKerja')}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      {getSortIcon('statusKerja')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-200 hover:dark:bg-gray-600"
                    onClick={() => handleSort('teamKaryawan')}
                  >
                    <div className="flex items-center gap-1">
                      <Users size={16} className="text-blue-500" />
                      Team
                      {getSortIcon('teamKaryawan')}
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <FileText size={16} className="text-blue-500" />
                      JobDesc & SOP
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8}>
                        <div className="flex items-center space-x-4 py-3">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                  : currentItems.length > 0
                    ? currentItems.map((item) => (
                      <React.Fragment key={item.id}>
                        <TableRow
                          className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${expandedRows.has(item.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                          onClick={(e) => handleRowClick(item.id, e)}
                        >
                          <TableCell className="font-medium">{item.nik}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 border">
                                <AvatarImage
                                  src={makeImageSrc(item.foto)}
                                  alt={item.namaLengkap}
                                  crossOrigin="anonymous"
                                  className="object-cover"
                                />
                                <AvatarFallback className="bg-blue-100 text-blue-800">
                                  {getInitials(item.namaLengkap)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-semibold">{item.namaLengkap}</div>
                                {item.email && (
                                  <div className="text-sm text-gray-500 truncate max-w-[150px]">
                                    {item.email}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{item.jabatan}</TableCell>
                          <TableCell>{item.departemen || "-"}</TableCell>
                          <TableCell>{getStatusBadge(item.statusKerja)}</TableCell>
                          <TableCell>
                            {item.teamKaryawan.length > 0
                              ? (
                                <div className="flex flex-wrap gap-1">
                                  {item.teamKaryawan.slice(0, 2).map((tk, index) => (
                                    <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                      {tk.team.namaTeam}
                                    </Badge>
                                  ))}
                                  {item.teamKaryawan.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{item.teamKaryawan.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              )
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                              {item.documents && item.documents.length > 0 ? (
                                [...item.documents].sort((a, b) => {
                                  if (a.document.type === "JOB_DESCRIPTION" && b.document.type !== "JOB_DESCRIPTION") return -1;
                                  if (a.document.type !== "JOB_DESCRIPTION" && b.document.type === "JOB_DESCRIPTION") return 1;
                                  return 0;
                                }).map((dk) => (
                                  <TooltipProvider key={dk.document.id}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge
                                          variant="outline"
                                          className={cn(
                                            "cursor-help font-bold text-[10px] px-2 py-0.5 rounded-md shadow-none flex items-center gap-1 transition-all hover:scale-105",
                                            dk.document.type === "JOB_DESCRIPTION"
                                              ? "bg-cyan-50 text-cyan-700 border-cyan-200/60"
                                              : "bg-indigo-50 text-indigo-700 border-indigo-200/60"
                                          )}
                                        >
                                          {dk.document.type === "JOB_DESCRIPTION" ? <Shield size={10} /> : <BookOpen size={10} />}
                                          <span>{dk.document.type === "JOB_DESCRIPTION" ? "JD" : "SOP"}</span>
                                          <span className="opacity-50 mx-0.5">|</span>
                                          <span>v{dk.document.version}</span>
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="bg-gray-900 text-white text-[10px] font-bold border-none">
                                        {dk.document.title}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ))
                              ) : (
                                <span className="text-[11px] text-gray-400 italic flex items-center gap-1">
                                  <Info size={12} /> Belum ada data
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                title="Edit Karyawan"
                                className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 h-8 gap-1 px-2 text-xs font-semibold transition-all"
                              >
                                <Link href={`/admin-area/master/karyawan/update/${item.id}`}>
                                  <Edit2 size={14} className="text-blue-500" />
                                  <span>Edit</span>
                                </Link>
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                title="Lihat Daftar Dokumen"
                                className="bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 h-8 gap-1 px-2 text-xs font-semibold transition-all"
                              >
                                <Link href={`/admin-area/master/documents?department=${item.departemen || ""}&employeeId=${item.id}&employeeName=${encodeURIComponent(item.namaLengkap)}`}>
                                  <FileText size={14} className="text-orange-500" />
                                  <span>Daftar</span>
                                </Link>
                              </Button>

                              {(() => {
                                // Find the first JOB_DESCRIPTION document
                                const jobDescDoc = item.documents?.find((d: DocumentKaryawan) => d.document?.type === 'JOB_DESCRIPTION')?.document;
                                if (jobDescDoc) {
                                  return (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      asChild
                                      title="Download Job Description PDF"
                                      className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 h-8 gap-1 px-2 text-xs font-semibold transition-all"
                                    >
                                      <Link href={`/admin-area/master/documents/view/${jobDescDoc.id}?employeeId=${item.id}&employeeName=${encodeURIComponent(item.namaLengkap)}`}>
                                        <FileDigit size={14} className="text-green-500" />
                                        <span>Job Desc PDF </span>
                                      </Link>
                                    </Button>
                                  );
                                }
                                return (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled
                                    title="Belum ada Job Description"
                                    className="bg-gray-50 text-gray-400 border-gray-200 h-8 gap-1 px-2 text-xs font-semibold opacity-50 cursor-not-allowed"
                                  >
                                    <FileDigit size={14} className="text-gray-400" />
                                    <span>Download</span>
                                  </Button>
                                );
                              })()}

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => handleDeleteClick(item, e)}
                                title="Hapus Karyawan"
                                className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 h-8 gap-1 px-2 text-xs font-semibold transition-all"
                              >
                                <XCircle size={14} className="text-red-500" />
                                <span>Hapus</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))
                    : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                          <div className="flex flex-col items-center justify-center">
                            <Search size={64} className="text-gray-300 mb-4" />
                            <p className="text-lg font-medium mb-2">Tidak ada data yang ditemukan</p>
                            <p className="text-sm">Coba ubah kata kunci pencarian atau filter</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Mobile Card View (visible only on mobile) */}
        <div className="md:hidden">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <MobileSkeleton key={i} />)
            : currentItems.length > 0
              ? currentItems.map((item) => <EmployeeCard key={item.id} employee={item} />)
              : (
                <div className="text-center py-12 text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <Search size={64} className="text-gray-300 mb-4" />
                    <p className="text-lg font-medium mb-2">Tidak ada data yang ditemukan</p>
                    <p className="text-sm">Coba ubah kata kunci pencarian atau filter</p>
                  </div>
                </div>
              )}
        </div>

        {/* Pagination */}
        {
          filteredAndSortedData.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <div className="text-sm text-gray-500">
                Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredAndSortedData.length)} dari {filteredAndSortedData.length} hasil
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Baris per halaman:</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[70px]">
                      <SelectValue placeholder="10" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={16} />
                  </Button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="icon"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-10 h-10 hidden sm:flex"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </div>
          )
        }
        <div className="text-sm text-gray-500">
          <h4>Role : {role}</h4>
        </div>
      </CardContent>
      {/* Dialog Konfirmasi Hapus */}
      {/* Dialog Konfirmasi Hapus */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Hapus Karyawan
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                Apakah Anda yakin ingin menghapus karyawan <span className="font-semibold text-foreground">{employeeToDelete?.namaLengkap}</span>?
                Tindakan ini tidak dapat dibatalkan dan semua data karyawan akan dihapus secara permanen.
                {employeeToDelete?.teamKaryawan && employeeToDelete.teamKaryawan.length > 0 && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
                    <p className="text-sm font-medium">Peringatan:</p>
                    <p className="text-xs">Karyawan ini merupakan anggota dari {employeeToDelete.teamKaryawan.length} team. Penghapusan akan menghapus semua relasi team.</p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  );
};