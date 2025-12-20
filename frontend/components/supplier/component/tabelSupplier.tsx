"use client";

import { Supplier, SupplierContact, SupplierBankAccount } from "@/types/supplierType";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// Import DropdownMenuSeparator jika belum
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  Mail,
  Phone,
  Globe,
  User,
  CreditCard,
  MapPin,
  Calendar,
  ChevronDown,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Download,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


export interface SupplierTableProps {
  suppliers: Supplier[];
  isLoading?: boolean;
  highlightId?: string | null;
  onDelete?: (id: string) => void;
  onExport?: (supplier: Supplier) => void;
}

export function SupplierTable({
  suppliers,
  isLoading = false,
  highlightId,
  onDelete,
  onExport,
}: SupplierTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);


  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusConfig = (status: string) => {
    const config = {
      ACTIVE: { variant: "success" as const, label: "Active" },
      INACTIVE: { variant: "secondary" as const, label: "Inactive" },
      BLACKLISTED: { variant: "destructive" as const, label: "Blacklisted" },
      PENDING: { variant: "warning" as const, label: "Pending" },
    };
    return config[status as keyof typeof config] || { variant: "secondary" as const, label: status };
  };

  const DetailCard = ({ supplier }: { supplier: Supplier }) => (
    <Card className="mt-2 border-l-4 border-l-primary">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Contact Information */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              Contact Information
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <span>{supplier.email || "-"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3 text-muted-foreground" />
                <span>{supplier.phone || "-"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-3 w-3 text-muted-foreground" />
                <span>{supplier.website || "-"}</span>
              </div>
            </div>

            {/* Tax Information */}
            <div className="pt-2 border-t">
              <h5 className="font-medium text-xs text-muted-foreground mb-1">Tax Information</h5>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Taxable:</span>
                  <Badge variant={supplier.isTaxable ? "default" : "secondary"}>
                    {supplier.isTaxable ? "Yes" : "No"}
                  </Badge>
                </div>
                {supplier.npwp && (
                  <div className="flex justify-between">
                    <span>NPWP:</span>
                    <span className="font-mono text-xs">{supplier.npwp}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Billing Address</p>
                <p className="text-sm">{supplier.billingAddress || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Shipping Address</p>
                <p className="text-sm">{supplier.shippingAddress || "-"}</p>
              </div>
            </div>

            {/* Category & Terms */}
            <div className="pt-2 border-t">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="font-medium">{supplier.supplierCategory?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payment Terms</p>
                  <p className="font-medium">
                    {supplier.termOfPayment
                      ? `${supplier.termOfPayment.name} (${supplier.termOfPayment.days} days)`
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Additional Information
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(supplier.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span>{formatDate(supplier.updatedAt)}</span>
              </div>
              {supplier.contacts && supplier.contacts.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Contacts ({supplier.contacts.length})</p>
                  <div className="space-y-1">
                    {supplier.contacts.slice(0, 2).map((contact: SupplierContact) => (
                      <div key={contact.id} className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        <span className="text-xs">{contact.name} {contact.isPrimary && "(Primary)"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bank Accounts Section */}
        {supplier.bankAccounts && supplier.bankAccounts.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
              <CreditCard className="h-4 w-4" />
              Bank Accounts ({supplier.bankAccounts.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {supplier.bankAccounts.map((account: SupplierBankAccount) => (
                <Card key={account.id} className={cn(
                  "border",
                  account.isPrimary && "border-primary border-2"
                )}>
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">{account.bankName}</span>
                        {account.isPrimary && (
                          <Badge variant="outline">Primary</Badge>
                        )}
                      </div>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Account Holder:</span>
                          <span className="font-medium">{account.accountHolderName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Account Number:</span>
                          <span className="font-mono">{account.accountNumber}</span>
                        </div>
                        {account.branch && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Branch:</span>
                            <span>{account.branch}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 pt-4 border-t flex justify-end gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin-area/master/supplier/${supplier.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin-area/master/supplier/${supplier.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          {onExport && (
            <Button variant="outline" size="sm" onClick={() => onExport(supplier)}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (suppliers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Suppliers Found</h3>
          <p className="text-muted-foreground text-center mb-6">
            Get started by adding your first supplier to the system.
          </p>
          <Button asChild>
            <Link href="/admin-area/master/supplier/create">
              Add New Supplier
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <Card>
        <Table>
          <TableHeader>
            <TableRow>

              <TableHead>Supplier</TableHead>
              <TableHead className="hidden md:table-cell">Contact</TableHead>
              <TableHead className="hidden lg:table-cell">Category</TableHead>
              <TableHead className="hidden xl:table-cell">Terms</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((supplier) => {
              const isExpanded = expandedRows.has(supplier.id);
              const statusConfig = getStatusConfig(supplier.status);
              const isHighlighted = supplier.id === highlightId;

              return (
                <React.Fragment key={supplier.id}>
                  <TableRow
                    key={supplier.id}
                    className={cn(
                      "hover:bg-muted/50 transition-colors",
                      isHighlighted && "bg-yellow-50 dark:bg-yellow-900/20",
                      isExpanded && "bg-muted/30"
                    )}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-10 w-10 rounded-lg flex items-center justify-center",
                          "bg-primary/10 text-primary"
                        )}>
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-semibold hover:text-primary transition-colors">
                            <Link href={`/admin-area/master/supplier/${supplier.id}`}>
                              {supplier.name}
                            </Link>
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {supplier.code}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-[180px]">{supplier.email || "-"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm">
                          <Phone className="h-3 w-3" />
                          <span>{supplier.phone || "-"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="outline" className="font-normal">
                        {supplier.supplierCategory?.name || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <div className="text-sm">
                        {supplier.termOfPayment ? (
                          <div>
                            <div className="font-medium">{supplier.termOfPayment.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {supplier.termOfPayment.days === 0 ? "COD" : `${supplier.termOfPayment.days} days`}
                            </div>
                          </div>
                        ) : (
                          "-"
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig.variant} className="capitalize">
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleRow(supplier.id)}
                          className={cn(
                            "group h-10 w-10 rounded-lg border-2 transition-all duration-300",
                            "hover:border-primary/50 hover:bg-primary/5",
                            "active:scale-95 active:bg-primary/10",
                            "focus-visible:ring-2 focus-visible:ring-primary/20",
                            isExpanded
                              ? "border-primary bg-primary/10 text-primary shadow-sm"
                              : "border-gray-200 dark:border-gray-700 hover:border-primary"
                          )}
                          aria-label={isExpanded ? "Collapse supplier details" : "Expand supplier details"}
                        >
                          {/* Animated chevron */}
                          <div className="relative flex items-center justify-center">
                            <ChevronDown className={cn(
                              "h-4 w-4 transition-all duration-500 ease-out",
                              isExpanded
                                ? "rotate-180 opacity-100 scale-110"
                                : "group-hover:scale-110 text-gray-500 dark:text-gray-400 group-hover:text-primary"
                            )} />
                          </div>

                          {/* Hover tooltip text */}
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-foreground text-background text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                            {isExpanded ? "Hide details" : "Show details"}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground rotate-45"></div>
                          </div>
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 border border-blue-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/40"
                          asChild
                        >
                          <Link href={`/admin-area/master/supplier/update/${supplier.id}`}>
                            <Edit className="h-4.5 w-4.5" />
                          </Link>
                        </Button>

                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 border border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/40"
                          onClick={() => {
                            setSupplierToDelete(supplier.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={7} className="p-0 border-b-0">
                        <DetailCard supplier={supplier} />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Summary Stats */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span>
            Active: {suppliers.filter(s => s.status === "ACTIVE").length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <span>
            Blacklisted: {suppliers.filter(s => s.status === "BLACKLISTED").length}
          </span>
        </div>
        <div className="ml-auto">
          Total Suppliers: {suppliers.length}
        </div>
      </div>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the supplier
              and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSupplierToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (supplierToDelete && onDelete) {
                  onDelete(supplierToDelete);
                }
                setDeleteDialogOpen(false);
                setSupplierToDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

