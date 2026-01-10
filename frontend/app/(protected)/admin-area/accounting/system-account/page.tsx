import { Suspense } from "react";
import { TableSystemAccount } from "@/components/accounting/system-account/TableSystemAccount";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Settings, ShieldCheck, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AdminLayout } from "@/components/admin-panel/admin-layout";

export default function SystemAccountPage() {
    return (
        <AdminLayout title="System Account Mapping" role="admin">
            <div className="flex-1 space-y-4 p-2 md:p-8 pt-6">
                {/* Header Section */}
                <Card className="border-none shadow-lg overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                    <CardHeader className="relative pb-6 sm:pb-8">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="p-2 sm:p-3 bg-white/20 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white/20 inline-block shadow-inner">
                                <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-white drop-shadow-md" />
                            </div>
                            <div className="space-y-0.5 sm:space-y-1">
                                <CardTitle className="text-lg sm:text-2xl font-bold tracking-tight">System Account Mapping</CardTitle>
                                <CardDescription className="text-blue-100 text-[10px] sm:text-sm font-medium">
                                    Konfigurasikan mapping akun COA untuk fungsi sistem otomatis.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <Alert className="bg-amber-50 border-amber-200 text-amber-800 rounded-xl shadow-sm">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-xs font-bold uppercase tracking-wider">Warning: Critical Settings</AlertTitle>
                    <AlertDescription className="text-sm">
                        Perubahan pada mapping ini akan mempengaruhi bagaimana jurnal otomatis dibuat oleh sistem. Pastikan akun yang dipilih sudah sesuai dengan standar akuntansi perusahaan.
                    </AlertDescription>
                </Alert>

                <Suspense fallback={
                    <Card className="border-none shadow-md">
                        <div className="p-8 text-center flex flex-col items-center justify-center space-y-4">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                            <p className="text-muted-foreground animate-pulse">Memuat konfigurasi sistem...</p>
                        </div>
                    </Card>
                }>
                    <TableSystemAccount />
                </Suspense>
            </div>
        </AdminLayout>
    );
}
