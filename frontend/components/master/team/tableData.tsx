'use client';

import { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Card,
    CardContent,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Plus,
    Search,
    Filter,
    ChevronDown,
    Users,
    User,
    Calendar,
    Edit,
    Trash2,
    AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
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
import { toast } from "sonner";

// Interface yang sesuai dengan struktur data Anda
interface KaryawanDetail {
    id: string;
    namaLengkap: string;
    departemen: string;
    // tambahkan properti lain jika diperlukan
}

interface TeamKaryawan {
    id: string;
    karyawanId: string;
    teamId: string;
    karyawan: KaryawanDetail;
}

interface Team {
    id: string;
    namaTeam: string;
    deskripsi: string;
    karyawan: TeamKaryawan[]; // Array of TeamKaryawan, bukan langsung Karyawan
    createdAt: string;
    updatedAt: string;
}

interface TeamTableDataProps {
    teams: Team[];
    role: string;
    isLoading: boolean;
}

export default function TeamTableData({ teams, role, isLoading }: TeamTableDataProps) {
    const [data, setData] = useState<Team[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [filteredData, setFilteredData] = useState<Team[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Update data when teams prop changes
    useEffect(() => {
        if (teams && Array.isArray(teams)) {
            setData(teams);
            setFilteredData(teams);
        }
    }, [teams]);

    // Handle search
    useEffect(() => {
        if (data && Array.isArray(data)) {
            const results = data.filter(team =>
                team.namaTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (team.karyawan && team.karyawan.some(k =>
                    k.karyawan && k.karyawan.namaLengkap &&
                    k.karyawan.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase())
                ))
            );
            setFilteredData(results);
            setCurrentPage(1); // Reset to first page on search
        }
    }, [searchTerm, data]);

    // Fungsi untuk membuka dialog konfirmasi hapus
    const handleDeleteClick = (team: Team) => {
        setTeamToDelete(team);
        setDeleteDialogOpen(true);
    };

    // Fungsi untuk menghapus team
    const handleDeleteConfirm = async () => {
        if (!teamToDelete) return;
        
        setIsDeleting(true);
        try {
            // Panggil API untuk menghapus team
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/team/deleteTeam/${teamToDelete.id}`, {
                method: 'DELETE',
            });
            
            if (response.ok) {
                // Hapus team dari state
                setData(prev => prev.filter(team => team.id !== teamToDelete.id));
                setFilteredData(prev => prev.filter(team => team.id !== teamToDelete.id));
                
                // Tampilkan notifikasi sukses
                toast.success("Team berhasil dihapus", {
                    description: `Team "${teamToDelete.namaTeam}" telah dihapus.`
                });
            } else {
                throw new Error("Gagal menghapus team");
            }
        } catch (error) {
            console.error("Error deleting team:", error);
            toast.error("Gagal menghapus team", {
                description: "Terjadi kesalahan saat menghapus team. Silakan coba lagi."
            });
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
            setTeamToDelete(null);
        }
    };

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    // Check if user has permission to create teams
    const canCreateTeam = role === 'admin' || role === 'manager';

    // Generate page numbers for pagination
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    return (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-2 md:p-2">
            <Card className="shadow-lg border-0 ">
                <CardContent className="p-5">
                    {/* Search and Filter Section */}
                    <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 mb-6">
                        <div className="relative w-full md:w-1/3">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                type="search"
                                placeholder="Cari team atau anggota..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex space-x-2 w-full md:w-auto">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full md:w-auto">
                                        <Filter className="mr-2 h-4 w-4" /> Filter
                                        <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuCheckboxItem>
                                        Frontend Development
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem>
                                        Backend Development
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem>
                                        Mobile Development
                                    </DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Items per page dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full md:w-auto">
                                        {itemsPerPage} Items
                                        <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setItemsPerPage(5)}>
                                        5 Items
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setItemsPerPage(10)}>
                                        10 Items
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setItemsPerPage(20)}>
                                        20 Items
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setItemsPerPage(50)}>
                                        50 Items
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <div className="flex space-x-2 items-center justify-end">
                                {canCreateTeam && (
                                    <Link href="/admin-area/master/team/create" className="group"> {/* ✅ Ganti route */}
                                        <Button
                                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 px-4 md:px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-2 w-full md:w-auto"
                                            aria-label="Tambah Team Baru"
                                        >
                                            <Plus size={18} className="transition-transform duration-300 group-hover:rotate-90" />
                                            <span className="hidden md:inline">Tambah Team</span> {/* ✅ Ganti teks */}
                                            <span className="md:hidden">Tambah</span>
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="rounded-md border ">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-white dark:bg-gray-800 shadow-sm dark:border-gray-700">
                                    <TableHead className="font-semibold">Nama Team</TableHead>
                                    <TableHead className="font-semibold">Anggota Team</TableHead>
                                    <TableHead className="font-semibold">Dibuat Pada</TableHead>
                                    {(role === 'admin' || role === 'manager') && (
                                        <TableHead className="font-semibold text-right">Aksi</TableHead>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    // Skeleton loading state
                                    Array.from({ length: itemsPerPage }).map((_, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Skeleton className="h-4 w-[200px]" />
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-[250px]" />
                                                    <Skeleton className="h-4 w-[200px]" />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-[150px]" />
                                            </TableCell>
                                            {(role === 'admin' || role === 'manager') && (
                                                <TableCell className="text-right">
                                                    <Skeleton className="h-8 w-8 ml-auto" />
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                ) : currentItems.length > 0 ? (
                                    currentItems.map((team) => (
                                        <TableRow key={team.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <TableCell className="font-medium">
                                                <div className="flex items-center">
                                                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg mr-3">
                                                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    {team.namaTeam}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-2"> {/* Ubah dari flex-wrap ke flex-col */}
                                                    {team.karyawan && team.karyawan.length > 0 ? (
                                                        team.karyawan.map((teamKaryawan) => (
                                                            teamKaryawan.karyawan && (
                                                                <div
                                                                    key={teamKaryawan.id}
                                                                    className="inline-flex items-center bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm px-3 py-1 rounded-full"
                                                                >
                                                                    <User className="h-3.5 w-3.5 mr-1" />
                                                                    {teamKaryawan.karyawan.namaLengkap} - {teamKaryawan.karyawan.departemen}
                                                                </div>
                                                            )
                                                        ))
                                                    ) : (
                                                        <span className="text-gray-500 dark:text-gray-400 text-sm">
                                                            Tidak ada anggota
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                    <Calendar className="h-4 w-4 mr-1" />
                                                    {new Date(team.createdAt).toLocaleDateString('id-ID')}
                                                </div>
                                            </TableCell>
                                            {(role === 'admin' || role === 'manager') && (
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <Button variant="outline" size="icon" asChild>
                                                            <Link href={`/admin-area/master/team/update/${team.id}`}>
                                                                <Edit className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button 
                                                            variant="outline" 
                                                            size="icon" 
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleDeleteClick(team)}
                                                            disabled={isDeleting}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={role === 'admin' || role === 'manager' ? 4 : 3}
                                            className="h-24 text-center"
                                        >
                                            Tidak ada data ditemukan.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Section */}
                    {!isLoading && filteredData.length > 0 && (
                        <div className="flex flex-col md:flex-row items-center justify-between mt-6 space-y-4 md:space-y-0">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Menampilkan {indexOfFirstItem + 1} hingga {Math.min(indexOfLastItem, filteredData.length)} dari {filteredData.length} entri
                            </div>

                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setCurrentPage(prev => Math.max(prev - 1, 1));
                                            }}
                                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                                        />
                                    </PaginationItem>

                                    {startPage > 1 && (
                                        <PaginationItem>
                                            <PaginationLink
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setCurrentPage(1);
                                                }}
                                            >
                                                1
                                            </PaginationLink>
                                        </PaginationItem>
                                    )}

                                    {startPage > 2 && (
                                        <PaginationItem>
                                            <span className="px-2">...</span>
                                        </PaginationItem>
                                    )}

                                    {pageNumbers.map(page => (
                                        <PaginationItem key={page}>
                                            <PaginationLink
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setCurrentPage(page);
                                                }}
                                                isActive={currentPage === page}
                                            >
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>
                                    ))}

                                    {endPage < totalPages - 1 && (
                                        <PaginationItem>
                                            <span className="px-2">...</span>
                                        </PaginationItem>
                                    )}

                                    {endPage < totalPages && (
                                        <PaginationItem>
                                            <PaginationLink
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setCurrentPage(totalPages);
                                                }}
                                            >
                                                {totalPages}
                                            </PaginationLink>
                                        </PaginationItem>
                                    )}

                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setCurrentPage(prev => Math.min(prev + 1, totalPages));
                                            }}
                                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialog Konfirmasi Hapus */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            Hapus Team
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus team <span className="font-semibold text-foreground">{teamToDelete?.namaTeam}</span>?
                            Tindakan ini tidak dapat dibatalkan dan semua data team akan dihapus secara permanen.
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
        </div>
    );
}