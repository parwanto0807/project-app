"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  BadgeCheck,
  BadgeX,
  Edit2,
  FileDigit,
  Contact,
  Globe,
  Home,
  Building,
  Banknote,
  User2,
  ClipboardList,
  Users
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
import { User } from "@/hooks/use-current-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMediaQuery } from "@/hooks/use-media-query";

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

function getBasePath(role?: string) {
    const paths: Record<string, string> = {
        super: "/super-admin-area/master/customers",
        pic: "/pic-area/master/customers",
        admin: "/admin-area/master/customers",
    }
    return paths[role ?? "admin"] || "/admin-area/master/products"
}

export function CustomersTable({
  customers: initialCustomers,
  isLoading,
  role,
}: {
  customers: Customer[];
  isLoading: boolean;
  role: User["role"];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [detailId, setDetailId] = useState<string | null>(null);
  const basePath = getBasePath(role)
  const isMobile = useMediaQuery("(max-width: 768px)");

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

  return (
    <Card className="rounded-2xl border-0 shadow-lg overflow-hidden">
      {/* Header dengan Gradient - Dua Versi berdasarkan Mobile/Desktop */}
      {isMobile ? (
        // Mobile Version
        <div>
          <CardHeader className="flex flex-col gap-4 bg-gradient-to-r from-cyan-600 to-purple-600 p-4 rounded-2xl text-white shadow-lg">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">Customer Management</CardTitle>
                  <p className="text-sm text-white/90">
                    Manage all customers
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          {/* Search and Button for Mobile */}
          <div className="flex flex-col space-y-3 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-white" />
              <Input
                placeholder="Search customers..."
                className="w-full pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:bg-white/30 focus:border-white/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button asChild className="bg-white text-cyan-700 hover:bg-white/90 font-medium">
              <Link href={`${basePath}/create`} className="gap-2">
                <Plus className="h-4 w-4" />
                New Customer
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        // Desktop Version
        <CardHeader className="bg-gradient-to-r from-cyan-600 to-purple-600 p-2 rounded-2xl text-white">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center h-14 w-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                <Users className="h-7 w-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Customer Management</CardTitle>
                <p className="text-sm text-white/90 mt-1">
                  Manage and track all customers in your system
                </p>
              </div>
            </div>
            <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-white" />
                <Input
                  placeholder="Search customers..."
                  className="w-full pl-10 sm:w-64 bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:bg-white/30 focus:border-white/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button asChild className="bg-white text-cyan-700 hover:bg-white/90 font-medium">
                <Link href={`${basePath}/create`} className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Customer
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className="p-0">
        <div className="rounded-b-2xl border bg-white dark:bg-gray-800 shadow-sm dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <TableHeader className="bg-gray-50 dark:bg-gray-700">
                <TableRow>
                  <TableHead className="text-gray-900 dark:text-white font-semibold py-4 px-4 text-sm uppercase">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-cyan-100 dark:bg-cyan-900 rounded-lg">
                        <Building2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      {!isMobile && <span>Customer</span>}
                    </div>
                  </TableHead>
                  <TableHead className="text-gray-900 dark:text-white font-semibold py-4 px-4 text-sm uppercase hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-purple-100 dark:bg-purple-900 rounded-lg">
                        <Contact className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span>Contact</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-gray-900 dark:text-white font-semibold py-4 px-4 text-sm uppercase hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span>Location</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-gray-900 dark:text-white font-semibold py-4 px-4 text-sm uppercase hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-green-100 dark:bg-green-900 rounded-lg">
                        <BadgeCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      {!isMobile && <span>Status</span>}
                    </div>
                  </TableHead>
                  <TableHead className="text-gray-900 dark:text-white font-semibold py-4 px-4 text-sm uppercase text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="p-1.5 bg-gray-100 dark:bg-gray-600 rounded-lg">
                        <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      {!isMobile && <span>Actions</span>}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <TableSkeleton isMobile={isMobile} />
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="px-4 py-8 text-center">
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
                        className={`cursor-pointer transition-colors ${expandedCustomer === customer.id
                          ? 'bg-blue-50 dark:bg-gray-700'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        onClick={() => toggleExpand(customer.id)}
                      >
                        <TableCell className="px-2 py-4">
                          <div className="flex items-center gap-3">
                            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{customer.name}</p>
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                                <Building2 className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                                <span className="truncate">Cabang: {customer.branch ?? "-"}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1 md:hidden">
                                <FileDigit className="h-3 w-3 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{customer.code}</span>
                              </div>
                              {customer.companyType && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1 md:hidden">
                                  <Building className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{customer.companyType}</span>
                                </p>
                              )}
                              {customer.email && (
                                <div className="flex items-center gap-2 mt-1 md:hidden">
                                  <Mail className="h-3 w-3 text-pink-500 dark:text-pink-400 flex-shrink-0" />
                                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {customer.email}
                                  </span>
                                </div>
                              )}

                              {/* Mobile-only status and actions row */}
                              <div className="flex items-center justify-between mt-2 md:hidden">
                                <Badge
                                  variant={customer.isActive ? "default" : "secondary"}
                                  className={`inline-flex items-center gap-1 ${customer.isActive
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

                                <div className="flex items-center gap-2">
                                  {expandedCustomer === customer.id ? (
                                    <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                  ) : (
                                    <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                  )}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full flex-shrink-0"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                        <span className="sr-only">Actions</span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="end"
                                      className="w-48 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                                    >
                                      <DropdownMenuItem asChild>
                                        <Link
                                          href={`${basePath}/update/${customer.id}`}
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
                                        />
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                          <div className="space-y-1">
                            {customer.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-pink-500 dark:text-pink-400 flex-shrink-0" />
                                <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[160px]">
                                  {customer.email}
                                </span>
                              </div>
                            )}
                            {customer.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {customer.phone}
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-wrap whitespace-nowrap hidden md:table-cell">
                          {customer.city && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-orange-500 dark:text-orange-400 flex-shrink-0" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {customer.city}, {customer.province}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                          <Badge
                            variant={customer.isActive ? "default" : "secondary"}
                            className={`flex items-center gap-1 ${customer.isActive
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
                        <TableCell className="px-4 py-4 whitespace-nowrap text-right hidden md:table-cell">
                          <div className="flex justify-end items-center gap-2">
                            {expandedCustomer === customer.id ? (
                              <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full flex-shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-48 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                              >
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`${basePath}/update/${customer.id}`}
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
                                  />
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>

                      {expandedCustomer === customer.id && (
                        <TableRow className="bg-blue-50 dark:bg-gray-700">
                          <TableCell colSpan={5} className="px-4 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                              <div className="space-y-3">
                                <h4 className="font-medium flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm">
                                  <ClipboardList className="h-4 w-4 flex-shrink-0" />
                                  Company Details
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-start gap-3">
                                    <FileDigit className="h-4 w-4 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs text-gray-500 dark:text-gray-400">Code</p>
                                      <p className="font-medium text-gray-700 dark:text-gray-300 truncate">{customer.code}</p>
                                    </div>
                                  </div>
                                  {customer.taxNumber && (
                                    <div className="flex items-start gap-3">
                                      <Banknote className="h-4 w-4 text-purple-500 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Tax ID</p>
                                        <p className="font-medium text-gray-700 dark:text-gray-300 truncate">{customer.taxNumber}</p>
                                      </div>
                                    </div>
                                  )}
                                  {customer.branch && (
                                    <div className="flex items-start gap-3">
                                      <Home className="h-4 w-4 text-indigo-500 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Branch</p>
                                        <p className="font-medium text-gray-700 dark:text-gray-300 truncate">{customer.branch}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-3">
                                <h4 className="font-medium flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm">
                                  <Contact className="h-4 w-4 flex-shrink-0" />
                                  Contact Info
                                </h4>
                                <div className="space-y-2 text-sm">
                                  {customer.email && (
                                    <div className="flex items-start gap-3">
                                      <Mail className="h-4 w-4 text-pink-500 dark:text-pink-400 mt-0.5 flex-shrink-0" />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                                        <p className="font-medium text-gray-700 dark:text-gray-300 break-all">{customer.email}</p>
                                      </div>
                                    </div>
                                  )}
                                  {customer.phone && (
                                    <div className="flex items-start gap-3">
                                      <Phone className="h-4 w-4 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                                        <p className="font-medium text-gray-700 dark:text-gray-300">{customer.phone}</p>
                                      </div>
                                    </div>
                                  )}
                                  {customer.contactPerson && (
                                    <div className="flex items-start gap-3">
                                      <User2 className="h-4 w-4 text-teal-500 dark:text-teal-400 mt-0.5 flex-shrink-0" />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Contact Person</p>
                                        <p className="font-medium text-gray-700 dark:text-gray-300 truncate">{customer.contactPerson}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-3">
                                <h4 className="font-medium flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm">
                                  <MapPin className="h-4 w-4 flex-shrink-0" />
                                  Location
                                </h4>
                                <div className="space-y-2 text-sm">
                                  {customer.address && (
                                    <div className="flex items-start gap-3">
                                      <Globe className="h-4 w-4 text-orange-500 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Address</p>
                                        <p className="font-medium text-wrap text-gray-700 dark:text-gray-300">{customer.address}</p>
                                      </div>
                                    </div>
                                  )}
                                  {(customer.city || customer.province) && (
                                    <div className="flex items-start gap-3">
                                      <MapPin className="h-4 w-4 text-orange-500 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">City/Province</p>
                                        <p className="font-medium text-gray-700 dark:text-gray-300">
                                          {customer.city}{customer.province ? `, ${customer.province}` : ''}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                  {customer.postalCode && (
                                    <div className="flex items-start gap-3">
                                      <FileDigit className="h-4 w-4 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Postal Code</p>
                                        <p className="font-medium text-gray-700 dark:text-gray-300">{customer.postalCode}</p>
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
      </CardContent>
    </Card>
  );
}

function TableSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell className="px-4 py-4">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-5 w-5 rounded-full dark:bg-gray-700 flex-shrink-0" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-[120px] rounded-full dark:bg-gray-700" />
                <Skeleton className="h-3 w-[80px] rounded-full dark:bg-gray-700 md:hidden" />
              </div>
            </div>
          </TableCell>
          {!isMobile && (
            <>
              <TableCell className="px-4 py-4 hidden md:table-cell">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[160px] rounded-full dark:bg-gray-700" />
                  <Skeleton className="h-4 w-[120px] rounded-full dark:bg-gray-700" />
                </div>
              </TableCell>
              <TableCell className="px-4 py-4 hidden md:table-cell">
                <Skeleton className="h-4 w-[100px] rounded-full dark:bg-gray-700" />
              </TableCell>
              <TableCell className="px-4 py-4 hidden md:table-cell">
                <Skeleton className="h-6 w-[70px] rounded-full dark:bg-gray-700" />
              </TableCell>
              <TableCell className="px-4 py-4 text-right hidden md:table-cell">
                <div className="flex justify-end space-x-2">
                  <Skeleton className="h-8 w-8 rounded-full dark:bg-gray-700" />
                  <Skeleton className="h-8 w-8 rounded-full dark:bg-gray-700" />
                </div>
              </TableCell>
            </>
          )}
        </TableRow>
      ))}
    </>
  );
}