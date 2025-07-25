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
import { useEffect, useRef, useState } from "react";
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

type DialogEvent = Event | React.SyntheticEvent;

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
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open && id) {
      setLoading(true);
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/master/customer/getCustomerById/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch customer data");
          return res.json();
        })
        .then(setCustomer)
        .catch(() => {
          setCustomer(null);
          toast.error("Failed to load customer data");
        })
        .finally(() => setLoading(false));
    }
    if (!open) setCustomer(null);
  }, [id, open]);

  const handleCloseAutoFocus = (e: DialogEvent) => {
    e.preventDefault();
    document.getElementById('search-input')?.focus();
  };

  const handlePointerDownOutside = (e: DialogEvent) => {
    const event = e as unknown as React.PointerEvent;
    if (event.target === event.currentTarget) {
      event.preventDefault();
      onOpenChange(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity ${open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-lg w-full p-0 rounded-2xl overflow-hidden"
          onCloseAutoFocus={handleCloseAutoFocus}
          onPointerDownOutside={handlePointerDownOutside}
        >
          <DialogHeader className="bg-blue-50 px-6 py-4 flex items-center gap-3 border-b">
            <BookUser className="w-8 h-8 text-blue-600" />
            <div>
              <DialogTitle className="text-xl font-bold">
                Customer Detail
              </DialogTitle>
              {customer && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    className={`text-xs px-2 py-1 rounded-lg ${customer.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                      }`}
                  >
                    {customer.isActive ? (
                      <span className="flex items-center gap-1">
                        <CircleCheckBig className="w-4 h-4" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <CircleX className="w-4 h-4" />
                        Inactive
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 col-span-2">
                {[...Array(12)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : customer ? (
              <>
                <InfoItem icon={<User className="w-5 h-5 text-blue-400" />} label="Name" value={customer.name} />
                <InfoItem icon={<Mail className="w-5 h-5 text-pink-400" />} label="Email" value={customer.email} />
                <InfoItem icon={<Phone className="w-5 h-5 text-emerald-400" />} label="Phone" value={customer.phone} />
                <InfoItem icon={<Building2 className="w-5 h-5 text-indigo-400" />} label="Branch" value={customer.branch} />
                <InfoItem icon={<Landmark className="w-5 h-5 text-yellow-400" />} label="Company Type" value={customer.companyType} />
                <InfoItem icon={<MapPin className="w-5 h-5 text-teal-400" />} label="City" value={customer.city} />
                <InfoItem icon={<Map className="w-5 h-5 text-lime-400" />} label="Province" value={customer.province} />
                <InfoItem icon={<SquareUser className="w-5 h-5 text-violet-400" />} label="PIC" value={customer.contactPerson} />
                <InfoItem icon={<Phone className="w-5 h-5 text-orange-400" />} label="PIC Phone" value={customer.picPhone} />
                <InfoItem icon={<Mail className="w-5 h-5 text-red-400" />} label="PIC Email" value={customer.picEmail} />
                <InfoItem icon={<FileText className="w-5 h-5 text-fuchsia-400" />} label="Tax Number" value={customer.taxNumber} />
                <InfoItem icon={<StickyNote className="w-5 h-5 text-gray-400" />} label="Notes" value={customer.notes} />
                <InfoItem icon={<MapPin className="w-5 h-5 text-sky-400" />} label="Address" value={customer.address} className="md:col-span-2" />
                <InfoItem icon={<MapPin className="w-5 h-5 text-blue-400" />} label="Postal Code" value={customer.postalCode} />
                <InfoItem icon={<Calendar className="w-5 h-5 text-gray-400" />} label="Created" value={formatDate(customer.createdAt)} />
                <InfoItem icon={<Calendar className="w-5 h-5 text-gray-400" />} label="Updated" value={formatDate(customer.updatedAt)} />
              </>
            ) : (
              <span className="col-span-2 text-center text-gray-400 py-8">No data found</span>
            )}
          </div>
          <DialogFooter className="px-6 py-3 bg-gray-50 flex justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div
        className="relative bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <button
          ref={closeButtonRef}
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Close"
        >
          ✕
        </button>
        <div className="p-6">
          {/* Konten dialog Anda */}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value, className = "" }: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  className?: string
}) {
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
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}