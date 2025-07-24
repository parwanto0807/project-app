"use client";

import { PicLayout } from "@/components/admin-panel/pic-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useEffect } from "react";
import { useAutoLogout } from "@/hooks/use-auto-logout";

export default function PicPage() {
  const { user, loading } = useCurrentUser();
  const router = useRouter();

  useAutoLogout(86400);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/auth/login");
    } else if (user.role !== "pic") {
      router.push("/unauthorized");
    }
  }, [user, loading, router]);

  if (loading) return <p>Loading...</p>;
  
  if (loading) return <p>Loading...</p>;
    if (!user || user.role !== "pic") {
    return null;
  }

  return (
    <PicLayout title="Dashboard PIC" role={user.role} >
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>PIC</BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
        </BreadcrumbList>
      </Breadcrumb>
    </PicLayout>
  );
}
