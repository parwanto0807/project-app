"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format, isSameMonth, addMonths } from "date-fns";
import { id } from "date-fns/locale";

interface SimulasiPotonganProps {
  loans: any[];
  kasbon: any[];
}

export default function SimulasiPotongan({ loans, kasbon }: SimulasiPotonganProps) {
  // Default ke bulan berjalan
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().substring(0, 7) // format YYYY-MM
  );

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);

  const simulations = useMemo(() => {
    const targetDate = new Date(selectedMonth + "-01");
    const result: Record<string, any> = {};

    // 1. Hitung Pinjaman yang ACTIVE
    loans.forEach((loan) => {
      if (loan.status === "ACTIVE" && loan.sisaPinjaman > 0) {
        // Cek apakah bulan simulasi sudah masuk bulan mulai potong
        // Gunakan tanggalJatuhTempo dari angsuran bulan ke-1
        const firstDetail = loan.details?.find((d: any) => d.bulanKe === 1);
        if (firstDetail && firstDetail.tanggalJatuhTempo) {
          const mulaiDate = new Date(firstDetail.tanggalJatuhTempo);
          const mulaiMonthStr = mulaiDate.toISOString().substring(0, 7);
          if (selectedMonth < mulaiMonthStr) {
            return; // Belum waktunya dipotong
          }
        }

        const empId = loan.karyawan?.id;
        if (!empId) return;

        if (!result[empId]) {
          result[empId] = {
            karyawan: loan.karyawan,
            potonganPinjaman: 0,
            pinjamanDetails: [],
            potonganKasbon: 0,
          };
        }

        // Angsuran tidak melebihi sisa pinjaman
        const potongan = Math.min(Number(loan.angsuranBulanan), Number(loan.sisaPinjaman));
        result[empId].potonganPinjaman += potongan;

        // Hitung estimasi bulan selesai berdasarkan tenor
        const endDate = addMonths(new Date(loan.tanggalPinjam), Number(loan.tenor) || 1);
        result[empId].pinjamanDetails.push({
          potongan,
          totalPinjaman: Number(loan.jumlahPinjaman),
          endDate,
        });
      }
    });

    // 2. Hitung Kasbon yang APPROVED/belum settled dan jatuh pada bulan ini
    kasbon.forEach((k) => {
      // Kasbon dipotong jika status APPROVED (belum lunas) atau SETTLED tapi bulan potongnya bulan ini
      if (k.status === "APPROVED" && k.bulanPotong) {
        const kasbonDate = new Date(k.bulanPotong);
        if (isSameMonth(targetDate, kasbonDate)) {
          const empId = k.karyawan?.id;
          if (!empId) return;

          if (!result[empId]) {
            result[empId] = {
              karyawan: k.karyawan,
              potonganPinjaman: 0,
              pinjamanDetails: [],
              potonganKasbon: 0,
            };
          }

          result[empId].potonganKasbon += Number(k.jumlah);
        }
      }
    });

    // Konversi object ke array dan urutkan
    return Object.values(result).sort((a: any, b: any) =>
      a.karyawan.namaLengkap.localeCompare(b.karyawan.namaLengkap)
    );
  }, [loans, kasbon, selectedMonth]);

  const totalKeseluruhan = simulations.reduce(
    (acc, item) => acc + item.potonganPinjaman + item.potonganKasbon,
    0
  );

  return (
    <div className="space-y-6 mt-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Simulasi Potongan Gaji</h2>
          <p className="text-sm text-gray-500">
            Perkiraan potongan untuk pinjaman dan kasbon pada bulan yang dipilih.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-600">Pilih Bulan:</label>
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-xl border-gray-200 w-48"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="font-bold text-gray-700">Karyawan</TableHead>
              <TableHead className="font-bold text-gray-700 text-right">
                Potongan Pinjaman
                <span className="block mt-1.5">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 shadow-sm text-[10px] uppercase tracking-wider">
                    {format(new Date(selectedMonth + "-01"), "MMM yyyy", { locale: id })}
                  </Badge>
                </span>
              </TableHead>
              <TableHead className="font-bold text-gray-700 text-right">
                Potongan Kasbon
                <span className="block mt-1.5">
                  <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 shadow-sm text-[10px] uppercase tracking-wider">
                    {format(new Date(selectedMonth + "-01"), "MMM yyyy", { locale: id })}
                  </Badge>
                </span>
              </TableHead>
              <TableHead className="font-bold text-gray-700 text-right">
                Total Potongan
                <span className="block mt-1.5">
                  <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200 shadow-sm text-[10px] uppercase tracking-wider">
                    {format(new Date(selectedMonth + "-01"), "MMM yyyy", { locale: id })}
                  </Badge>
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {simulations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-gray-500">
                  Tidak ada potongan pinjaman atau kasbon pada bulan ini.
                </TableCell>
              </TableRow>
            ) : (
              simulations.map((item: any) => (
                <TableRow key={item.karyawan.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell>
                    <p className="font-bold text-gray-800">{item.karyawan.namaLengkap}</p>
                    <p className="text-xs text-gray-500">{item.karyawan.nik} • {item.karyawan.jabatan}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    {item.potonganPinjaman > 0 ? (
                      <div className="flex flex-col items-end">
                        <span className="font-medium text-blue-600">
                          {formatCurrency(item.potonganPinjaman)}
                        </span>
                        {item.pinjamanDetails.map((pd: any, idx: number) => (
                          <span key={idx} className="text-[10px] text-gray-500 mt-0.5 bg-blue-50 px-1.5 py-0.5 rounded">
                            {formatCurrency(pd.totalPinjaman)} (s/d {format(pd.endDate, "MMM yyyy", { locale: id })})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="font-medium text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.potonganKasbon > 0 ? (
                      <Badge className="bg-amber-100 hover:bg-amber-200 text-amber-700 border-amber-200">
                        {formatCurrency(item.potonganKasbon)}
                      </Badge>
                    ) : (
                      <span className="text-gray-400 font-medium">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge className="bg-red-100 hover:bg-red-200 text-red-700 border-red-200 text-sm py-1 px-2">
                      {formatCurrency(item.potonganPinjaman + item.potonganKasbon)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {simulations.length > 0 && (
          <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-between items-center">
            <span className="font-bold text-gray-700">Estimasi Total Seluruh Potongan:</span>
            <span className="text-xl font-black text-red-600">{formatCurrency(totalKeseluruhan)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
