"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { toast } from "sonner";
import UpdateTeamForm from "@/components/master/team/updateFormData";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/ui/loading";
import { useSession } from "@/components/clientSessionProvider";
import { PicLayout } from "@/components/admin-panel/pic-layout";

interface Team {
  id: string;
  namaTeam: string;
  deskripsi: string;
  karyawan: { id: string }[];
}

export default function UpdateTeamPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromPage = searchParams.get('from') || 'list';
  const { user, isLoading: userLoading } = useSession();

  const returnUrl = searchParams.get("returnUrl") || "/admin-area/master/products?page=1";

  const [data, setData] = useState<Team | null>(null);
  const [error, setError] = useState("");
  const [role, setRole] = useState<"pic" | "admin">("pic");
  const [loadingData, setLoadingData] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/auth/login");
    } else if (!userLoading && user) {
      const userRole = user.role as "pic" | "admin";
      setRole(userRole);
    }
  }, [userLoading, user, router]);

  useEffect(() => {
    if (!id) {
      setError("ID tim tidak ditemukan");
      setLoadingData(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoadingData(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/team/getTeamById/${id}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const teamData: Team = await response.json();
        setData(teamData);
        setError("");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Gagal memuat data tim";
        setError(errorMessage);
        toast.error("Gagal memuat data", {
          description: errorMessage,
        });
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [id]);

  const getBasePath = () => {
    return role === "pic"
      ? "/pic-area/master/team"
      : "/admin-area/master/team";
  };

  const handleBack = () => {
    if (fromPage === 'detail') {
      router.push(`${getBasePath()}/${id}`);
    } else {
      router.push(getBasePath());
    }
  };

  // Tampilkan PageLoading untuk semua kasus loading
  if (userLoading || loadingData) {
    return (
      <PageLoading
        title={userLoading ? "Memverifikasi akses" : "Memuat data tim"}
        description={userLoading ?
          "Mohon tunggu sementara kami memeriksa otentikasi Anda" :
          "Mohon tunggu sementara kami menyiapkan data tim"
        }
      />
    );
  }

  return (
    <PicLayout title="Update Data Tim" role={role}>
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={role === "pic" ? "/pic-area" : "/admin-area"}>
                  Dashboard
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={getBasePath()}>
                  Data Tim
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Update Tim</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {error ? (
        <div className="flex flex-col  items-center justify-center py-12 space-y-4">
          <div className="bg-red-100 p-4 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-center text-red-500 text-lg font-medium">{error}</p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleBack}
            >
              Kembali ke Daftar
            </Button>
            <Button
              onClick={() => window.location.reload()}
            >
              Coba Lagi
            </Button>
          </div>
        </div>
      ) : data ? (
        <UpdateTeamForm
          role={role}
          teamId={id!}
          returnUrl={returnUrl}      // ✔ string
        />
      ) : (
        <div className="flex flex-col  items-center justify-center py-12 space-y-4">
          <div className="bg-yellow-100 p-4 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-yellow-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-center text-yellow-600 text-lg font-medium">
            Data tim tidak ditemukan. {id ? `(ID: ${id})` : ''}
          </p>
          <Button
            onClick={handleBack}
            className="px-4 py-2"
          >
            Kembali ke Daftar Tim
          </Button>
        </div>
      )}
    </PicLayout>
  );
}