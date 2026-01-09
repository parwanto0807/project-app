
"use client";

import React from "react";
import Link from "next/link";
import { Plus, Calendar, Settings, Activity, ShieldCheck, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import HeaderCard from "@/components/ui/header-card";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { PeriodTable } from "@/components/accounting-period/tableData";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";

export default function AccountingPeriodPage() {
    return (
        <AdminLayout title="Accounting Periods" role="admin">
            <div className="flex flex-col space-y-4 md:space-y-6 p-0 md:p-4 lg:p-6">
                {/* Breadcrumb Section with Badges */}
                <div className="px-4 md:px-0">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <Badge variant="outline" className="bg-white/50 backdrop-blur-sm border-gray-200 text-gray-500 hover:text-emerald-600 transition-colors">
                                        <Link href="/admin-area">Dashboard</Link>
                                    </Badge>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <Badge variant="outline" className="bg-white/50 backdrop-blur-sm border-gray-200 text-gray-500">
                                    Accounting
                                </Badge>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                                    <BreadcrumbPage className="text-emerald-700">Accounting Period</BreadcrumbPage>
                                </Badge>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

                {/* Header Card */}
                <HeaderCard
                    title="Accounting Period Management"
                    description="Strategically manage fiscal periods for accurate financial reporting and control."
                    icon={<Calendar className="h-6 w-6 md:h-8 md:w-8 text-white" />}
                    gradientFrom="from-emerald-600"
                    gradientTo="to-teal-800"
                    backgroundStyle="pattern"
                    className="p-4 md:p-6"
                    titleClassName="text-xl md:text-2xl"
                    descriptionClassName="text-[10px] md:text-sm max-w-2xl"
                />

                {/* Sub-Header Area: Stats and Create Button */}
                <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between px-4 md:px-0">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-grow">
                        <StatItem
                            label="Organization"
                            value="Finance"
                            icon={<ShieldCheck className="h-3 w-3 text-emerald-500" />}
                        />
                        <StatItem
                            label="Status"
                            value="Active"
                            icon={<Activity className="h-3 w-3 text-blue-500" />}
                        />
                        <StatItem
                            label="Region"
                            value="Global"
                            icon={<Map className="h-3 w-3 text-indigo-500" />}
                        />
                        <StatItem
                            label="Config"
                            value="Standard"
                            icon={<Settings className="h-3 w-3 text-gray-500" />}
                        />
                    </div>

                    {/* Create Button */}
                    <div className="flex-shrink-0">
                        <Link href="/admin-area/accounting/accounting-period/create">
                            <Button className="w-full lg:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border-0 font-bold px-4 h-9 md:h-10 rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-xs md:text-sm">
                                <Plus className="h-4 w-4" />
                                <span>Create Period</span>
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Main Table Component */}
                <div className="px-0 md:px-0">
                    <PeriodTable />
                </div>
            </div>
        </AdminLayout>
    );
}

// Mini Stat Item for the sub-header
function StatItem({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
    return (
        <div className="bg-white border border-gray-100 rounded-xl p-2 md:p-2.5 flex items-center gap-2 md:gap-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-1.5 bg-gray-50 rounded-lg">
                {icon}
            </div>
            <div className="flex flex-col overflow-hidden">
                <span className="text-[9px] md:text-[10px] uppercase tracking-wider text-gray-400 font-bold leading-tight truncate">{label}</span>
                <span className="text-[11px] md:text-xs font-bold text-gray-700 leading-tight truncate">{value}</span>
            </div>
        </div>
    );
}
