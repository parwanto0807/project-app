"use client";

import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { LayoutProps } from "@/types/layout";
import HeaderCard from "@/components/ui/header-card";
import {
    Calculator,
    BookOpen,
    CreditCard,
    FileText,
    Users,
    ArrowRight
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AccountingDashboard() {
    const layoutProps: LayoutProps = {
        title: "Accounting Dashboard",
        role: "admin",
        children: (
            <div className="flex flex-col h-full space-y-6 p-4 lg:p-6 bg-slate-50/50 dark:bg-slate-900/50 min-h-screen">
                <HeaderCard
                    title={
                        <div className="flex items-center gap-3">
                            <span className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Calculator className="h-6 w-6 text-white" />
                            </span>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-white">Accounting Helper</h1>
                                <p className="text-blue-100 text-sm font-medium opacity-90">
                                    Manage your financial records and reports
                                </p>
                            </div>
                        </div>
                    }
                    gradientFrom="from-blue-600"
                    gradientTo="to-indigo-700"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Trial Balance Card */}
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                    <Calculator className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                            <CardTitle className="mt-4">Trial Balance</CardTitle>
                            <CardDescription>
                                View accounts balances and ensure debits equal credits.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href="/admin-area/accounting/trial-balance">
                                <Button className="w-full gap-2 group">
                                    View Report
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* General Ledger Card */}
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-emerald-500">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                                    <BookOpen className="h-6 w-6 text-emerald-600" />
                                </div>
                            </div>
                            <CardTitle className="mt-4">General Ledger</CardTitle>
                            <CardDescription>
                                Detailed transaction history for all accounts.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href="/admin-area/accounting/ledger">
                                <Button className="w-full gap-2 group" variant="outline">
                                    View Ledger
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Accounting Periods */}
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-purple-500">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                                    <Calendar className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                            <CardTitle className="mt-4">Accounting Periods</CardTitle>
                            <CardDescription>
                                Manage fiscal years and monthly periods.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href="/admin-area/accounting/accounting-period">
                                <Button className="w-full gap-2 group" variant="outline">
                                    Manage Periods
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    };

    return <AdminLayout {...layoutProps} />;
}

import { Calendar } from "lucide-react";
