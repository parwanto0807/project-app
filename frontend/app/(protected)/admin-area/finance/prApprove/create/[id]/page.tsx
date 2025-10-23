'use client';

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { LayoutProps } from "@/types/layout";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useApprovedPurchaseRequests } from "@/hooks/use-pr";
import { useEffect } from "react";
import { AdminLoading } from "@/components/admin-loading";
import { useCreateUangMuka } from "@/hooks/use-um";
import { toast } from "sonner";
import { CreateUangMukaInput } from "@/types/typesUm";
import { PrCreateFormFrVerify } from "@/components/prApprove/createFormDataFrVerify";

interface SubmitDataWithFile {
    data: CreateUangMukaInput;
    file?: File
}

export default function PRCreatePageAdminApprove() {
    const router = useRouter();
    const params = useParams(); // <-- ambil param dari URL
    const idFromUrl = params?.id as string; // <-- id dari /[id]/page.tsx

    const { user, loading: userLoading } = useCurrentUser();
    const { approvedPurchaseRequests, loading: prLoading } = useApprovedPurchaseRequests();

    const {
        mutate: createUangMuka,
        isPending: submitting,
        error: submitError,
    } = useCreateUangMuka();

    // Redirect jika bukan admin
    useEffect(() => {
        if (!userLoading && user?.role !== "admin") {
            router.push("/unauthorized");
        }
    }, [user, userLoading, router]);

    // Handle error submission
    useEffect(() => {
        if (submitError) {
            console.error("Error creating Uang Muka:", submitError);
            toast.error("Failed to create Uang Muka. Please try again.");
        }
    }, [submitError]);

    // Di page.tsx - perbaiki handleCreateUangMuka
    const handleCreateUangMuka = async (submitData: SubmitDataWithFile): Promise<void> => {
        try {
            console.log("📤 SubmitData dari form:", {
                data: submitData.data,
                file: submitData.file?.name || "Tidak ada file",
                idFromUrl,
            });

            const result = await createUangMuka(submitData);

            console.log("✅ Success response:", result);
            // toast.success("Uang Muka berhasil dibuat!");
            router.push("/admin-area/accounting/prVerify");
        } catch (unknownError) {
            console.warn("⚠️ Gagal membuat Uang Muka:", unknownError);

            let message = "Terjadi kesalahan saat membuat Uang Muka.";

            // Gunakan type guard agar tetap aman dan tidak langgar eslint
            if (unknownError instanceof Error) {
                message = unknownError.message;
            } else if (typeof unknownError === "string") {
                try {
                    const parsed = JSON.parse(unknownError);
                    if (typeof parsed.message === "string") {
                        message = parsed.message;
                    }
                } catch {
                    message = unknownError;
                }
            } else if (
                typeof unknownError === "object" &&
                unknownError !== null &&
                "response" in unknownError &&
                typeof (unknownError as { response?: { data?: { message?: string } } }).response?.data?.message === "string"
            ) {
                message = (unknownError as { response: { data: { message: string } } }).response.data.message;
            }

            toast.error(message);
        }
    };

    if (userLoading || prLoading) {
        return <AdminLoading message="Loading data..." />;
    }

    const layoutProps: LayoutProps = {
        title: "Finance",
        role: "admin",
        children: (
            <>
                <div className="flex justify-between items-center mb-6">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <Badge variant="outline">
                                        <Link href="/admin-area">Dashboard</Link>
                                    </Badge>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <Badge variant="outline">
                                        Finance
                                    </Badge>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <Badge variant="outline">
                                        <Link href="/admin-area/finance/prApprove">Request Aprrove List</Link>
                                    </Badge>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <Badge variant="outline">
                                    <BreadcrumbPage>Create New</BreadcrumbPage>
                                </Badge>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                        {/* Form Container */}
                        <div className="p-6">
                            <PrCreateFormFrVerify
                                onSubmit={handleCreateUangMuka}
                                approvedPurchaseRequests={approvedPurchaseRequests}
                                isSubmitting={submitting}
                                idFromUrl={idFromUrl} // <-- Kirim ID ke form
                            />
                        </div>
                    </div>
                </div>
            </>
        ),
    };

    return <AdminLayout {...layoutProps} />;
}
