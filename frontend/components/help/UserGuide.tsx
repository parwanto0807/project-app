"use client";

import React from "react";
import { BookOpen, CheckCircle2, Info, Lightbulb, MessageCircle, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const UserGuide = () => {
  const guideSections = [
    {
      id: "umum",
      title: "Umum",
      icon: <Info className="w-4 h-4" />,
      content: [
        { label: "Login & Autentikasi", detail: "Gunakan email dan password yang terdaftar untuk masuk ke sistem." },
        { label: "Navigasi Sidebar", detail: "Gunakan menu di sisi kiri untuk berpindah antar modul aplikasi." },
        { label: "Ganti Tema", detail: "Pilih mode terang, gelap, atau sistem melalui menu profil." },
      ]
    },
    {
      id: "transaksi",
      title: "Transaksi",
      icon: <Lightbulb className="w-4 h-4" />,
      content: [
        { label: "Purchase Request (PR)", detail: "Buat permintaan pembelian barang melalui menu Logistic > Purchase Request." },
        { label: "Verifikasi PR", detail: "Admin Logistic melakukan verifikasi sebelum PR disetujui oleh Finance." },
        { label: "Purchase Order (PO)", detail: "PO dibuat setelah PR melewati tahap verifikasi dan approval." },
      ]
    },
    {
      id: "keamanan",
      title: "Keamanan",
      icon: <Shield className="w-4 h-4" />,
      content: [
        { label: "Keamanan Akun", detail: "Jangan bagikan password Anda kepada siapapun." },
        { label: "Logout Sesi", detail: "Pastikan selalu logout setelah selesai menggunakan aplikasi di perangkat publik." },
        { label: "Izin Akses", detail: "Setiap fitur dibatasi oleh hak akses (Permission) yang diatur oleh Super Admin." },
      ]
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-blue-500" />
          Panduan Penggunaan
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Petunjuk ringkas penggunaan fitur-fitur utama dalam sistem.
        </p>
      </div>

      <div className="grid gap-6">
        <Tabs defaultValue="umum" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {guideSections.map((section) => (
              <TabsTrigger 
                key={section.id} 
                value={section.id}
                className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm transition-all py-2.5"
              >
                <span className="flex items-center gap-2">
                  {section.icon}
                  {section.title}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {guideSections.map((section) => (
            <TabsContent key={section.id} value={section.id} className="space-y-4 focus-visible:outline-none">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {section.content.map((item, idx) => (
                  <Card key={idx} className="border-none shadow-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 group">
                    <CardHeader className="pb-2">
                      <Badge variant="outline" className="w-fit mb-2 border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/5">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Langkah {idx + 1}
                      </Badge>
                      <CardTitle className="text-lg group-hover:text-blue-500 transition-colors">
                        {item.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {item.detail}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 bg-transparent">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <MessageCircle className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Butuh Bantuan Lebih Lanjut?</CardTitle>
                <CardDescription>Jika Anda mengalami kesulitan teknis, silakan hubungi tim IT atau Admin Sistem.</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default UserGuide;
