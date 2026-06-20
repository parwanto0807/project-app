"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, Printer, Package, ArrowRight, Loader2 } from 'lucide-react';
import { getTopUsage, TopUsageItem } from '@/lib/action/inventory/inventoryAction';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { toast } from 'sonner';
import TopUsagePdf from './TopUsagePdf';
import { Badge } from '@/components/ui/badge';

interface TopUsageWidgetProps {
  period: string;
  warehouseId?: string;
  warehouseName?: string;
}

export default function TopUsageWidget({ period, warehouseId, warehouseName = 'All Warehouses' }: TopUsageWidgetProps) {
  const [top5, setTop5] = useState<TopUsageItem[]>([]);
  const [top20, setTop20] = useState<TopUsageItem[]>([]);
  const [loadingTop5, setLoadingTop5] = useState(true);
  const [loadingTop20, setLoadingTop20] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    const fetchTop5 = async () => {
      setLoadingTop5(true);
      const data = await getTopUsage(period, 5, warehouseId);
      setTop5(data);
      setLoadingTop5(false);
    };
    fetchTop5();
  }, [period, warehouseId]);

  const fetchTop20 = async () => {
    if (top20.length > 0) return; // already fetched
    setLoadingTop20(true);
    const data = await getTopUsage(period, 20, warehouseId);
    setTop20(data);
    setLoadingTop20(false);
  };

  const handleDialogOpen = (open: boolean) => {
    setIsDialogOpen(open);
    if (open) {
      fetchTop20();
    }
  };

  const handlePrintPdf = async () => {
    if (isGeneratingPdf || top20.length === 0) return;
    setIsGeneratingPdf(true);
    try {
      toast.info("Membuat PDF...", { duration: 2000 });
      import('@react-pdf/renderer').then(async (mod) => {
        const { pdf } = mod;
        const displayPeriod = period ? format(new Date(period + '-01'), 'MMMM yyyy', { locale: idLocale }) : format(new Date(), 'MMMM yyyy', { locale: idLocale });
        const blob = await pdf(
          <TopUsagePdf
            data={top20}
            period={displayPeriod}
            warehouseName={warehouseName}
          />
        ).toBlob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setIsGeneratingPdf(false);
        toast.success("PDF berhasil dibuat!");
      }).catch(err => {
        console.error("PDF Error:", err);
        setIsGeneratingPdf(false);
        toast.error("Gagal memuat modul PDF");
      });
    } catch (error) {
      console.error(error);
      setIsGeneratingPdf(false);
      toast.error("Gagal membuat PDF");
    }
  };

  if (loadingTop5) {
    return (
      <Card className="border-none shadow-sm bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl h-full flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </Card>
    );
  }

  if (top5.length === 0) {
    return (
      <Card className="border-none shadow-sm bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl h-full">
        <CardContent className="p-5 flex flex-col items-center justify-center min-h-[200px] text-center">
          <Package className="w-10 h-10 text-slate-300 mb-2" />
          <p className="font-bold text-slate-500">Belum Ada Pemakaian</p>
          <p className="text-xs text-slate-400">Tidak ada barang yang keluar di periode ini.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogOpen}>
      <Card className="border border-indigo-100 dark:border-indigo-900/50 shadow-md bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-slate-900 h-full relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <TrendingUp className="w-24 h-24 text-indigo-500" />
        </div>
        <CardContent className="p-5 flex flex-col h-full relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-500/10 rounded-xl">
                <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Top 5 Pemakaian</h3>
            </div>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100/50">
                Lihat Top 20
                <ArrowRight className="w-3 h-3" />
              </Button>
            </DialogTrigger>
          </div>

          <div className="space-y-3 flex-1">
            {top5.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between gap-2 bg-white/60 dark:bg-slate-800/50 p-2 rounded-xl">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex-shrink-0 w-6 text-center">
                    <span className="text-xs font-black text-indigo-300">#{index + 1}</span>
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{item.productName}</p>
                    <p className="text-[10px] text-slate-400 truncate">{item.warehouseName}</p>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-black text-rose-500">{new Intl.NumberFormat('id-ID').format(item.stockOut)}</p>
                  <p className="text-[9px] text-slate-400 uppercase">{item.unit}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <DialogContent className="sm:max-w-[1200px] w-[95vw] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                Top 20 Barang Pemakaian Terbanyak
              </DialogTitle>
              <DialogDescription>
                Daftar barang dengan jumlah keluar (Out) paling tinggi pada periode yang dipilih.
              </DialogDescription>
            </div>
            <Button 
              variant="outline" 
              onClick={handlePrintPdf} 
              disabled={isGeneratingPdf || loadingTop20}
              className="gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
            >
              {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
              Print PDF
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto mt-4 border rounded-xl">
          <Table>
            <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <TableRow>
                <TableHead className="w-16 text-center">Peringkat</TableHead>
                <TableHead>Kode</TableHead>
                <TableHead>Nama Barang</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Gudang</TableHead>
                <TableHead className="text-right">Total Pemakaian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingTop20 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
                  </TableCell>
                </TableRow>
              ) : top20.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                    Tidak ada data pemakaian.
                  </TableCell>
                </TableRow>
              ) : (
                top20.map((item, idx) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/50">
                    <TableCell className="text-center">
                      <Badge variant={idx < 3 ? "default" : "secondary"} className={idx < 3 ? "bg-indigo-500" : ""}>
                        #{idx + 1}
                      </Badge>
                    </TableCell>
                    <TableCell><code className="text-xs bg-slate-100 px-1 py-0.5 rounded">{item.productCode}</code></TableCell>
                    <TableCell className="font-bold">{item.productName}</TableCell>
                    <TableCell><span className="text-xs text-slate-500">{item.category}</span></TableCell>
                    <TableCell><span className="text-xs text-slate-500">{item.warehouseName}</span></TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-2">
                        <span className="font-black text-rose-500">{new Intl.NumberFormat('id-ID').format(item.stockOut)}</span>
                        <span className="text-xs text-slate-400">{item.unit}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
