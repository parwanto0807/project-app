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
    Search,
    Plus,
    FileText,
    Trash2,
    User,
    Eye,
    Pencil,
    Shield,
    BookOpen,
    AlertTriangle,
    Activity,
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Card,
    CardContent,
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
import { cn } from "@/lib/utils";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

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
                return (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200/60 font-medium px-2 shadow-sm uppercase tracking-wider text-[10px]">
                        ACTIVE
                    </Badge>
                );
            case "DRAFT":
                return (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200/60 font-medium px-2 shadow-sm uppercase tracking-wider text-[10px]">
                        DRAFT
                    </Badge>
                );
            case "RETIRED":
                return (
                    <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200/60 font-medium px-2 shadow-sm uppercase tracking-wider text-[10px]">
                        RETIRED
                    </Badge>
                );
            default:
                return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
        }
    };

    if (isLoading) return <PageLoading />;

    const createLink = role === "super" ? "/super-admin-area/master/documents/create" : "/admin-area/master/documents/create";

    const jobDescDocs = filteredDocuments.filter(d => d.type === "JOB_DESCRIPTION");
    const sopDocs = filteredDocuments.filter(d => d.type === "SOP");

    const DocumentTable = ({ docs }: { docs: any[] }) => (
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/70 backdrop-blur-md overflow-hidden rounded-2xl">
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/80 border-b border-gray-100">
                                <TableHead className="w-[35%] py-4 pl-6 text-xs font-bold uppercase tracking-wider text-gray-500">Judul Dokumen</TableHead>
                                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Penerima</TableHead>
                                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Versi</TableHead>
                                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Status</TableHead>
                                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Timeline</TableHead>
                                <TableHead className="pr-6 text-right text-xs font-bold uppercase tracking-wider text-gray-500">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {docs.length > 0 ? (
                                docs.map((doc) => (
                                    <TableRow key={doc.id} className="group hover:bg-blue-50/30 transition-colors border-b border-gray-50/50 last:border-0">
                                        <TableCell className="py-4 pl-6">
                                            <div className="flex items-start gap-3">
                                                <div className={cn(
                                                    "p-2.5 rounded-xl shadow-sm",
                                                    doc.type === "JOB_DESCRIPTION" ? "bg-cyan-50 text-cyan-600" : "bg-indigo-50 text-indigo-600"
                                                )}>
                                                    {doc.type === "JOB_DESCRIPTION" ? <Shield size={18} /> : <BookOpen size={18} />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">{doc.title}</span>
                                                    <span className="text-[11px] text-gray-400 capitalize flex items-center gap-1">
                                                        ID: {doc.id.substring(0, 8)}...
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex flex-col gap-1.5">
                                                {doc.departments.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {doc.departments.map((d: any) => (
                                                            <Badge key={d.department.code} variant="outline" className="text-[10px] py-0 px-1.5 h-5 bg-blue-50/40 text-blue-600 border-blue-100/50">
                                                                {d.department.code}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                                {doc.employees?.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {doc.employees.map((e: any) => (
                                                            <Badge key={e.karyawan.id} variant="secondary" className="text-[10px] py-0 px-1.5 h-5 bg-orange-50/50 text-orange-600 border-orange-100/50">
                                                                <User size={10} className="mr-1" />
                                                                {e.karyawan.namaLengkap.split(' ')[0]}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                                {doc.departments.length === 0 && doc.employees?.length === 0 && (
                                                    <span className="text-gray-400 text-[11px] font-medium flex items-center gap-1 italic">
                                                        <Activity size={10} /> Public
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <span className="font-mono text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">v{doc.version}</span>
                                        </TableCell>
                                        <TableCell className="py-4">{getStatusBadge(doc.status)}</TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-semibold text-gray-700">{format(new Date(doc.createdAt), "dd MMM yyyy")}</span>
                                                <span className="text-[10px] text-gray-400">Created Date</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="pr-6 text-right py-4">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                asChild
                                                                className="h-8 w-8 rounded-lg hover:bg-blue-100 hover:text-blue-600 transition-all text-gray-400"
                                                            >
                                                                <Link href={role === "super" ? `/super-admin-area/master/documents/view/${doc.id}` : `/admin-area/master/documents/view/${doc.id}`}>
                                                                    <Eye size={16} />
                                                                </Link>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top" className="bg-gray-900 border-none text-[10px] font-bold">Lihat Detail</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                asChild
                                                                className="h-8 w-8 rounded-lg hover:bg-amber-100 hover:text-amber-600 transition-all text-gray-400"
                                                            >
                                                                <Link href={role === "super" ? `/super-admin-area/master/documents/edit/${doc.id}` : `/admin-area/master/documents/edit/${doc.id}`}>
                                                                    <Pencil size={16} />
                                                                </Link>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top" className="bg-gray-900 border-none text-[10px] font-bold">Edit Dokumen</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDeleteClick(doc)}
                                                                className="h-8 w-8 rounded-lg hover:bg-red-100 hover:text-red-600 transition-all text-gray-400"
                                                            >
                                                                <Trash2 size={16} />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top" className="bg-gray-900 border-none text-[10px] font-bold">Hapus Dokumen</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20">
                                        <div className="flex flex-col items-center justify-center opacity-40 text-gray-400">
                                            <FileText size={48} className="mb-2" />
                                            <p className="font-medium">Belum ada dokumen yang tersedia</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative w-full md:w-[450px] group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <Input
                        placeholder="Cari berdasarkan judul dokumen..."
                        className="pl-10 h-11 bg-white border-gray-200 shadow-sm focus-visible:ring-1 focus-visible:ring-primary/30 transition-all rounded-xl"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button
                    asChild
                    className="w-full md:w-auto h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-indigo-500/20 border-none transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Link href={createLink} className="flex items-center gap-2">
                        <Plus size={20} />
                        <span className="font-semibold">Buat Dokumen Baru</span>
                    </Link>
                </Button>
            </div>

            <Tabs defaultValue="job-desc" className="w-full">
                <TabsList className="bg-gray-100/50 p-1 rounded-2xl h-14 w-full md:w-auto border border-gray-200/50 mb-6">
                    <TabsTrigger
                        value="job-desc"
                        className="rounded-xl px-8 h-full font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-cyan-600 data-[state=active]:shadow-sm flex items-center gap-2 group"
                    >
                        <div className="p-1.5 rounded-lg bg-cyan-50 group-data-[state=active]:bg-cyan-100 transition-colors">
                            <Shield size={16} className="text-cyan-600" />
                        </div>
                        <span>Job Descriptions</span>
                        <Badge variant="secondary" className="ml-2 bg-cyan-100 text-cyan-700 border-none rounded-lg px-2 text-[10px]">
                            {jobDescDocs.length}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger
                        value="sop"
                        className="rounded-xl px-8 h-full font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm flex items-center gap-2 group"
                    >
                        <div className="p-1.5 rounded-lg bg-indigo-50 group-data-[state=active]:bg-indigo-100 transition-colors">
                            <BookOpen size={16} className="text-indigo-600" />
                        </div>
                        <span>SOP</span>
                        <Badge variant="secondary" className="ml-2 bg-indigo-100 text-indigo-700 border-none rounded-lg px-2 text-[10px]">
                            {sopDocs.length}
                        </Badge>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="job-desc" className="mt-0 ring-0 focus-visible:ring-0 outline-none">
                    <DocumentTable docs={jobDescDocs} />
                </TabsContent>

                <TabsContent value="sop" className="mt-0 ring-0 focus-visible:ring-0 outline-none">
                    <DocumentTable docs={sopDocs} />
                </TabsContent>
            </Tabs>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl">
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
                        <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 rounded-xl">
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
