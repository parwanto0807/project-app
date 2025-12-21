"use client";

import React from "react";
import PageContainer from "@/components/layout/PageContainer";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import TabelMonitoring from "@/components/inventory/TabelMonitoring";
import { Card, CardContent } from "@/components/ui/card";

import { Package, AlertTriangle, TrendingDown, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import HeaderCard from "@/components/ui/header-card";

export default function InventoryDashboardPage() {
    return (
        <PageContainer scrollable>
            <div className="flex flex-col gap-6 p-4 md:p-6 animate-in fade-in duration-500">

                {/* --- Header Section --- */}
                <div className="flex items-center gap-2 mb-2">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/admin-area/inventory">Inventory</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Dashboard</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

                {/* --- Header Card Premium --- */}
                <HeaderCard
                    title="Inventory Dashboard"
                    description="Monitoring real-time saldo stok, status aset, dan peringatan level inventaris."
                    icon={<LayoutDashboard className="w-6 h-6 text-white" />}
                />

                {/* --- Main Content: Monitoring Table --- */}
                <div className="mt-2">
                    <TabelMonitoring />
                </div>

            </div>
        </PageContainer>
    );
}