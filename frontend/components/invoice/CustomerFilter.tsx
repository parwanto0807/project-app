"use client";

import { useEffect, useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { fetchAllCustomers } from "@/lib/action/master/customer";

interface CustomerFilterProps {
    customerFilter: string;
    onCustomerFilterChange: (value: string) => void;
    className?: string;
}

export function CustomerFilter({
    customerFilter,
    onCustomerFilterChange,
    className = "",
}: CustomerFilterProps) {
    const [customers, setCustomers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        async function loadCustomers() {
            setIsLoading(true);
            const res = await fetchAllCustomers();
            if (res && res.customers) {
                setCustomers(res.customers);
            }
            setIsLoading(false);
        }
        loadCustomers();
    }, []);

    return (
        <Select value={customerFilter} onValueChange={onCustomerFilterChange} disabled={isLoading}>
            <SelectTrigger className={`w-64 ${className}`}>
                <SelectValue placeholder={isLoading ? "Loading..." : "Filter Pelanggan"} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Semua Pelanggan</SelectItem>
                {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
