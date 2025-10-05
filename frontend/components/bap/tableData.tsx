"use client";

import { useState, useEffect } from "react";
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    DockIcon,
    Edit,
    Eye,
    FileText,
    MoreHorizontal,
    Plus,
    Search,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { BAPPdfDocument } from "./bapPdfPreview";
import { BAPDetailDrawer } from "./bapDetailDialog";
import { DeleteConfirmationDialog } from "./alertDeleteDialog";
import { useDeleteBAP } from "@/hooks/use-delete-bap";
import { toast } from "sonner"; // Jika menggunakan Sonner untuk notifikasi

export interface BAPData {
    id: string;
    bapNumber: string;
    bapDate: string;
    salesOrderId: string;
    projectId: string;
    createdById: string;
    userId: string;
    workDescription: string;
    location: string;
    status: "DRAFT" | "IN_PROGRESS" | "COMPLETED" | "APPROVED";
    isApproved: boolean;
    approvedAt: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    salesOrder: {
        id: string;
        soNumber: string;
        customer: { id: string; name: string; branch: string, contactPerson: string; address: string };
        project?: {
            name: string;
            location: string | null;
        };
        spk: {
            spkNumber: string;
            spkDate: string;
        }[],
        items?: {
            id: string;
            name: string;
            description: string;
            productId: string;
            qty: number;
            price: number;
            discount?: number;
            total: number;
            uom: string;
        }[];
    };
    createdBy: {
        id: string;
        name: string;
    };
    user: {
        id: string;
        namaLengkap: string;
    };
    photos?: {
        id?: string;
        bapId: string;
        photoUrl: string;
        caption?: string;
        category: "BEFORE" | "PROCESS" | "AFTER";
        createdAt?: string;
    }[];
}

interface BAPDataTableProps {
    bapData: BAPData[];
    isLoading: boolean;
}

