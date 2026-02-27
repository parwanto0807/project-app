"use client";

import React, { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    MoreVertical,
    Plus,
    Search,
    FileText,
    FileDigit,
    Trash2,
    Calendar,
    AlertTriangle,
    User,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageLoading } from "@/components/ui/loading";
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
import axios from "axios";
import { format } from "date-fns";

export default function DocumentList({ role }: { role: string }) {
    const [documents, setDocuments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<any>(null);

    const fetchDocuments = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams(window.location.search);
            const departmentCode = params.get("department");
            const employeeId = params.get("employeeId");

            let url = `${process.env.NEXT_PUBLIC_API_URL}/api/master/documents`;
            const qParams = [];
            if (departmentCode) qParams.push(`departmentCode=${departmentCode}`);
            if (employeeId) qParams.push(`employeeId=${employeeId}`);

            if (qParams.length > 0) {
                url += `?${qParams.join("&")}`;
            }

            const response = await axios.get(url, { withCredentials: true });
            setDocuments(response.data);
        } catch (error) {
            console.error("Gagal mengambil data dokumen:", error);
            toast.error("Gagal mengambil data dokumen");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleDeleteClick = (doc: any) => {
        setDocumentToDelete(doc);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!documentToDelete) return;
        try {
            await axios.delete(
                `${process.env.NEXT_PUBLIC_API_URL}/api/master/documents/${documentToDelete.id}`,
                { withCredentials: true }
            );
            toast.success("Dokumen berhasil dihapus");
            setDocuments(documents.filter((d) => d.id !== documentToDelete.id));
        } catch (error) {
            toast.error("Gagal menghapus dokumen");
        } finally {
            setDeleteDialogOpen(false);
            setDocumentToDelete(null);
        }
    };

    const filteredDocuments = documents.filter((doc) =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "ACTIVE":
                return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">ACTIVE</Badge>;
            case "DRAFT":
                return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">DRAFT</Badge>;
            case "RETIRED":
                return <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">RETIRED</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (isLoading) return <PageLoading />;

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                        placeholder="Cari dokumen..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button asChild className="w-full md:w-auto flex items-center gap-2">
                    <Link href={role === "super" ? "/super-admin-area/master/documents/create" : "/admin-area/master/documents/create"}>
                        <Plus size={18} /> Buat Dokumen Baru
                    </Link>
                </Button>
            </div>

            <Card className="shadow-sm">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50">
                                    <TableHead className="w-[40%]">Judul Dokumen</TableHead>
                                    <TableHead>Tipe</TableHead>
                                    <TableHead>Penerima</TableHead>
                                    <TableHead>Versi</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Tgl Dibuat</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDocuments.length > 0 ? (
                                    filteredDocuments.map((doc) => (
                                        <TableRow key={doc.id} className="hover:bg-gray-50/50">
                                            <TableCell className="font-semibold">
                                                <div className="flex items-center gap-2">
                                                    <FileText size={18} className="text-primary/70" />
                                                    {doc.title}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-normal">
                                                    {doc.type === "JOB_DESCRIPTION" ? "Job Desk" : "SOP"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    {doc.departments.length > 0 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {doc.departments.map((d: any) => (
                                                                <Badge key={d.department.code} variant="outline" className="text-[10px] py-0 bg-blue-50/50">
                                                                    {d.department.code}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {doc.employees?.length > 0 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {doc.employees.map((e: any) => (
                                                                <Badge key={e.karyawan.id} variant="secondary" className="text-[10px] py-0 bg-orange-50 text-orange-700">
                                                                    <User size={10} className="mr-1" />
                                                                    {e.karyawan.namaLengkap}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {doc.departments.length === 0 && doc.employees?.length === 0 && (
                                                        <span className="text-gray-400 text-[10px] italic">Public</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>v{doc.version}</TableCell>
                                            <TableCell>{getStatusBadge(doc.status)}</TableCell>
                                            <TableCell className="text-xs text-gray-500">
                                                {format(new Date(doc.createdAt), "dd MMM yyyy")}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreVertical size={16} />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={role === "super" ? `/super-admin-area/master/documents/view/${doc.id}` : `/admin-area/master/documents/view/${doc.id}`} className="cursor-pointer">
                                                                <FileDigit size={16} className="mr-2 text-primary" /> View Details
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={role === "super" ? `/super-admin-area/master/documents/edit/${doc.id}` : `/admin-area/master/documents/edit/${doc.id}`} className="cursor-pointer">
                                                                <FileText size={16} className="mr-2 text-blue-500" /> Edit Dokumen
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDeleteClick(doc)} className="text-red-600 cursor-pointer">
                                                            <Trash2 size={16} className="mr-2" /> Hapus
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                                            Belum ada dokumen yang tersedia
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            Hapus Dokumen
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus dokumen <span className="font-bold">{documentToDelete?.title}</span>?
                            Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
