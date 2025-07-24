"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  MoreVertical,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import DeleteCustomerAlert from "./alert-delete";
import ViewCustomerDetailDialogById from "./detail-data";

type Customer = {
  id: string;
  code: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  branch: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  taxNumber: string | null;
  companyType: string | null;
  contactPerson: string | null;
  picPhone: string | null;
  picEmail: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function CustomersTable({
  customers: initialCustomers,
  isLoading,
}: {
  customers: Customer[];
  isLoading: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    setCustomers(initialCustomers);
  }, [initialCustomers]);


  const filteredCustomers = customers.filter((customer) =>
    `${customer.code} ${customer.name} ${customer.email} ${customer.phone}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const toggleExpand = (customerId: string) => {
    setExpandedCustomer(expandedCustomer === customerId ? null : customerId);
  };



  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 border-b">
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            className="pl-10 w-full md:w-[300px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button asChild>
          <Link href="/super-admin-area/master/customers/create" className="gap-2">
            <Plus className="h-4 w-4" />
            New Customer
          </Link>
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Code</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton />
            ) : filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No customers found
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <React.Fragment key={customer.id}>
                  <TableRow
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleExpand(customer.id)}
                  >
                    <TableCell className="font-medium">{customer.code}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          {customer.companyType && (
                            <p className="text-sm text-muted-foreground">
                              {customer.companyType}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {customer.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{customer.email}</span>
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{customer.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.city && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {customer.city}, {customer.province}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={customer.isActive ? "default" : "secondary"}>
                        {customer.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2">
                        {expandedCustomer === customer.id ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDetailId(customer.id)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/super-admin-area/master/customers/update/${customer.id}`}>Edit</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <DeleteCustomerAlert
                                id={customer.id}
                                onDelete={() => setCustomers((prev) => prev.filter((c) => c.id !== customer.id))}
                              />
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                      </div>
                    </TableCell>
                  </TableRow>

                  {expandedCustomer === customer.id && (
                    <TableRow className="bg-muted/10">
                      <TableCell colSpan={6}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
                          <div className="space-y-2">
                            <h4 className="font-medium flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Company Details
                            </h4>
                            <div className="space-y-1 text-sm">
                              {customer.taxNumber && (
                                <p>
                                  <span className="text-muted-foreground">Tax ID:</span>{" "}
                                  {customer.taxNumber}
                                </p>
                              )}
                              {customer.branch && (
                                <p>
                                  <span className="text-muted-foreground">Branch:</span>{" "}
                                  {customer.branch}
                                </p>
                              )}
                              {customer.postalCode && (
                                <p>
                                  <span className="text-muted-foreground">Postal Code:</span>{" "}
                                  {customer.postalCode}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-medium flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              Contact Person
                            </h4>
                            <div className="space-y-1 text-sm">
                              {customer.contactPerson && <p>{customer.contactPerson}</p>}
                              {customer.picEmail && (
                                <p className="flex items-center gap-2">
                                  <Mail className="h-4 w-4" />
                                  {customer.picEmail}
                                </p>
                              )}
                              {customer.picPhone && (
                                <p className="flex items-center gap-2">
                                  <Phone className="h-4 w-4" />
                                  {customer.picPhone}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-medium flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              Address
                            </h4>
                            {customer.address && (
                              <p className="text-sm">{customer.address}</p>
                            )}
                            {customer.notes && (
                              <>
                                <h4 className="font-medium flex items-center gap-2 mt-4">
                                  <FileText className="h-4 w-4" />
                                  Notes
                                </h4>
                                <p className="text-sm">{customer.notes}</p>
                              </>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>

        </Table>
        {detailId && (
          <ViewCustomerDetailDialogById
            id={detailId}
            open={!!detailId}
            onOpenChange={(open) => {
              if (!open) setDetailId(null); // HARUS pastikan null
            }}
          />
        )}

      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-[80px]" />
          </TableCell>
          <TableCell>
            <div className="flex items-center space-x-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-3 w-[80px]" />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <div className="space-y-2">
              <Skeleton className="h-4 w-[160px]" />
              <Skeleton className="h-4 w-[120px]" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[100px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-[70px] rounded-full" />
          </TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end space-x-2">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}