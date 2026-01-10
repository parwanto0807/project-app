"use client";

import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Search,
    Building,
    Edit,
    Trash2,
    Plus,
    CreditCard,
    User,
    Hash,
    Activity,
    MapPin,
    RefreshCw,
    Shield,
    QrCode,
    Copy,
    Eye,
    EyeOff,
    RadioTower,
    Filter,
    CheckCircle2,
    MoreVertical,
} from "lucide-react";
import type { BankAccount } from "@/types/bankAccount";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TableBankAccountProps {
    data: BankAccount[];
    isLoading: boolean;
    onEdit: (bankAccount: BankAccount) => void;
    onDelete: (id: string) => void;
    onAdd: () => void;
    onRefresh: () => void;
}

const CardSkeleton = () => (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-900 shadow-lg aspect-[1.586/1] max-w-[400px] mx-auto">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/20 to-transparent rounded-full -translate-y-12 translate-x-12" />

        <div className="relative z-10 h-full p-6 flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start mb-6">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-28 rounded-full" />
                        <Skeleton className="h-6 w-32 rounded-full" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                </div>

                <div className="space-y-4">
                    <Skeleton className="h-10 w-full rounded-xl opacity-80" />
                    <div className="flex flex-col gap-3">
                        <Skeleton className="h-5 w-4/5 rounded-full" />
                        <Skeleton className="h-4 w-3/4 rounded-md opacity-40" />
                        <Skeleton className="h-8 w-2/3 rounded-lg opacity-20" />
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-300/50 dark:border-slate-700/50">
                <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-16 rounded-lg" />
                    <Skeleton className="h-8 w-16 rounded-lg" />
                </div>
            </div>
        </div>
    </div>
);

