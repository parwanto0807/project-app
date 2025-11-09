"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SuperLayout } from "@/components/admin-panel/super-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { CreateProductForm } from "@/components/master/product/createFormData";
import { Loader2 } from "lucide-react";
import { useSession } from "@/components/clientSessionProvider";

export default function CreateProductPage() {
  const { user, isLoading } = useSession();
  const router = useRouter();
  const [code, setCode] = useState("");

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/auth/login");
      return;
    }

    if (user.role !== "super") {
      router.replace("/not-authorized");
      return;
    }
    fetch("/api/product/generate-code")
      .then((res) => res.json())
      .then((data) => setCode(data.code));
  }, [isLoading, user, router]);

  if (isLoading || !user || user.role !== "super") {
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
    <SuperLayout title="Create Customer" role="super">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/super-admin-area">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/super-admin-area/master/products">Product List</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Create</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <CreateProductForm role={user.role} code={code} />
    </SuperLayout>
  );
}
