"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User, Mail, Phone, Building2, MapPin, Map, Landmark, FileText, BookUser,
  SquareUser, CircleCheckBig, CircleX, Calendar, StickyNote
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

type Customer = {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  branch?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  taxNumber?: string;
  companyType?: string;
  contactPerson?: string;
  picPhone?: string;
  picEmail?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export default function ViewCustomerDetailDialogById({
  id,
  open,
  onOpenChange,
}: {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch customer when dialog is open AND id changes
  useEffect(() => {
    if (open && id) {
      setLoading(true);
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/master/customer/getCustomerById/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Gagal fetch data customer.");
          return res.json();
        })
        .then(setCustomer)
        .catch(() => {
          setCustomer(null);
          toast("Gagal memuat data customer.");
        })
        .finally(() => setLoading(false));
    }
    if (!open) setCustomer(null); // reset when dialog closed
  }, [id, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full p-0 rounded-2xl overflow-hidden">
        <DialogHeader className="bg-blue-50 px-6 py-4 flex items-center gap-3 border-b">
          <BookUser className="w-8 h-8 text-blue-600" />
          <div>
            <DialogTitle className="text-xl font-bold">
              Customer Detail
            </DialogTitle>
            {customer && (
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  className={`text-xs px-2 py-1 rounded-lg ${
                    customer.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {customer.isActive ? (
                    <span className="flex items-center gap-1">
                      <CircleCheckBig className="w-4 h-4" />
                      Aktif
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <CircleX className="w-4 h-4" />
                      Nonaktif
                    </span>
                  )}
                </Badge>
                <span className="text-xs text-gray-400">ID: {customer.code}</span>
              </div>
            )}
          </div>
        </DialogHeader>
        <div className="px-6 py-4 bg-white grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm min-h-[200px]">
          {loading ? (
            <Skeleton className="w-full h-40 rounded-xl col-span-2" />
          ) : customer ? (
            <>
              <InfoItem icon={<User className="w-5 h-5 text-blue-400" />} label="Nama" value={customer.name} />
              <InfoItem icon={<Mail className="w-5 h-5 text-pink-400" />} label="Email" value={customer.email} />
              <InfoItem icon={<Phone className="w-5 h-5 text-emerald-400" />} label="Telepon" value={customer.phone} />
              <InfoItem icon={<Building2 className="w-5 h-5 text-indigo-400" />} label="Cabang" value={customer.branch} />
              <InfoItem icon={<Landmark className="w-5 h-5 text-yellow-400" />} label="Tipe Perusahaan" value={customer.companyType} />
              <InfoItem icon={<MapPin className="w-5 h-5 text-teal-400" />} label="Kota" value={customer.city} />
              <InfoItem icon={<Map className="w-5 h-5 text-lime-400" />} label="Provinsi" value={customer.province} />
              <InfoItem icon={<SquareUser className="w-5 h-5 text-violet-400" />} label="PIC" value={customer.contactPerson} />
              <InfoItem icon={<Phone className="w-5 h-5 text-orange-400" />} label="Telepon PIC" value={customer.picPhone} />
              <InfoItem icon={<Mail className="w-5 h-5 text-red-400" />} label="Email PIC" value={customer.picEmail} />
              <InfoItem icon={<FileText className="w-5 h-5 text-fuchsia-400" />} label="NPWP" value={customer.taxNumber} />
              <InfoItem icon={<StickyNote className="w-5 h-5 text-gray-400" />} label="Catatan" value={customer.notes} />
              <InfoItem icon={<MapPin className="w-5 h-5 text-sky-400" />} label="Alamat" value={customer.address} className="md:col-span-2" />
              <InfoItem icon={<MapPin className="w-5 h-5 text-blue-400" />} label="Kode Pos" value={customer.postalCode} />
              <InfoItem icon={<Calendar className="w-5 h-5 text-gray-400" />} label="Created" value={formatDate(customer.createdAt)} />
              <InfoItem icon={<Calendar className="w-5 h-5 text-gray-400" />} label="Updated" value={formatDate(customer.updatedAt)} />
            </>
          ) : (
            <span className="col-span-2 text-center text-gray-400 py-8">Data tidak ditemukan</span>
          )}
        </div>
        <DialogFooter className="px-6 py-3 bg-gray-50 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Komponen kecil untuk info field + icon
function InfoItem({ icon, label, value, className = "" }: { icon: React.ReactNode; label: string; value?: string | null; className?: string }) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="flex-shrink-0 mt-1">{icon}</div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium break-words">{value || <span className="text-gray-400">-</span>}</div>
      </div>
    </div>
  );
}

function formatDate(date: string | Date | undefined) {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" });
}
