"use client";

import { useEffect, useState, useCallback } from "react";
import HeaderCard from "@/components/ui/header-card";
import { TableBankAccount } from "@/components/master/bank-account/TableBankAccount";
import { BankAccountDialog } from "@/components/master/bank-account/BankAccountDialog";
import {
    getBankAccounts,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount
} from "@/lib/action/master/bank/bank";
import { BankAccount } from "@/types/bankAccount";
import { BankAccountCreateSchema } from "@/schemas/bank/index";
import { toast } from "sonner";
import { Landmark, AlertCircle, RefreshCw, Home, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";

export default function BankAccountPage() {
    const [data, setData] = useState<BankAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);

    const fetchBankAccounts = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const result = await getBankAccounts();
            // Ensure the data matches our BankAccount type
            setData(result as unknown as BankAccount[]);
        } catch (error) {
            console.error("Error fetching bank accounts:", error);
            setIsError(true);
            toast.error("Failed to load bank accounts. Please check your connection.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBankAccounts();
    }, [fetchBankAccounts]);

    const handleAddAccount = () => {
        setSelectedAccount(null);
        setDialogOpen(true);
    };

    const handleEditAccount = (account: BankAccount) => {
        setSelectedAccount(account);
        setDialogOpen(true);
    };

    const handleDeleteAccount = async (id: string) => {
        if (!confirm("Are you sure you want to delete this bank account? This action cannot be undone.")) return;

        try {
            await deleteBankAccount(id);
            toast.success("Bank account deleted successfully");
            fetchBankAccounts();
        } catch (error) {
            toast.error("Failed to delete bank account");
        }
    };

    const handleDialogSubmit = async (payload: BankAccountCreateSchema) => {
        try {
            if (selectedAccount) {
                await updateBankAccount(selectedAccount.id, payload);
                toast.success("Bank account updated successfully");
            } else {
                await createBankAccount(payload);
                toast.success("Bank account created successfully");
            }
            fetchBankAccounts();
            setDialogOpen(false);
        } catch (error) {
            toast.error(selectedAccount ? "Failed to update bank account" : "Failed to create bank account");
            throw error;
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center">
                <Badge variant="outline" className="px-3 py-1.5 rounded-full bg-white/50 backdrop-blur-sm dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-800">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <Link href="/admin-area" className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                                        <Home className="h-3.5 w-3.5" />
                                        <span className="text-xs font-medium">Dashboard</span>
                                    </Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator>
                                <ChevronRight className="h-3 w-3 text-slate-400" />
                            </BreadcrumbSeparator>
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <Link href="#" className="text-xs font-medium hover:text-blue-600 transition-colors">
                                        Master
                                    </Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator>
                                <ChevronRight className="h-3 w-3 text-slate-400" />
                            </BreadcrumbSeparator>
                            <BreadcrumbItem>
                                <BreadcrumbPage className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                    Bank Account
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </Badge>
            </div>

            <HeaderCard
                title="Bank Accounts Management"
                description="Configure and manage corporate bank accounts, set active status, and map them to the Chart of Accounts for automated accounting."
                icon={<Landmark className="h-7 w-7 text-white" />}
                gradientFrom="from-blue-600"
                gradientTo="to-indigo-800"
                backgroundStyle="pattern"
                variant="elegant"
            />

            <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl p-1 md:p-4 border border-slate-100 dark:border-slate-800">
                {isError ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-full">
                            <AlertCircle className="h-12 w-12 text-red-500" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold">Something went wrong</h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                                We encountered an error while trying to fetch the bank accounts data.
                            </p>
                        </div>
                        <Button onClick={fetchBankAccounts} variant="outline" className="mt-4">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try Again
                        </Button>
                    </div>
                ) : (
                    <TableBankAccount
                        data={data}
                        isLoading={isLoading}
                        onAdd={handleAddAccount}
                        onEdit={handleEditAccount}
                        onDelete={handleDeleteAccount}
                        onRefresh={fetchBankAccounts}
                    />
                )}
            </div>

            <BankAccountDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                bankAccount={selectedAccount}
                onSubmit={handleDialogSubmit}
            />
        </div>
    );
}
