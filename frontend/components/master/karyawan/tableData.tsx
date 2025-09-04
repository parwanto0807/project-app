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
  Filter,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

interface TeamKaryawan {
  id: string;
  team: { id: string; namaTeam: string };
}

interface Karyawan {
  id: string;
  nik: string;
  namaLengkap: string;
  jabatan: string;
  departemen?: string;
  statusKerja: string;
  teamKaryawan: TeamKaryawan[];
  email?: string;
  tanggalBergabung?: string;
  noTelepon?: string;
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

  console.log("Role", role);
  // console.log("Data Karyawan", karyawan);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    const filteredData = karyawan.filter((item) => {
      const matchesSearch =
        item.nik.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.jabatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.departemen && item.departemen.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === "all" || item.statusKerja === statusFilter;

      return matchesSearch && matchesStatus;
    });

    if (sortConfig !== null) {
      // Create a new array to avoid mutating the original
      const sortedData = [...filteredData].sort((a, b) => {
        let aValue: string;
        let bValue: string;

        if (sortConfig.key === 'teamKaryawan') {
          aValue = a.teamKaryawan.map(tk => tk.team.namaTeam).join(', ');
          bValue = b.teamKaryawan.map(tk => tk.team.namaTeam).join(', ');
        } else {
          // For other keys, ensure we're working with strings
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
  }, [karyawan, searchTerm, sortConfig, statusFilter]);

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

  // Get sort icon
  const getSortIcon = (key: SortableKey) => {
    if (sortConfig && sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
    }
    return <Filter size={16} className="text-gray-400" />;
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

  // Mobile card view for employee
  const EmployeeCard = ({ employee }: { employee: Karyawan }) => {
    const isExpanded = expandedRows.has(employee.id);

    return (
      <Card className="mb-4 overflow-hidden">
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">{employee.namaLengkap}</h3>
                {getStatusBadge(employee.statusKerja)}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-blue-500" />
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
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/admin-area/karyawan/edit/${employee.id}`} className="flex items-center gap-2 cursor-pointer">
                    <Edit2 size={16} className="text-blue-500" /> Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/admin-area/karyawan/detail/${employee.id}`} className="flex items-center gap-2 cursor-pointer">
                    <FileDigit size={16} className="text-green-500" /> Detail
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-3 flex items-center justify-center gap-1"
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
          <div className="bg-blue-50 p-4 border-t">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <User size={16} className="text-blue-500" />
                  Informasi Pribadi
                </h4>
                <div className="text-sm space-y-2">
                  {employee.noTelepon && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-gray-500" />
                      <span>{employee.noTelepon}</span>
                    </div>
                  )}
                  {employee.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-gray-500" />
                      <span className="truncate">{employee.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Briefcase size={16} className="text-blue-500" />
                  Informasi Pekerjaan
                </h4>
                <div className="text-sm">
                  {employee.tanggalBergabung && (
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-500" />
                      <span>Bergabung: {employee.tanggalBergabung}</span>
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
        <div className="flex justify-between items-start mb-3">
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
    <Card className="rounded-t-2xl border bg-white dark:bg-gray-800 shadow-sm dark:border-gray-700 overflow-hidden">
      <CardContent className="p-2 md:p-4">
        {/* Search and Filter Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
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

          <Link href="/admin-area/master/karyawan/create">
            <Button className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2 w-full md:w-auto">
              <Plus size={18} />
              <span className="hidden md:inline">Tambah Karyawan</span>
              <span className="md:hidden">Tambah</span>
            </Button>
          </Link>
        </div>

        {/* Desktop Table View (hidden on mobile) */}
        <div className="hidden md:block rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-gray-700">
                <TableRow>
                  <TableHead className="w-12"></TableHead>
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
                        <TableRow className="hover:bg-gray-700 group">
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleRowExpansion(item.id)}
                              className="h-8 w-8"
                            >
                              {expandedRows.has(item.id) ? (
                                <ChevronUp size={16} />
                              ) : (
                                <ChevronDown size={16} />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium">{item.nik}</TableCell>
                          <TableCell>
                            <div className="font-semibold">{item.namaLengkap}</div>
                            {item.email && (
                              <div className="text-sm text-gray-500 truncate max-w-[150px]">
                                {item.email}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{item.jabatan}</TableCell>
                          <TableCell>{item.departemen || "-"}</TableCell>
                          <TableCell>{getStatusBadge(item.statusKerja)}</TableCell>
                          <TableCell>
                            {item.teamKaryawan.length > 0
                              ? item.teamKaryawan.map((tk) => tk.team.namaTeam).join(", ")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreVertical size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin-area/karyawan/edit/${item.id}`} className="flex items-center gap-2 cursor-pointer">
                                    <Edit2 size={16} className="text-blue-500" /> Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin-area/karyawan/detail/${item.id}`} className="flex items-center gap-2 cursor-pointer">
                                    <FileDigit size={16} className="text-green-500" /> Detail
                                  </Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                        {expandedRows.has(item.id) && (
                          <TableRow className="bg-gray-900">
                            <TableCell colSpan={8}>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <User size={16} className="text-blue-500" />
                                    Informasi Pribadi
                                  </h4>
                                  <div className="text-sm">
                                    <div className="flex justify-between py-1 border-b">
                                      <span className="text-gray-500">NIK:</span>
                                      <span className="font-medium">{item.nik}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b">
                                      <span className="text-gray-500">Telepon:</span>
                                      <span className="font-medium">{item.noTelepon || "-"}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b">
                                      <span className="text-gray-500">Email:</span>
                                      <span className="font-medium">{item.email || "-"}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <Briefcase size={16} className="text-blue-500" />
                                    Informasi Pekerjaan
                                  </h4>
                                  <div className="text-sm">
                                    <div className="flex justify-between py-1 border-b">
                                      <span className="text-gray-500">Jabatan:</span>
                                      <span className="font-medium">{item.jabatan}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b">
                                      <span className="text-gray-500">Departemen:</span>
                                      <span className="font-medium">{item.departemen || "-"}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b">
                                      <span className="text-gray-500">Bergabung:</span>
                                      <span className="font-medium">{item.tanggalBergabung || "-"}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <Users size={16} className="text-blue-500" />
                                    Team
                                  </h4>
                                  <div className="text-sm">
                                    {item.teamKaryawan.length > 0 ? (
                                      <ul className="list-disc list-inside">
                                        {item.teamKaryawan.map((tk, index) => (
                                          <li key={index} className="py-1 border-b">
                                            {tk.team.namaTeam}
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p className="text-gray-500">Tidak ada team</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))
                    : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          <div className="flex flex-col items-center justify-center">
                            <Search size={48} className="text-gray-300 mb-4" />
                            <p className="text-lg font-medium">Tidak ada data yang ditemukan</p>
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
                <div className="text-center py-8 text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <Search size={48} className="text-gray-300 mb-4" />
                    <p className="text-lg font-medium">Tidak ada data yang ditemukan</p>
                    <p className="text-sm">Coba ubah kata kunci pencarian atau filter</p>
                  </div>
                </div>
              )}
        </div>

        {/* Pagination */}
        {filteredAndSortedData.length > 0 && (
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
        )}
      </CardContent>
    </Card>
  );
};