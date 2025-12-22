import React from "react";
import {
    Search,
    RefreshCw,
    WarehouseIcon,
    Filter,
    Monitor,
    Smartphone,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import DateRangePicker from "@/components/shared/DateRangePicker";

interface InventoryFilterBarProps {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    period?: string;
    setPeriod?: (value: string) => void;
    startDate?: string;
    setStartDate?: (date: string) => void;
    endDate?: string;
    setEndDate?: (date: string) => void;
    warehouseFilter: string;
    setWarehouseFilter: (value: string) => void;
    warehouses: { id: string; name: string }[];
    statusFilter: string;
    setStatusFilter: (value: string) => void;
    viewMode: 'desktop' | 'mobile';
    onViewModeChange: (mode: 'desktop' | 'mobile') => void;
    lastUpdated: Date;
    onRefresh: () => void;
    loading: boolean;
}

export default function InventoryFilterBar({
    searchTerm,
    setSearchTerm,
    period,
    setPeriod,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    warehouseFilter,
    setWarehouseFilter,
    warehouses,
    statusFilter,
    setStatusFilter,
    viewMode,
    onViewModeChange,
    lastUpdated,
    onRefresh,
    loading
}: InventoryFilterBarProps) {
    return (
        <Card className="border-none shadow-sm bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl sticky top-6 z-50 border border-white/20 dark:border-slate-800 transition-colors">
            <CardContent className="p-1 md:p-2 flex flex-col xl:flex-row gap-6 items-center">
                <div className="relative w-full xl:max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" />
                    <Input
                        placeholder="Find by product name or SKU code..."
                        className="pl-12 h-14 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-2xl focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400 shadow-inner dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full xl:justify-end">
                    {/* Period Filter or Date Range Picker */}
                    <div className="hidden xl:block">
                        {period !== undefined && setPeriod ? (
                            <Input
                                type="month"
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                                className="h-14 w-[180px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-2xl focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400 shadow-sm dark:text-white"
                            />
                        ) : (
                            <DateRangePicker
                                startDate={startDate}
                                endDate={endDate}
                                onChange={(start, end) => {
                                    if (setStartDate) setStartDate(start);
                                    if (setEndDate) setEndDate(end);
                                }}
                            />
                        )}
                    </div>
                    <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                        <SelectTrigger className="w-[180px] h-14 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm dark:text-slate-100">
                            <WarehouseIcon className="w-4 h-4 mr-2 text-slate-400" />
                            <SelectValue placeholder="Location" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl dark:bg-slate-900 dark:border-slate-800">
                            <SelectItem value="all">All Warehouses</SelectItem>
                            {warehouses.map(wh => <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px] h-14 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm dark:text-slate-100">
                            <Filter className="w-4 h-4 mr-2 text-slate-400" />
                            <SelectValue placeholder="Status Filter" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl dark:bg-slate-900 dark:border-slate-800">
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="SAFE">Safe Stock</SelectItem>
                            <SelectItem value="WARNING">Low Stock</SelectItem>
                            <SelectItem value="CRITICAL">Critical</SelectItem>
                            <SelectItem value="inactive">Inactive Only</SelectItem>
                        </SelectContent>
                    </Select>

                    <Tabs value={statusFilter} onValueChange={setStatusFilter} className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl hidden md:block">
                        <TabsList className="bg-transparent h-10 gap-1">
                            <TabsTrigger value="all" className="rounded-xl px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm data-[state=active]:text-slate-900 dark:data-[state=active]:text-white font-bold text-xs uppercase tracking-wider">All</TabsTrigger>
                            <TabsTrigger value="CRITICAL" className="rounded-xl px-6 data-[state=active]:bg-rose-600 data-[state=active]:text-white font-bold text-xs uppercase tracking-wider">Critical</TabsTrigger>
                            <TabsTrigger value="WARNING" className="rounded-xl px-6 data-[state=active]:bg-amber-600 data-[state=active]:text-white font-bold text-xs uppercase tracking-wider">Low</TabsTrigger>
                            <TabsTrigger value="inactive" className="rounded-xl px-6 data-[state=active]:bg-slate-600 data-[state=active]:text-white font-bold text-xs uppercase tracking-wider">Inactive</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl shadow-inner">
                        <Button
                            variant={viewMode === 'desktop' ? 'secondary' : 'ghost'}
                            size="icon"
                            onClick={() => onViewModeChange('desktop')}
                            className={cn("rounded-xl w-12 h-12", viewMode === 'desktop' && "bg-white dark:bg-slate-700 shadow-sm")}
                        >
                            <Monitor className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                        </Button>
                        <Button
                            variant={viewMode === 'mobile' ? 'secondary' : 'ghost'}
                            size="icon"
                            onClick={() => onViewModeChange('mobile')}
                            className={cn("rounded-xl w-12 h-12", viewMode === 'mobile' && "bg-white dark:bg-slate-700 shadow-sm")}
                        >
                            <Smartphone className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-800 transition-all hover:shadow-md">
                        <div className="px-4 py-0 border-r border-slate-100 dark:border-slate-800 hidden sm:block">
                            <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Sync Status</p>
                            <p className="text-sm font-mono font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                {format(lastUpdated, "HH:mm:ss")}
                            </p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onRefresh} className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                            <RefreshCw className={cn("w-5 h-5 text-slate-600 dark:text-slate-300", loading && "animate-spin")} />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
