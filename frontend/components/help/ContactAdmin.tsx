"use client";

import React from "react";
import { Mail, Phone, User, ShieldAlert, CheckCircle2, MessageSquare, ExternalLink, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const ContactAdmin = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
          <Phone className="w-8 h-8 text-indigo-500" />
          Kontak Admin & Dukungan Sistem
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Hubungi pengembang sistem untuk bantuan teknis, laporan bug, atau permintaan fitur baru.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card className="border-none shadow-xl bg-gradient-to-b from-indigo-500/10 to-transparent dark:from-indigo-500/5">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center mb-4 shadow-lg ring-4 ring-white dark:ring-slate-900">
                <User className="w-12 h-12 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold">Parwanto</CardTitle>
              <CardDescription className="text-indigo-600 dark:text-indigo-400 font-medium">System Developer</CardDescription>
              <div className="flex justify-center gap-2 mt-2">
                <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-none">Full Stack</Badge>
                <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-none">DevOps</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <Separator className="bg-slate-200 dark:bg-slate-800" />
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm group cursor-pointer" onClick={() => window.open('tel:081280212068')}>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm group-hover:bg-indigo-500 group-hover:text-white transition-all">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500">Phone / WhatsApp</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">0812-8021-2068</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm group cursor-pointer" onClick={() => window.open('mailto:parwanto0807@gmail.com')}>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm group-hover:bg-indigo-500 group-hover:text-white transition-all">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500">Email Address</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">parwanto0807@gmail.com</span>
                  </div>
                </div>
              </div>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20" onClick={() => window.open('https://wa.me/6281280212068')}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Kirim Pesan Cepat
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Info & Warnings */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Layanan Dukungan
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                <h4 className="font-bold mb-1 text-sm">Pemeliharaan Sistem</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Pembaruan rutin untuk memastikan sistem berjalan optimal dan aman.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                <h4 className="font-bold mb-1 text-sm">Bantuan Teknis</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Bantuan penanganan masalah teknis pada aplikasi dan database.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                <h4 className="font-bold mb-1 text-sm">Pengembangan Fitur</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Konsultasi dan implementasi fitur tambahan sesuai kebutuhan bisnis.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                <h4 className="font-bold mb-1 text-sm">Backup Data</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Manajemen pencadangan data untuk menjamin keamanan informasi.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-amber-500/5 dark:bg-amber-500/10 border-l-4 border-l-amber-500">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <ShieldAlert className="w-6 h-6" />
                Himbauan & Kebijakan Penggunaan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2">
                {[
                  "Gunakan akun pribadi Anda dan jangan pernah membagikan kredensial login kepada pihak lain.",
                  "Lakukan logout secara manual setelah selesai menggunakan aplikasi, terutama pada perangkat bersama.",
                  "Segera laporkan jika menemukan aktivitas mencurigakan atau kesalahan data pada sistem.",
                  "Seluruh aktivitas dalam aplikasi ini dicatat dalam sistem Audit Log demi keamanan data.",
                  "Dilarang mencoba melakukan tindakan modifikasi ilegal atau peretasan terhadap infrastruktur sistem."
                ].map((text, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <span className="text-amber-500 font-bold">•</span>
                    {text}
                  </li>
                ))}
              </ul>
              <div className="mt-4 p-3 bg-white dark:bg-slate-800 rounded-lg text-[11px] text-slate-500 italic flex items-start gap-2">
                <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                Sistem ini dikembangkan secara profesional untuk mendukung efisiensi operasional perusahaan. Mohon gunakan dengan bijak dan bertanggung jawab.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContactAdmin;
