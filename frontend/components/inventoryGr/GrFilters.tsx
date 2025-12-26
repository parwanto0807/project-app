'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Calendar, FilterX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DocumentStatus } from '@/types/grInventoryType';


interface GrFiltersProps {
    initialFilters?: {
        search?: string;
        status?: DocumentStatus;
        startDate?: Date;
        endDate?: Date;
        warehouseId?: string;
    };
}

export function GrFilters({ initialFilters }: GrFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState(initialFilters?.search || '');
    const [status, setStatus] = useState<DocumentStatus | 'all'>(initialFilters?.status || 'all');
    const [startDate, setStartDate] = useState<Date | undefined>(initialFilters?.startDate);
    const [endDate, setEndDate] = useState<Date | undefined>(initialFilters?.endDate);
    const [warehouseId, setWarehouseId] = useState(initialFilters?.warehouseId || 'all');

    // Sync with URL params
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());

        if (search) params.set('search', search);
        else params.delete('search');

        if (status !== 'all') params.set('status', status);
        else params.delete('status');

        if (startDate) params.set('startDate', startDate.toISOString());
        else params.delete('startDate');

        if (endDate) params.set('endDate', endDate.toISOString());
        else params.delete('endDate');

        if (warehouseId !== 'all') params.set('warehouseId', warehouseId);
        else params.delete('warehouseId');

        params.delete('page'); // Reset to page 1 when filters change

        router.push(`?${params.toString()}`);
    }, [search, status, startDate, endDate, warehouseId]);

    const handleClearFilters = () => {
        setSearch('');
        setStatus('all');
        setStartDate(undefined);
        setEndDate(undefined);
        setWarehouseId('all');
    };

    return (
        <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Search by GR number, vendor, delivery note..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Status Filter */}
            <Select value={status} onValueChange={(value: DocumentStatus | 'all') => setStatus(value)}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value={DocumentStatus.DRAFT}>Draft</SelectItem>
                    <SelectItem value={DocumentStatus.COMPLETED}>Completed</SelectItem>
                    <SelectItem value={DocumentStatus.CANCELLED}>Cancelled</SelectItem>
                </SelectContent>
            </Select>

            {/* Date Range */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            "w-[240px] justify-start text-left font-normal",
                            (!startDate && !endDate) && "text-muted-foreground"
                        )}
                    >
                        <Calendar className="mr-2 h-4 w-4" />
                        {startDate ? (
                            endDate ? (
                                <>
                                    {format(startDate, "LLL dd, y")} - {format(endDate, "LLL dd, y")}
                                </>
                            ) : (
                                format(startDate, "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date range</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                        initialFocus
                        mode="range"
                        selected={{ from: startDate, to: endDate }}
                        onSelect={(range) => {
                            setStartDate(range?.from);
                            setEndDate(range?.to);
                        }}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>

            {/* Clear Filters */}
            {(search || status !== 'all' || startDate || endDate || warehouseId !== 'all') && (
                <Button
                    variant="ghost"
                    onClick={handleClearFilters}
                    className="flex items-center gap-2"
                >
                    <FilterX className="h-4 w-4" />
                    Clear
                </Button>
            )}
        </div>
    );
}