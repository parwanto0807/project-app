"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import HeaderCard from "@/components/ui/header-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import IncomeStatementTable, { IncomeStatementData } from "@/components/accounting/financial-reports/IncomeStatementTable";
import { toast } from "sonner";
import { CalendarIcon, Filter, Printer, FileText, Check, ChevronsUpDown } from "lucide-react";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { useAuth } from "@/contexts/AuthContext";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

// Helper to fetch Sales Orders for filter
async function getSalesOrders() {
    try {
        const res = await fetch("/api/salesOrder?page=1&pageSize=100&status=INVOICED");
        const data = await res.json();
        const orders = data.data || [];

        // Filter orders after 1 January 2026
        const filteredOrders = orders.filter((so: any) => {
            const soDate = new Date(so.soDate);
            return soDate >= new Date("2026-01-01");
        });

        return filteredOrders;
    } catch (error) {
        console.error("Failed to fetch Sales Orders", error);
        return [];
    }
}

export default function FinancialReportsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { role } = useAuth();

    // State for Filters
    const [startDate, setStartDate] = useState<Date | undefined>(
        searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    );
    const [endDate, setEndDate] = useState<Date | undefined>(
        searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : new Date()
    );
    const [salesOrderId, setSalesOrderId] = useState<string>(searchParams.get("salesOrderId") || "all");
    const [salesOrders, setSalesOrders] = useState<any[]>([]);

    // State for Data
    const [reportData, setReportData] = useState<IncomeStatementData | null>(null);
    const [loading, setLoading] = useState(false);
    const [openPopover, setOpenPopover] = useState(false);

    // Initial Load - Fetch Filter Options
    useEffect(() => {
        getSalesOrders().then(setSalesOrders);
    }, []);

    // Sync state with URL params
    useEffect(() => {
        const urlSalesOrderId = searchParams.get("salesOrderId") || "all";
        if (urlSalesOrderId !== salesOrderId) {
            setSalesOrderId(urlSalesOrderId);
        }
    }, [searchParams]);

    // Helper to get selected sales order name for display
    const selectedSalesOrder = salesOrders.find(so => so.id === salesOrderId);
    const salesOrderDisplayName = selectedSalesOrder
        ? `${selectedSalesOrder.soNumber} - ${selectedSalesOrder.project?.name}`
        : (salesOrderId === 'all' ? undefined : 'Loading...');

    // Function to Fetch Report
    const fetchReport = async () => {
        if (!startDate || !endDate) return;

        setLoading(true);
        try {
            const params = new URLSearchParams({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            });

            if (salesOrderId && salesOrderId !== "all") {
                params.append("salesOrderId", salesOrderId);
            }

            const response = await fetch(`/api/accounting/reports/income-statement?${params.toString()}`);
            const result = await response.json();

            if (result.success) {
                setReportData(result.data);
            } else {
                toast.error(result.error || "Failed to load report");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred while fetching the report");
        } finally {
            setLoading(false);
        }
    };

    // Apply Filter (Push to URL)
    const applyFilter = () => {
        const params = new URLSearchParams();
        if (startDate) params.set("startDate", startDate.toISOString());
        if (endDate) params.set("endDate", endDate.toISOString());
        if (salesOrderId && salesOrderId !== "all") params.set("salesOrderId", salesOrderId);

        router.push(`${pathname}?${params.toString()}`);
        fetchReport();
    };

    // Fetch on mount or URL change
    useEffect(() => {
        fetchReport();
    }, [searchParams]);

    return (
        <AdminLayout
            title="Financial Reports"
            subtitle="Income Statement (Profit & Loss)"
            role={role || ""}
        >
            <div className="space-y-6 px-4 py-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem>
                                        <BreadcrumbLink asChild>
                                            <Link href="/admin-area" className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                                                <Badge variant="outline" className="font-medium">Dashboard</Badge>
                                            </Link>
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        <Badge variant="outline" className="font-medium text-muted-foreground cursor-default">Accounting</Badge>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        <Badge variant="secondary" className="font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">
                                            Financial Reports
                                        </Badge>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </div>
                </div>

                <HeaderCard
                    title="Financial Reports"
                    description="Income Statement (Profit & Loss) Report Overview"
                    icon={<FileText className="text-white" />}
                    gradientFrom="from-blue-600"
                    gradientTo="to-indigo-700"
                    showActionArea={true}
                    actionArea={false}
                />

                {/* FILTERS CARD */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            Report Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            {/* Start Date */}
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !startDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={startDate}
                                            onSelect={setStartDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* End Date */}
                            <div className="space-y-2">
                                <Label>End Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !endDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={endDate}
                                            onSelect={setEndDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Sales Order Filter */}
                            <div className="space-y-2 flex flex-col">
                                <Label>Project / Sales Order (Optional)</Label>
                                <Popover open={openPopover} onOpenChange={setOpenPopover}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openPopover}
                                            className="w-full justify-between font-normal"
                                        >
                                            <span className="truncate">
                                                {salesOrderId === "all"
                                                    ? "All Projects (Global)"
                                                    : salesOrders.find((so) => so.id === salesOrderId)
                                                        ? `${salesOrders.find((so) => so.id === salesOrderId).soNumber} - ${salesOrders.find((so) => so.id === salesOrderId).project?.name}`
                                                        : "Select Project..."}
                                            </span>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Search project or SO number..." />
                                            <CommandList>
                                                <CommandEmpty>No sales order found.</CommandEmpty>
                                                <CommandGroup>
                                                    <CommandItem
                                                        value="all"
                                                        onSelect={() => {
                                                            setSalesOrderId("all");
                                                            setOpenPopover(false);
                                                        }}
                                                        className="cursor-pointer"
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                salesOrderId === "all" ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        All Projects (Global)
                                                    </CommandItem>
                                                    {salesOrders.map((so) => (
                                                        <CommandItem
                                                            key={so.id}
                                                            value={`${so.soNumber} ${so.project?.name}`}
                                                            onSelect={() => {
                                                                setSalesOrderId(so.id);
                                                                setOpenPopover(false);
                                                            }}
                                                            className="cursor-pointer"
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    salesOrderId === so.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            <div className="flex flex-col">
                                                                <span>{so.soNumber}</span>
                                                                <span className="text-xs text-muted-foreground">{so.project?.name}</span>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Apply Button - Positioned at the far right */}
                            <div className="flex justify-end">
                                <Button onClick={applyFilter} className="w-full md:w-[200px]">
                                    Generate Report
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* REPORT TABLE */}
                <IncomeStatementTable
                    data={reportData}
                    isLoading={loading}
                    period={{
                        startDate: startDate ? format(startDate, 'yyyy-MM-dd') : '',
                        endDate: endDate ? format(endDate, 'yyyy-MM-dd') : ''
                    }}
                    salesOrderName={salesOrderDisplayName}
                />
            </div>
        </AdminLayout>
    );
}
