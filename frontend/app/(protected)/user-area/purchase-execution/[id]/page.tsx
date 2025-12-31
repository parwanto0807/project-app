
import PurchaseOrderDetail from "@/components/dashboard/user/DetailPurchaseExecution";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { LayoutProps } from "@/types/layout";

export default function PurchaseExecutionDetailRoot() {
    const layoutProps: LayoutProps = {
        title: "Detail Purchase Execution",
        role: "user",
        children: <PurchaseOrderDetail />
    };

    return <AdminLayout {...layoutProps} />;
}
