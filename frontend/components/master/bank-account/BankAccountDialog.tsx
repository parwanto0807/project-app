"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { bankAccountCreateSchema, BankAccountCreateSchema } from "@/schemas/bank/index";
import { BankAccount } from "@/types/bankAccount";
import { coaApi } from "@/lib/action/coa/coa";
import { ChartOfAccountsWithRelations, CoaPostingType } from "@/types/coa";
import { toast } from "sonner";
import { Building, CreditCard, User, Landmark, Hash, CheckCircle, RefreshCw } from "lucide-react";

interface BankAccountDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    bankAccount?: BankAccount | null;
    onSubmit: (data: BankAccountCreateSchema) => Promise<void>;
}

export function BankAccountDialog({
    open,
    onOpenChange,
    bankAccount,
    onSubmit,
}: BankAccountDialogProps) {
    const [coas, setCoas] = useState<ChartOfAccountsWithRelations[]>([]);
    const [loadingCoa, setLoadingCoa] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<BankAccountCreateSchema>({
        resolver: zodResolver(bankAccountCreateSchema),
        defaultValues: {
            bankName: "",
            accountNumber: "",
            accountHolder: "",
            branch: "",
            isActive: true,
            accountCOAId: "",
        },
    });

    useEffect(() => {
        if (open) {
            const fetchCoa = async () => {
                setLoadingCoa(true);
                try {
                    const response = await coaApi.getCOAs();
                    if (response.success) {
                        setCoas(response.data.filter((c: ChartOfAccountsWithRelations) => c.postingType === CoaPostingType.POSTING));
                    }
                } catch (error) {
                    toast.error("Failed to load Chart of Accounts");
                } finally {
                    setLoadingCoa(false);
                }
            };
            fetchCoa();
        }
    }, [open]);

    useEffect(() => {
        if (open) {
            if (bankAccount) {
                form.reset({
                    bankName: bankAccount.bankName,
                    accountNumber: bankAccount.accountNumber,
                    accountHolder: bankAccount.accountHolder,
                    branch: bankAccount.branch || "",
                    isActive: bankAccount.isActive,
                    accountCOAId: bankAccount.accountCOAId || "",
                });
            } else {
                form.reset({
                    bankName: "",
                    accountNumber: "",
                    accountHolder: "",
                    branch: "",
                    isActive: true,
                    accountCOAId: "",
                });
            }
        }
    }, [bankAccount, form, open]);

    const handleFormSubmit = async (data: BankAccountCreateSchema) => {
        setIsSubmitting(true);
        try {
            await onSubmit(data);
            onOpenChange(false);
            form.reset();
        } catch (error) {
            // Error handled in parent/toast
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-0 shadow-2xl">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Building className="h-6 w-6" />
                        {bankAccount ? "Edit Bank Account" : "Add Bank Account"}
                    </DialogTitle>
                    <DialogDescription className="text-blue-100 mt-1">
                        {bankAccount
                            ? "Update existing bank account information and mapping."
                            : "Register a new bank account to the system."}
                    </DialogDescription>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="p-6 space-y-5 bg-white dark:bg-slate-900">
                        <div className="grid grid-cols-1 gap-5">
                            <FormField
                                control={form.control}
                                name="bankName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                            <Landmark className="h-4 w-4 text-blue-500" />
                                            Bank Name
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Bank Central Asia (BCA)" {...field} className="h-11 focus:ring-blue-500" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="accountNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                                <Hash className="h-4 w-4 text-blue-500" />
                                                Account Number
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="0123456789" {...field} className="h-11 font-mono tracking-wider" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="accountHolder"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                                <User className="h-4 w-4 text-blue-500" />
                                                Account Holder
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="PT. Example Indonesia" {...field} className="h-11" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="branch"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-700 dark:text-slate-300">Branch (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. KCP Sudirman" {...field} value={field.value || ""} className="h-11" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="accountCOAId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                            <CreditCard className="h-4 w-4 text-blue-500" />
                                            Accounting Mapping (COA)
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value || ""}
                                            disabled={loadingCoa}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="h-11">
                                                    <SelectValue placeholder={loadingCoa ? "Loading COA..." : "Select COA Account"} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="max-h-[300px]">
                                                {coas.map((coa) => (
                                                    <SelectItem key={coa.id} value={coa.id}>
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold">{coa.code}</span>
                                                            <span className="text-xs text-muted-foreground">{coa.name}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="isActive"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-slate-50 dark:bg-slate-800/50">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base font-semibold">Status Active</FormLabel>
                                            <div className="text-sm text-slate-500 dark:text-slate-400 font-light">
                                                Enable or disable this bank account for transactions.
                                            </div>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                className="data-[state=checked]:bg-blue-600"
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter className="pt-4 border-t gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                className="h-11 font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all active:scale-95 min-w-[120px]"
                            >
                                {isSubmitting ? (
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                )}
                                {bankAccount ? "Update Changes" : "Save Bank Account"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
