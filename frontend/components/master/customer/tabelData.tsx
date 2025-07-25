"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  // FileText,
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  BadgeCheck,
  BadgeX,
  Edit2,
  // Trash2,
  Eye,
  Calendar,
  FileDigit,
  Contact,
  Globe,
  Home,
  Notebook,
  Building,
  // Map,
  Banknote,
  User2,
  ClipboardList
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
    if (detailId) return;
    setExpandedCustomer(expandedCustomer === customerId ? null : customerId);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      setTimeout(() => setDetailId(null), 100);
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="rounded-xl border bg-white dark:bg-gray-800 shadow-sm dark:border-gray-700">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 border-b dark:border-gray-700">
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-400" />
          <Input
            id="search-input"
            placeholder="Search customers..."
            className="pl-10 w-full md:w-[350px] rounded-lg border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg shadow-sm">
          <Link href="/super-admin-area/master/customers/create" className="gap-2">
            <Plus className="h-4 w-4" />
            New Customer
          </Link>
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <TableHeader className="bg-gray-50 dark:bg-gray-700">
            <TableRow>
              <TableHead className="w-[100px] px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Code
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Customer
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Contact
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Location
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <TableSkeleton />
            ) : filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="px-6 py-8 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                    <Search className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-4" />
                    <p className="text-lg font-medium">No customers found</p>
                    <p className="text-sm">Try adjusting your search query</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <React.Fragment key={customer.id}>
                  <TableRow
                    className={`cursor-pointer transition-colors ${
                      expandedCustomer === customer.id 
                        ? 'bg-blue-50 dark:bg-gray-700' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => toggleExpand(customer.id)}
                  >
                    <TableCell className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">
                      <div className="flex items-center gap-2">
                        <FileDigit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span>{customer.code}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{customer.name}</p>
                          {customer.companyType && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {customer.companyType}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {customer.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-pink-500 dark:text-pink-400" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{customer.email}</span>
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-green-500 dark:text-green-400" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{customer.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      {customer.city && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {customer.city}, {customer.province}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={customer.isActive ? "default" : "secondary"}
                        className={`flex items-center gap-1 ${
                          customer.isActive 
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        }`}
                      >
                        {customer.isActive ? (
                          <>
                            <BadgeCheck className="h-3 w-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <BadgeX className="h-3 w-3" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end items-center gap-2">
                        {expandedCustomer === customer.id ? (
                          <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            align="end" 
                            className="w-48 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                          >
                            <DropdownMenuItem 
                              onClick={() => setDetailId(customer.id)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer"
                            >
                              <Eye className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="border-t border-gray-200 dark:border-gray-600" />
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/super-admin-area/master/customers/update/${customer.id}`}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-gray-700 cursor-pointer"
                              >
                                <Edit2 className="h-4 w-4 text-green-500 dark:text-green-400" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="border-t border-gray-200 dark:border-gray-600" />
                            <DropdownMenuItem asChild>
                              <DeleteCustomerAlert
                                id={customer.id}
                                onDelete={() => setCustomers((prev) => prev.filter((c) => c.id !== customer.id))}
                                // className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-gray-700 cursor-pointer w-full"
                              >
                                {/* <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                                Delete */}
                              </DeleteCustomerAlert>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>

                  {expandedCustomer === customer.id && (
                    <TableRow className="bg-blue-50 dark:bg-gray-700">
                      <TableCell colSpan={6} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                          <div className="space-y-4">
                            <h4 className="font-medium flex items-center gap-2 text-blue-600 dark:text-blue-400">
                              <ClipboardList className="h-5 w-5" />
                              Company Details
                            </h4>
                            <div className="space-y-3 text-sm">
                              {customer.taxNumber && (
                                <div className="flex items-start gap-3">
                                  <Banknote className="h-4 w-4 text-purple-500 dark:text-purple-400 mt-0.5" />
                                  <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Tax ID</p>
                                    <p className="font-medium text-gray-700 dark:text-gray-300">{customer.taxNumber}</p>
                                  </div>
                                </div>
                              )}
                              {customer.branch && (
                                <div className="flex items-start gap-3">
                                  <Home className="h-4 w-4 text-indigo-500 dark:text-indigo-400 mt-0.5" />
                                  <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Branch</p>
                                    <p className="font-medium text-gray-700 dark:text-gray-300">{customer.branch}</p>
                                  </div>
                                </div>
                              )}
                              {customer.postalCode && (
                                <div className="flex items-start gap-3">
                                  <FileDigit className="h-4 w-4 text-blue-500 dark:text-blue-400 mt-0.5" />
                                  <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Postal Code</p>
                                    <p className="font-medium text-gray-700 dark:text-gray-300">{customer.postalCode}</p>
                                  </div>
                                </div>
                              )}
                              <div className="flex items-start gap-3">
                                <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5" />
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
                                  <p className="font-medium text-gray-700 dark:text-gray-300">{formatDate(customer.createdAt)}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="font-medium flex items-center gap-2 text-blue-600 dark:text-blue-400">
                              <Contact className="h-5 w-5" />
                              Contact Person
                            </h4>
                            <div className="space-y-3 text-sm">
                              {customer.contactPerson && (
                                <div className="flex items-start gap-3">
                                  <User2 className="h-4 w-4 text-teal-500 dark:text-teal-400 mt-0.5" />
                                  <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
                                    <p className="font-medium text-gray-700 dark:text-gray-300">{customer.contactPerson}</p>
                                  </div>
                                </div>
                              )}
                              {customer.picEmail && (
                                <div className="flex items-start gap-3">
                                  <Mail className="h-4 w-4 text-pink-500 dark:text-pink-400 mt-0.5" />
                                  <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                                    <p className="font-medium text-gray-700 dark:text-gray-300">{customer.picEmail}</p>
                                  </div>
                                </div>
                              )}
                              {customer.picPhone && (
                                <div className="flex items-start gap-3">
                                  <Phone className="h-4 w-4 text-green-500 dark:text-green-400 mt-0.5" />
                                  <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                                    <p className="font-medium text-gray-700 dark:text-gray-300">{customer.picPhone}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="font-medium flex items-center gap-2 text-blue-600 dark:text-blue-400">
                              <MapPin className="h-5 w-5" />
                              Address & Notes
                            </h4>
                            <div className="space-y-3 text-sm">
                              {customer.address && (
                                <div className="flex items-start gap-3">
                                  <Globe className="h-4 w-4 text-orange-500 dark:text-orange-400 mt-0.5" />
                                  <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Full Address</p>
                                    <p className="font-medium text-gray-700 dark:text-gray-300">{customer.address}</p>
                                  </div>
                                </div>
                              )}
                              {customer.notes && (
                                <div className="flex items-start gap-3">
                                  <Notebook className="h-4 w-4 text-yellow-500 dark:text-yellow-400 mt-0.5" />
                                  <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Notes</p>
                                    <p className="font-medium text-gray-700 dark:text-gray-300">{customer.notes}</p>
                                  </div>
                                </div>
                              )}
                            </div>
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
            onOpenChange={handleDialogOpenChange}
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
          <TableCell className="px-6 py-4">
            <Skeleton className="h-4 w-[80px] rounded-full dark:bg-gray-700" />
          </TableCell>
          <TableCell className="px-6 py-4">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-5 w-5 rounded-full dark:bg-gray-700" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-[120px] rounded-full dark:bg-gray-700" />
                <Skeleton className="h-3 w-[80px] rounded-full dark:bg-gray-700" />
              </div>
            </div>
          </TableCell>
          <TableCell className="px-6 py-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-[160px] rounded-full dark:bg-gray-700" />
              <Skeleton className="h-4 w-[120px] rounded-full dark:bg-gray-700" />
            </div>
          </TableCell>
          <TableCell className="px-6 py-4">
            <Skeleton className="h-4 w-[100px] rounded-full dark:bg-gray-700" />
          </TableCell>
          <TableCell className="px-6 py-4">
            <Skeleton className="h-6 w-[70px] rounded-full dark:bg-gray-700" />
          </TableCell>
          <TableCell className="px-6 py-4 text-right">
            <div className="flex justify-end space-x-2">
              <Skeleton className="h-8 w-8 rounded-full dark:bg-gray-700" />
              <Skeleton className="h-8 w-8 rounded-full dark:bg-gray-700" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}