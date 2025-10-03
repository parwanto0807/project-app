"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useCurrentUser } from "@/hooks/use-current-user";
import { CreateProductForm } from "@/components/master/product/createFormData";
import { Loader2 } from "lucide-react";

export default function CreateProductPagePic() {
  const { user, loading } = useCurrentUser();
  const router = useRouter();
  const [code, setCode] = useState("");

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/auth/login");
      return;
    }

    if (user.role !== "pic") {
      router.replace("/not-authorized");
      return;
    }
    fetch("/api/product/generate-code")
      .then((res) => res.json())
      .then((data) => setCode(data.code));
  }, [loading, user, router]);

  if (loading || !user || user.role !== "pic") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-label="Loading" />
          <span>Memeriksa akses...</span>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="Create Customer" role="pic">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/pic-area">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/pic-area/master/products">Product List</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Create</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <CreateProductForm role={user.role} code={code} />
    </AdminLayout>
  );
}