export const TableBankAccount = ({
    data,
    isLoading,
    onEdit,
    onDelete,
    onAdd,
    onRefresh,
}: TableBankAccountProps) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [revealedCards, setRevealedCards] = useState<Set<string>>(new Set());
    const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

    useEffect(() => {
        if (copiedAccount) {
            const timer = setTimeout(() => setCopiedAccount(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [copiedAccount]);

    const filteredData = data.filter(
        (item) =>
            item.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.accountHolder.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleRevealCard = (id: string) => {
        setRevealedCards(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const copyToClipboard = async (text: string, id: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedAccount(id);
    };

    const getBankGradient = (bankName: string) => {
        const gradients = {
            "BCA": "from-blue-600 to-blue-800",
            "Mandiri": "from-red-600 to-red-800",
            "BNI": "from-yellow-600 to-yellow-800",
            "BRI": "from-green-600 to-green-800",
            "CIMB": "from-pink-600 to-pink-800",
            "default": "from-slate-700 to-slate-900",
        };

        const key = Object.keys(gradients).find(grad =>
            bankName.toLowerCase().includes(grad.toLowerCase())
        ) || "default";

        return gradients[key as keyof typeof gradients];
    };

    const getBankColor = (bankName: string) => {
        const colors = {
            "BCA": "text-blue-300",
            "Mandiri": "text-red-300",
            "BNI": "text-yellow-300",
            "BRI": "text-green-300",
            "CIMB": "text-pink-300",
            "default": "text-slate-300",
        };

        const key = Object.keys(colors).find(color =>
            bankName.toLowerCase().includes(color.toLowerCase())
        ) || "default";

        return colors[key as keyof typeof colors];
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <Skeleton className="h-10 w-80 rounded-full" />
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-10 w-40 rounded-full" />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <CardSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bank Accounts</h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Manage your connected bank accounts
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={onRefresh}
                        className="h-10 w-10 rounded-full"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                        onClick={onAdd}
                        className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Account
                    </Button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Search bank, account number, or holder..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 rounded-xl"
                />
                {searchTerm && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSearchTerm("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                    >
                        ×
                    </Button>
                )}
            </div>

            {/* Stats */}
            {data.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/50">
                        <p className="text-xs text-slate-600 dark:text-slate-400">Total</p>
                        <p className="text-lg font-bold">{data.length}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                        <p className="text-xs text-slate-600 dark:text-slate-400">Active</p>
                        <p className="text-lg font-bold text-emerald-600">
                            {data.filter(d => d.isActive).length}
                        </p>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                        <p className="text-xs text-slate-600 dark:text-slate-400">Inactive</p>
                        <p className="text-lg font-bold text-amber-600">
                            {data.filter(d => !d.isActive).length}
                        </p>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                        <p className="text-xs text-slate-600 dark:text-slate-400">Filtered</p>
                        <p className="text-lg font-bold text-purple-600">{filteredData.length}</p>
                    </div>
                </div>
            )}

            {/* Cards Grid */}
            <AnimatePresence mode="wait">
                {filteredData.length === 0 ? (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Card className="border-dashed">
                            <CardContent className="p-8 text-center">
                                <CreditCard className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">
                                    {searchTerm ? "No matching accounts" : "No bank accounts yet"}
                                </h3>
                                <p className="text-sm text-slate-500 mb-4">
                                    {searchTerm
                                        ? "Try adjusting your search"
                                        : "Add your first bank account"}
                                </p>
                                <Button
                                    onClick={onAdd}
                                    size="sm"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Account
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div
                        key="cards"
                        layout
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                    >
                        <AnimatePresence>
                            {filteredData.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ y: -3 }}
                                    className="relative group"
                                >
                                    {/* Credit Card Container - 20% larger than standard */}
                                    <div className="relative aspect-[1.586/1] max-w-[400px] mx-auto overflow-hidden rounded-2xl shadow-xl">
                                        {/* Card Background */}
                                        <div className={cn(
                                            "absolute inset-0 bg-gradient-to-br",
                                            getBankGradient(item.bankName)
                                        )}>
                                            {/* Holographic Strip */}
                                            <div className="absolute top-1/3 right-0 w-1/3 h-8 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-45deg]" />

                                            {/* Subtle Pattern */}
                                            <div className="absolute inset-0 opacity-5">
                                                <div className="absolute top-4 left-4 text-4xl font-bold opacity-30">••••</div>
                                                <div className="absolute bottom-4 right-4 text-3xl font-bold opacity-30">●●●●</div>
                                            </div>
                                        </div>

                                        {/* Shine Effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                                        {/* Card Content */}
                                        <div className="relative z-10 h-full p-5 flex flex-col justify-between">
                                            {/* Top Section */}
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className={cn(
                                                            "p-1.5 rounded-lg bg-white/10",
                                                            getBankColor(item.bankName)
                                                        )}>
                                                            <Building className="h-4 w-4" />
                                                        </div>
                                                        <Badge className={cn(
                                                            item.isActive
                                                                ? "bg-emerald-500 hover:bg-emerald-600"
                                                                : "bg-slate-500 hover:bg-slate-600",
                                                            "border-0 text-white px-2 py-0.5 text-[10px]"
                                                        )}>
                                                            {item.isActive ? "ACTIVE" : "INACTIVE"}
                                                        </Badge>
                                                    </div>
                                                    <h3 className="text-sm font-bold text-white truncate">
                                                        {item.bankName}
                                                    </h3>
                                                </div>

                                                {/* Chip */}
                                                <div className="relative">
                                                    <div className="h-6 w-8 bg-gradient-to-br from-yellow-300/30 to-amber-400/30 rounded-md border border-yellow-300/50" />
                                                    <div className="absolute inset-0 grid grid-cols-4 gap-0.5 p-1">
                                                        {[...Array(16)].map((_, i) => (
                                                            <div key={i} className="bg-yellow-300/40 rounded-[1px]" />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Account Number */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1">
                                                        <Hash className="h-3 w-3 text-white/60" />
                                                        <span className="text-[10px] text-white/60 uppercase tracking-wider">
                                                            Account Number
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => toggleRevealCard(item.id)}
                                                            className="h-6 w-6 rounded-full bg-white/10 hover:bg-white/20"
                                                        >
                                                            {revealedCards.has(item.id) ? (
                                                                <EyeOff className="h-3 w-3 text-white" />
                                                            ) : (
                                                                <Eye className="h-3 w-3 text-white" />
                                                            )}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => copyToClipboard(item.accountNumber, item.id)}
                                                            className="h-6 w-6 rounded-full bg-white/10 hover:bg-white/20"
                                                        >
                                                            {copiedAccount === item.id ? (
                                                                <CheckCircle2 className="h-3 w-3 text-green-300" />
                                                            ) : (
                                                                <Copy className="h-3 w-3 text-white" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="bg-black/20 rounded-lg p-3 backdrop-blur-sm border border-white/10">
                                                    <p className="font-mono text-lg tracking-widest text-white text-center">
                                                        {revealedCards.has(item.id) ?
                                                            item.accountNumber.replace(/(\d{4})(?=\d)/g, '$1 ') :
                                                            '•••• •••• •••• ••••'
                                                        }
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Bottom Section */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <User className="h-4 w-4 text-white/70" />
                                                    <p className="text-xs font-medium text-white truncate">
                                                        {item.accountHolder}
                                                    </p>
                                                </div>

                                                {item.branch && (
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <MapPin className="h-3 w-3 text-white/70" />
                                                        <p className="text-[10px] text-white/70 truncate italic">
                                                            {item.branch}
                                                        </p>
                                                    </div>
                                                )}

                                                {item.accountCOA && (
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <QrCode className="h-4 w-4 text-white/80 shrink-0" />
                                                        <Badge
                                                            variant="outline"
                                                            className="bg-white/15 border-white/25 text-white text-[11px] ml-2 px-3 py-1 truncate max-w-[240px] font-medium shadow-sm backdrop-blur-md"
                                                            title={`${item.accountCOA.code} - ${item.accountCOA.name}`}
                                                        >
                                                            {item.accountCOA.code} - {item.accountCOA.name}
                                                        </Badge>
                                                    </div>
                                                )}

                                                <div className="mt-4 flex flex-col">
                                                    <span className="text-[10px] text-white/60 uppercase tracking-widest font-medium mb-1">Available Balance</span>
                                                    <p className="text-xl font-bold text-white">
                                                        {new Intl.NumberFormat('id-ID', {
                                                            style: 'currency',
                                                            currency: 'IDR',
                                                            minimumFractionDigits: 0,
                                                        }).format(item.currentBalance || 0)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Actions Menu - Floating */}
                                            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm border border-white/20"
                                                        >
                                                            <MoreVertical className="h-4 w-4 text-white" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                        <DropdownMenuItem onClick={() => onEdit(item)} className="cursor-pointer">
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => onDelete(item.id)}
                                                            className="cursor-pointer text-red-600 focus:text-red-600"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>

                                        {/* MasterCard/Visa Logo */}
                                        <div className="absolute bottom-4 left-3 flex items-center gap-2">
                                            <div className="h-5 w-8 bg-gradient-to-r from-red-500 to-yellow-500 rounded-sm" />
                                            <div className="text-[8px] font-bold text-white/60">DEBIT</div>
                                        </div>
                                    </div>

                                    {/* Quick Actions Tooltip */}
                                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                                        Click menu for actions
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};