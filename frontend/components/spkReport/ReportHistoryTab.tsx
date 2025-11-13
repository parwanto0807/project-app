"use client";
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Fragment } from 'react';
import { Archive, Download, Eye, CheckCircle, X, Clock, Camera, FileText, UserCheck2Icon, ChevronsRight, PackageOpenIcon, MoveRight, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface SPKData {
    id: string;
    spkNumber: string;
    clientName: string;
    projectName: string;
    status: 'PENDING' | 'PROGRESS' | 'COMPLETED';
    progress: number;
    deadline: string;
    assignedTo: string;
    teamName: string;
    email: string;
    items: {
        id: string;
        name: string;
        description?: string | null;
        qty: number;
        uom?: string | null;
        status: 'PENDING' | 'DONE';
        progress: number;
    }[];
}

interface ReportHistory {
    id: string;
    spkNumber: string;
    clientName: string;
    projectName: string;
    type: 'PROGRESS' | 'FINAL';
    note: string | null;
    photos: string[];
    reportedAt: Date;
    itemName: string;
    karyawanName: string;
    email: string;
    soDetailId: string;
    progress: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface ReportHistoryTabProps {
    reports: ReportHistory[];
    loadingReports: boolean;
    filters: {
        date: 'all' | 'today' | 'thisWeek' | 'thisMonth';
        status: 'all' | 'PENDING' | 'APPROVED' | 'REJECTED';
        spkId: string;
        karyawanId: string;
    };
    setFilters: (filters: {
        date: 'all' | 'today' | 'thisWeek' | 'thisMonth';
        status: 'all' | 'PENDING' | 'APPROVED' | 'REJECTED';
        spkId: string;
        karyawanId: string;
    }) => void;
    filteredUserSpk: SPKData[];
    userSpk: SPKData[];
    role: string;
    fetchReports: () => void;
    itemsPerPage: number;
    setItemsPerPage: (items: number) => void;
}

const ReportHistoryTab = ({
    reports,
    loadingReports,
    filters,
    setFilters,
    filteredUserSpk,
    userSpk,
    role,
    //   fetchReports,
    itemsPerPage,
    setItemsPerPage
}: ReportHistoryTabProps) => {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(reports.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentReports = reports.slice(startIndex, startIndex + itemsPerPage);

    const groupedReports = currentReports.reduce<Record<string, typeof currentReports>>(
        (acc, report) => {
            const key = report.spkNumber;
            if (!acc[key]) acc[key] = [];
            acc[key].push(report);
            return acc;
        },
        {}
    );

    const spkGroups = Object.keys(groupedReports);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const exportToCSV = () => {
        const headers = ['No', 'SPK', 'Client', 'Item', 'Jenis', 'Catatan', 'Tanggal', 'Status', 'Foto', 'Karyawan'];
        const rows = reports.map((r, i) => [
            i + 1,
            r.spkNumber,
            r.clientName,
            r.itemName,
            r.type,
            r.note || '-',
            new Date(r.reportedAt).toLocaleString('id-ID'),
            r.status,
            r.photos.length,
            r.karyawanName,
        ]);

        const csvContent =
            [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `laporan-spk-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card className="border-border/40 bg-card/90 backdrop-blur-sm shadow-md rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg">
            <CardHeader className="pb-4 pt-3 bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/30 dark:to-gray-800 sticky top-0 z-10">
                <div className="grid grid-cols-10 gap-4">
                    <div className='col-span-2 col-start-1'>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Archive className="h-4 w-4 text-purple-600" />
                            Riwayat Laporan
                        </CardTitle>
                        <CardDescription className="text-xs">Riwayat laporan SPK Anda</CardDescription>
                    </div>
                    <div className="col-span-1 col-start-5 items-center justify-center hidden lg:flex gap-2">
                        <Label className="text-xs font-medium">SPK</Label>
                        <Select value={filters.spkId} onValueChange={(v) => setFilters({ ...filters, spkId: v })}>
                            <SelectTrigger className="h-10 text-xs border-border/60">
                                <SelectValue placeholder="Semua SPK" />
                            </SelectTrigger>
                            <SelectContent className="text-xs max-h-48 overflow-y-auto">
                                {filteredUserSpk.map(spk => (
                                    <SelectItem key={spk.id} value={spk.id}>
                                        {spk.spkNumber} - {spk.clientName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="col-span-2 col-start-9">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-10 w-full text-xs"
                            onClick={() => setFilters({ date: 'all', status: 'all', spkId: '', karyawanId: '' })}
                        >
                            Reset Filter
                        </Button>
                    </div>
                </div>

                <div className="col-span-1 col-start-10 items-center justify-center hidden lg:flex gap-2">
                    <Label className="text-xs font-medium">Item Per Page</Label>
                    <Select value={String(itemsPerPage)} onValueChange={(v) => setItemsPerPage(Number(v))}>
                        <SelectTrigger className="h-7 w-20 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>

            <CardContent className="pt-0 px-3 pb-2 flex flex-col h-full">
                {loadingReports ? (
                    <div className="flex justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : reports.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                        <Archive className="mx-auto h-10 w-10 opacity-30" />
                        <p className="text-sm mt-2">Belum ada laporan</p>
                        <p className="text-xs mt-1 text-muted-foreground/70">Lakukan pelaporan pertama Anda.</p>
                    </div>
                ) : (
                    <>
                        <div className="rounded-md border border-border/40 overflow-hidden flex-1 flex flex-col min-h-0">
                            <div className="overflow-y-auto">
                                <Table>
                                    <TableHeader className="bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/30 dark:to-gray-800 sticky top-0 z-10">
                                        <TableRow className="[&>th]:py-0 [&>th]:px-2 [&>th]:text-xs [&>th]:font-semibold">
                                            <TableHead className="w-[40px]">SPK Number, Pelanggan, Project Name </TableHead>
                                            <TableHead></TableHead>
                                            <TableHead className="w-[180px]">Team Lead. Lapangan</TableHead>
                                            <TableHead className="w-[180px]">Progress</TableHead>
                                            <TableHead className="w-[50px]">Approve Admin</TableHead>
                                            <TableHead className="w-[80px]">Foto</TableHead>
                                            {(role === 'admin' || role === 'super' || role === 'pic') && (
                                                <TableHead className="w-[110px] sticky right-0 bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/30 dark:to-gray-800 z-10">
                                                    Aksi
                                                </TableHead>
                                            )}
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody className="divide-y divide-border/40">
                                        {spkGroups.map((spkNumber) => {
                                            const reportsInGroup = groupedReports[spkNumber];
                                            const spk = userSpk.find((i) => i.spkNumber === spkNumber);

                                            return (
                                                <Fragment key={spkNumber}>
                                                    {/* Header Grup SPK */}
                                                    <TableRow className="bg-purple-50 dark:bg-purple-900/20 [&>td]:py-4 [&>td]:px-2 [&>td]:text-sm [&>td]:font-bold">
                                                        <TableCell colSpan={(role === 'admin' || role === 'super' || role === 'pic') ? 7 : 6} className="sticky left-0 z-10 bg-purple-50 dark:bg-purple-900/20">
                                                            <div className="flex items-center gap-2 py-2">
                                                                <Archive className="h-4 w-4 text-purple-600" />
                                                                <span>SPK: {spkNumber}</span>
                                                                {spk && (
                                                                    <>
                                                                        <span className="text-muted-foreground">—</span>
                                                                        <span className="text-muted-foreground">{spk.clientName}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                            <div className="flex text-muted-foreground line-clamp-1 ml-6 gap-2">
                                                                <PackageOpenIcon className="h-4 w-4 text-purple-600 mt-0.5" />
                                                                {userSpk.find((i) => i.spkNumber === spk?.spkNumber)?.projectName ?? "-"}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>

                                                    {(() => {
                                                        const itemGroups = reportsInGroup.reduce<Record<string, typeof reportsInGroup>>(
                                                            (acc, report) => {
                                                                const key = report.itemName;
                                                                if (!acc[key]) acc[key] = [];
                                                                acc[key].push(report);
                                                                return acc;
                                                            },
                                                            {}
                                                        );

                                                        const itemNames = Object.keys(itemGroups);

                                                        return itemNames.map((itemName) => (
                                                            <Fragment key={itemName}>
                                                                {/* Header Subgrup Item */}
                                                                <TableRow className="bg-blue-50/50 dark:bg-blue-900/10 [&>td]:py-2 [&>td]:px-0 [&>td]:text-xs [&>td]:font-medium">
                                                                    <TableCell colSpan={(role === 'admin' || role === 'super' || role === 'pic') ? 7 : 6} className="pl-8 border-l-4 border-blue-500 bg-blue-50/50 dark:bg-blue-900/10">
                                                                        <div className="flex items-center gap-0">
                                                                            {Array(5)
                                                                                .fill(null)
                                                                                .map((_, index) => (
                                                                                    <ChevronsRight key={index} className="h-4.5 w-4.5 text-purple-600" />
                                                                                ))}

                                                                            <span className="text-sm font-semibold mx-2">{itemName}</span>
                                                                            <span className="text-muted-foreground/70">
                                                                                ({itemGroups[itemName].length} laporan)
                                                                            </span>
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>

                                                                {/* Daftar Laporan dalam Subgrup Item */}
                                                                {itemGroups[itemName].map((report) => (
                                                                    <TableRow
                                                                        key={report.id}
                                                                        className="hover:bg-muted/30 transition-colors cursor-pointer [&>td]:py-2 [&>td]:px-2"
                                                                    >
                                                                        {/* Tanggal */}
                                                                        <TableCell>
                                                                            <div className="flex text-xs text-muted-foreground ml-24 pr-4">
                                                                                <MoveRight className="h-4.5 w-4.5 text-purple-600 mr-2" />
                                                                                {new Date(report.reportedAt).toLocaleDateString('id-ID', {
                                                                                    day: 'numeric',
                                                                                    month: 'short',
                                                                                    year: 'numeric',
                                                                                })}
                                                                                {' '}
                                                                                {new Date(report.reportedAt).toLocaleTimeString('id-ID', {
                                                                                    hour: '2-digit',
                                                                                    minute: '2-digit',
                                                                                })}
                                                                            </div>
                                                                        </TableCell>

                                                                        {/* Catatan */}
                                                                        <TableCell className="max-w-[120px]">
                                                                            {report.note ? (
                                                                                <div className="flex items-start gap-1">
                                                                                    <FileText className="w-3 h-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                                                                                    <span className="text-xs text-muted-foreground line-clamp-2">{report.note}</span>
                                                                                </div>
                                                                            ) : (
                                                                                <span className="text-xs text-muted-foreground/70">-</span>
                                                                            )}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <div className="flex items-start gap-1">
                                                                                <UserCheck2Icon className="w-4 h-4 mt-0.5 text-orange-700 flex-shrink-0" />
                                                                                <span className="text-xs text-muted-foreground line-clamp-2">{report.karyawanName}</span>
                                                                            </div>
                                                                        </TableCell>
                                                                        {/* Status */}
                                                                        <TableCell className="sticky left-0 bg-card z-10">
                                                                            <div className="flex flex-col gap-1">
                                                                                {report.type === 'PROGRESS' ? (
                                                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                                                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                                                                                        <span className="text-xs">Progress - {report.progress}%</span>
                                                                                    </div>
                                                                                ) : report.type === 'FINAL' ? (
                                                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                                                        <CheckCircle className="w-3 h-3" />
                                                                                        <span className="text-xs">Selesai - {report.progress}% </span>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                                                                        <Clock className="w-3 h-3" />
                                                                                        <span className="text-xs">Menunggu</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell className="sticky left-0 bg-card z-10">
                                                                            <div className="flex flex-col gap-1">
                                                                                {report.status === 'PENDING' ? (
                                                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                                                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                                                                                        <span className="text-xs">Menunggu ⏳</span>
                                                                                    </div>
                                                                                ) : report.status === 'APPROVED' ? (
                                                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                                                        <CheckCircle className="w-3 h-3" />
                                                                                        <span className="text-xs">Disetujui ✅</span>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                                                                        <X className="w-3 h-3" />
                                                                                        <span className="text-xs">Ditolak ❌</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </TableCell>
                                                                        {/* Foto */}
                                                                        <TableCell>
                                                                            {report.photos.length > 0 ? (
                                                                                <div className="flex items-center gap-1">
                                                                                    <div className="relative">
                                                                                        <Camera className="w-3.5 h-3.5 text-blue-500" />
                                                                                        {report.photos.length > 1 && (
                                                                                            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[8px] rounded-full w-3 h-3 flex items-center justify-center">
                                                                                                {report.photos.length}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <span className="text-xs text-muted-foreground">{report.photos.length}</span>
                                                                                </div>
                                                                            ) : (
                                                                                <span className="text-xs text-muted-foreground/70">-</span>
                                                                            )}
                                                                        </TableCell>

                                                                        {/* Aksi (Admin Only) */}
                                                                        {(role === 'admin' || role === 'super' || role === 'pic') && (
                                                                            <TableCell className="sticky right-0 bg-card z-10">
                                                                                <div className="flex items-center gap-1">
                                                                                    <Button
                                                                                        variant="outline"
                                                                                        size="sm"
                                                                                        className="h-7 w-7 p-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                                                    >
                                                                                        <Eye className="h-3.5 w-3.5" />
                                                                                    </Button>
                                                                                    <Button
                                                                                        variant="outline"
                                                                                        size="sm"
                                                                                        className="h-7 w-7 p-0 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                                                                                    >
                                                                                        <CheckCircle className="h-3.5 w-3.5" />
                                                                                    </Button>
                                                                                    <Button
                                                                                        variant="outline"
                                                                                        size="sm"
                                                                                        className="h-7 w-7 p-0 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                                                                    >
                                                                                        <X className="h-3.5 w-3.5" />
                                                                                    </Button>
                                                                                </div>
                                                                            </TableCell>
                                                                        )}
                                                                    </TableRow>
                                                                ))}
                                                            </Fragment>
                                                        ));
                                                    })()}
                                                </Fragment>
                                            );
                                        })}
                                    </TableBody>
                                </Table>

                                {/* Pagination Controls */}
                                {reports.length > 0 && totalPages > 1 && (
                                    <div className="flex items-center justify-between mt-3 px-1">
                                        <div className="text-xs text-muted-foreground">
                                            Menampilkan {startIndex + 1}–{Math.min(startIndex + itemsPerPage, reports.length)} dari {reports.length} laporan
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => goToPage(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="h-7 px-2 text-xs"
                                            >
                                                <ChevronLeft className="h-3.5 w-3.5" />
                                            </Button>

                                            {(() => {
                                                const pages = [];
                                                const maxVisible = 5;
                                                let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                                                const endPage = Math.min(totalPages, startPage + maxVisible - 1);

                                                if (endPage - startPage + 1 < maxVisible) {
                                                    startPage = Math.max(1, endPage - maxVisible + 1);
                                                }

                                                for (let i = startPage; i <= endPage; i++) {
                                                    pages.push(
                                                        <Button
                                                            key={i}
                                                            variant={currentPage === i ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={() => goToPage(i)}
                                                            className={`h-7 w-7 p-0 text-xs ${currentPage === i ? 'bg-purple-600 text-white hover:bg-purple-700' : ''}`}
                                                        >
                                                            {i}
                                                        </Button>
                                                    );
                                                }
                                                return pages;
                                            })()}

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => goToPage(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className="h-7 px-2 text-xs"
                                            >
                                                <ChevronRight className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Bar */}
                        <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-end bg-cyan-800 py-2 px-3 rounded-b-lg border-t border-border/40">
                            <Button variant="outline" size="sm" onClick={exportToCSV} className="text-xs h-7">
                                <Download className="h-3 w-3 mr-1" />
                                Ekspor CSV
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7"
                            >
                                <Download className="h-3 w-3 mr-1" />
                                Preview PDF
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default ReportHistoryTab;