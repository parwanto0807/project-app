"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InvoiceStatus } from "@/schemas/invoice";

interface InvoiceStatusFilterProps {
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  availableStatus?: string[];
  className?: string;
}

export function InvoiceStatusFilter({ 
  statusFilter, 
  onStatusFilterChange, 
  availableStatus, 
  className = "" 
}: InvoiceStatusFilterProps) {
  
  const allStatuses = [
    { value: "all", label: "Semua Status" },
    { value: "DRAFT", label: "Draft" },
    { value: "WAITING_APPROVAL", label: "Waiting Approval" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
    { value: "UNPAID", label: "Unpaid" },
    { value: "PARTIALLY_PAID", label: "Partially Paid" },
    { value: "PAID", label: "Paid" },
    { value: "OVERDUE", label: "Overdue" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  const statuses = availableStatus 
    ? allStatuses.filter(status => 
        status.value === "all" || availableStatus.includes(status.value as InvoiceStatus)
      )
    : allStatuses;

  return (
    <Select value={statusFilter} onValueChange={onStatusFilterChange}>
      <SelectTrigger className={`w-48 ${className}`}>
        <SelectValue placeholder="Filter Status" />
      </SelectTrigger>
      <SelectContent>
        {statuses.map((status) => (
          <SelectItem key={status.value} value={status.value}>
            {status.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}