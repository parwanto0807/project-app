"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import HeaderCard from "@/components/ui/header-card";
import { apiFetch } from "@/lib/apiFetch";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import CreateCashOpnameDialog from "@/components/accounting/cash-opname/CreateCashOpnameDialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { format } from "date-fns";

interface CashOpname {
    id: string;
    opnameNumber: string;
    date: string | Date;
    systemAmount: number | string;
    physicalAmount: number | string;
    difference: number | string;
    status: string;
    coa?: {
        name: string;
    };
    createdBy?: {
        name: string | null;
    };
}

export default function CashOpnamePage() {
    const [opnames, setOpnames] = useState<CashOpname[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const fetchOpnames = async () => {
        setLoading(true);
        try {
            // In a real app, use an API utility with auth headers
            // For now, assuming generic fetch with credentials
            const data = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounting/cash-opname`);
            if (data.success) {
                setOpnames(data.data);
            } else {
                toast.error(data.message || "Failed to fetch cash opnames");
            }
        } catch (error) {
            console.error("Error fetching opnames:", error);
            toast.error("Failed to connect to server");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOpnames();
    }, []);

    const handleOpnameCreated = () => {
        fetchOpnames();
        setIsDialogOpen(false);
    };

    return (
        <AdminLayout title="Cash Opname" role="admin">
            <div className="flex flex-col space-y-4 md:space-y-6 p-4 md:p-6 w-full">
                <div className="px-4 md:px-0">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <Badge variant="outline" className="bg-white/50 backdrop-blur-sm border-gray-200 text-gray-500 hover:text-emerald-600 transition-colors">
                                        <Link href="/admin-area">Dashboard</Link>
                                    </Badge>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <Badge variant="outline" className="bg-white/50 backdrop-blur-sm border-gray-200 text-gray-500">
                                    Accounting
                                </Badge>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                                    <BreadcrumbPage className="text-emerald-700">Cash Opname</BreadcrumbPage>
                                </Badge>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

                <HeaderCard
                    title="Cash Opname"
                    description="Mencatat dan memverifikasi saldo fisik kas vs sistem."
                    icon={<RefreshCw className="h-6 w-6" />}
                    showActionArea={true}
                    actionArea={
                        <div className="flex gap-2">
                            <Button variant="secondary" onClick={fetchOpnames} disabled={loading} className="bg-white/20 hover:bg-white/30 text-white border-0">
                                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                            <Button onClick={() => setIsDialogOpen(true)} className="bg-white text-indigo-600 hover:bg-white/90">
                                <Plus className="mr-2 h-4 w-4" />
                                Buat Opname Baru
                            </Button>
                        </div>
                    }
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Riwayat Cash Opname</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : opnames.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Belum ada data Cash Opname.
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nomor Opname</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Akun Kas</TableHead>
                                        <TableHead className="text-right">Saldo Sistem</TableHead>
                                        <TableHead className="text-right">Saldo Fisik</TableHead>
                                        <TableHead className="text-right">Selisih</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Dibuat Oleh</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {opnames.map((opname) => (
                                        <TableRow key={opname.id}>
                                            <TableCell className="font-medium">{opname.opnameNumber}</TableCell>
                                            <TableCell>{format(new Date(opname.date), "dd MMM yyyy")}</TableCell>
                                            <TableCell>{opname.coa?.name}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(Number(opname.systemAmount))}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(Number(opname.physicalAmount))}</TableCell>
                                            <TableCell className={`text-right ${Number(opname.difference) !== 0 ? 'text-red-500 font-bold' : 'text-green-500'}`}>
                                                {formatCurrency(Number(opname.difference))}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={opname.status === 'POSTED' ? 'default' : 'secondary'}>
                                                    {opname.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{opname.createdBy?.name || 'System'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                <CreateCashOpnameDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    onSuccess={handleOpnameCreated}
                />
            </div>
        </AdminLayout>
    );
}