export function BAPDataTable({
    bapData,
    isLoading,
}: BAPDataTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});
    const [globalFilter, setGlobalFilter] = useState("");
    const [isMobile, setIsMobile] = useState(false);
    const router = useRouter();
    const [selectedBap, setSelectedBap] = useState<BAPData | null>(null);
    const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
    const [selectedBapForDetail, setSelectedBapForDetail] = useState<BAPData | null>(null);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    // Gunakan custom hook untuk delete functionality
    const {
        isDialogOpen,
        isLoading: isDeleting,
        openDialog,
        closeDialog,
        handleDelete,
    } = useDeleteBAP({
        onSuccess: () => {
            toast.success("BAP berhasil dihapus");
            // Data akan otomatis refresh via window.location.reload()
        },
        onError: (error) => {
            toast.error(`Gagal menghapus BAP: ${error}`);
        },
    });

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const handlePdfPreview = (bap: BAPData) => {
        setSelectedBap(bap);
        setIsPdfPreviewOpen(true);
    };

    const handleViewDetail = (bap: BAPData) => {
        setSelectedBapForDetail(bap);
        setIsDetailDialogOpen(true);
    };

    const columns: ColumnDef<BAPData>[] = [
        {
            accessorKey: "bapNumber",
            header: "Nomor BAP",
            cell: ({ row }) => (
                <div className="flex items-center">
                    <FileText className="mr-2 h-4 w-4 text-cyan-500" />
                    <span className="font-medium">{row.getValue("bapNumber")}</span>
                </div>
            ),
        },
        {
            accessorKey: "bapDate",
            header: "Tanggal BAP",
            cell: ({ row }) => {
                const date = new Date(row.getValue("bapDate"));
                return (
                    <div className="text-sm">
                        {format(date, "dd MMMM yyyy")}
                    </div>
                );
            },
        },
        {
            accessorKey: "salesOrder.soNumber",
            header: "Nomor SO",
            cell: ({ row }) => (
                <div className="text-sm">{row.original.salesOrder.soNumber}</div>
            ),
        },
        {
            accessorKey: "salesOrder.customerName",
            header: "Nama Pelanggan",
            cell: ({ row }) => (
                <div className="text-sm">{row.original.salesOrder.customer.name}</div>
            ),
        },
        {
            accessorKey: "workDescription",
            header: "Deskripsi Pekerjaan",
            cell: ({ row }) => (
                <div className="text-sm max-w-xs truncate">
                    {row.getValue("workDescription") || "-"}
                </div>
            ),
        },
        {
            accessorKey: "location",
            header: "Lokasi",
            cell: ({ row }) => (
                <div className="text-sm">{row.getValue("location") || "-"}</div>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as string;

                const statusVariantMap: Record<string, "default" | "destructive" | "outline" | "secondary" | "success"> = {
                    "APPROVED": "success",
                    "COMPLETED": "default",
                    "IN_PROGRESS": "secondary",
                    "DRAFT": "outline"
                };

                const variant = statusVariantMap[status] || "outline";

                return (
                    <Badge variant={variant} className="capitalize">
                        {status.toLowerCase().replace("_", " ")}
                    </Badge>
                );
            },
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => {
                const bap = row.original;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => navigator.clipboard.writeText(bap.id)}
                            >
                                Salin ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => handleViewDetail(bap)}
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                Lihat Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => router.push(`/admin-area/logistic/bap/update/${bap.id}`)}
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handlePdfPreview(bap)}
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                Preview PDF
                            </DropdownMenuItem>
                            {/* Ganti dengan fungsi openDialog */}
                            <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => openDialog(bap.id)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    const table = useReactTable({
        data: bapData,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onGlobalFilterChange: setGlobalFilter,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            globalFilter,
        },
    });

    const handleAddBAP = () => {
        router.push("/admin-area/logistic/bap/create");
    };

    if (isLoading) {
        return (
            <Card className="w-full">
                <CardHeader className="bg-gradient-to-r from-cyan-600 to-purple-600 p-4 rounded-lg text-white">
                    <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary">
                                <DockIcon className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-semibold">Berita Acara Serah Terima (BAST)</CardTitle>
                                <p className="text-sm text-white dark:text-muted-foreground">Kelola Berita Acara Serah Terima Pekerjaan (BAST) Anda</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Skeleton className="h-10 w-full sm:w-[200px]" />
                            <Skeleton className="h-10 w-full sm:w-[130px]" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                    <div className="flex items-center py-4">
                        <Skeleton className="h-10 w-full max-w-sm" />
                    </div>
                    <div className="rounded-md border hidden md:block">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => {
                                            return (
                                                <TableHead key={header.id}>
                                                    <Skeleton className="h-6 w-20" />
                                                </TableHead>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <TableRow key={index}>
                                        {Array.from({ length: columns.length }).map((_, cellIndex) => (
                                            <TableCell key={cellIndex}>
                                                <Skeleton className="h-6 w-full" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {isMobile ? (
                        <div className="space-y-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Card key={i} className="border p-4">
                                    <div className="space-y-3">
                                        <Skeleton className="h-5 w-3/4" />
                                        <Skeleton className="h-4 w-1/2" />
                                        <Skeleton className="h-4 w-1/3" />
                                        <div className="flex justify-end">
                                            <Skeleton className="h-8 w-20" />
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id}>
                                            {headerGroup.headers.map((header) => {
                                                return (
                                                    <TableHead key={header.id}>
                                                        <Skeleton className="h-6 w-20" />
                                                    </TableHead>
                                                );
                                            })}
                                        </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    {Array.from({ length: 5 }).map((_, index) => (
                                        <TableRow key={index}>
                                            {Array.from({ length: columns.length }).map((_, cellIndex) => (
                                                <TableCell key={cellIndex}>
                                                    <Skeleton className="h-6 w-full" />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    <div className="flex items-center justify-end space-x-2 py-4">
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 w-24" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className="w-full">
                <CardHeader className="bg-gradient-to-r from-cyan-600 to-purple-600 p-4 rounded-lg text-white">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary">
                                <DockIcon className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-semibold">Berita Acara Serah Terima (BAST)</CardTitle>
                                <p className="text-sm text-white dark:text-muted-foreground">
                                    Kelola Berita Acara Serah Terima Pekerjaan (BAST) Anda
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 items-end">
                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                <div className="relative w-full sm:w-[200px]">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Cari BAP..."
                                        className="pl-8 w-full bg-white/10 border-white/20 text-white placeholder:text-white/70"
                                        value={globalFilter ?? ""}
                                        onChange={(event) => setGlobalFilter(event.target.value)}
                                    />
                                </div>

                                <Select
                                    value={(table.getColumn("status")?.getFilterValue() as string) ?? ""}
                                    onValueChange={(value) =>
                                        table.getColumn("status")?.setFilterValue(value === "all" ? "" : value)
                                    }
                                >
                                    <SelectTrigger className="w-full sm:w-[180px] bg-white/10 border-white/20 text-white">
                                        <SelectValue placeholder="Filter status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua status</SelectItem>
                                        <SelectItem value="DRAFT">Draft</SelectItem>
                                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                        <SelectItem value="COMPLETED">Completed</SelectItem>
                                        <SelectItem value="APPROVED">Approved</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                onClick={handleAddBAP}
                                className="bg-white text-cyan-700 hover:bg-cyan-50 flex items-center gap-1 w-full sm:w-auto"
                            >
                                <Plus className="h-4 w-4" />
                                <span>BAP Baru</span>
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-4 md:p-6">
                    {isMobile ? (
                        <div className="space-y-4">
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => {
                                    const bap = row.original;
                                    return (
                                        <Card key={row.id} className="border p-4">
                                            <div className="space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="h-4 w-4 text-cyan-500" />
                                                            <h3 className="font-medium">{bap.bapNumber}</h3>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            {format(new Date(bap.bapDate), "dd MMM yyyy")}
                                                        </p>
                                                        <p className="text-sm font-medium">{bap.salesOrder.customer.name}</p>
                                                    </div>
                                                    <Badge variant={
                                                        bap.status === "APPROVED" ? "success" :
                                                            bap.status === "COMPLETED" ? "default" :
                                                                bap.status === "IN_PROGRESS" ? "secondary" : "outline"
                                                    } className="capitalize">
                                                        {bap.status.toLowerCase().replace("_", " ")}
                                                    </Badge>
                                                </div>

                                                <div className="flex justify-end pt-2">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                                            <DropdownMenuItem
                                                                onClick={() => navigator.clipboard.writeText(bap.id)}
                                                            >
                                                                Salin ID
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => handleViewDetail(bap)}
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                Lihat Detail
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => router.push(`/admin-area/logistic/bap/update/${bap.id}`)}
                                                            >
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handlePdfPreview(bap)}
                                                            >
                                                                <FileText className="mr-2 h-4 w-4" />
                                                                Preview PDF
                                                            </DropdownMenuItem>
                                                            {/* Ganti dengan fungsi openDialog untuk mobile */}
                                                            <DropdownMenuItem
                                                                className="text-red-600"
                                                                onClick={() => openDialog(bap.id)}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Hapus
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    Tidak ada data BAP.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id}>
                                            {headerGroup.headers.map((header) => {
                                                return (
                                                    <TableHead key={header.id}>
                                                        {header.isPlaceholder
                                                            ? null
                                                            : flexRender(
                                                                header.column.columnDef.header,
                                                                header.getContext()
                                                            )}
                                                    </TableHead>
                                                );
                                            })}
                                        </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    {table.getRowModel().rows?.length ? (
                                        table.getRowModel().rows.map((row) => (
                                            <TableRow
                                                key={row.id}
                                                data-state={row.getIsSelected() && "selected"}
                                            >
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell key={cell.id}>
                                                        {flexRender(
                                                            cell.column.columnDef.cell,
                                                            cell.getContext()
                                                        )}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={columns.length}
                                                className="h-24 text-center"
                                            >
                                                Tidak ada data BAP.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal Preview PDF */}
            <Dialog open={isPdfPreviewOpen} onOpenChange={setIsPdfPreviewOpen}>
                <DialogContent className="max-w-4xl max-h-screen overflow-auto">
                    <DialogHeader>
                        <DialogTitle>Preview PDF BAP: {selectedBap?.bapNumber}</DialogTitle>
                    </DialogHeader>
                    {selectedBap && (
                        <div className="py-4">
                            <PDFDownloadLink
                                document={<BAPPdfDocument bap={selectedBap} />}
                                fileName={`BAP-${selectedBap.bapNumber}.pdf`}
                            >
                                {({ loading }) =>
                                    loading ? (
                                        <Button disabled>
                                            Memuat PDF...
                                        </Button>
                                    ) : (
                                        <Button>
                                            Unduh PDF
                                        </Button>
                                    )
                                }
                            </PDFDownloadLink>

                            <div className="mt-6 border-t pt-4">
                                <h3 className="text-lg font-medium mb-4">Preview Dokumen</h3>
                                <div className="bg-white rounded shadow" style={{ height: "600px" }}>
                                    <PDFViewer width="100%" height="100%">
                                        <BAPPdfDocument bap={selectedBap} />
                                    </PDFViewer>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Dialog Detail */}
            <BAPDetailDrawer
                open={isDetailDialogOpen}
                onOpenChange={setIsDetailDialogOpen}
                bap={selectedBapForDetail}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                isOpen={isDialogOpen}
                onClose={closeDialog}
                onConfirm={handleDelete}
                isLoading={isDeleting}
                title="Hapus BAP"
                description="Apakah Anda yakin ingin menghapus BAP ini? Tindakan ini tidak dapat dibatalkan dan data akan dihapus secara permanen."
            />
        </>
    );
}