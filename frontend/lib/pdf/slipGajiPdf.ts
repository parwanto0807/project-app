import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export const generateSlipGajiPdf = (previewData: any, fmt: (v: number) => string) => {
  if (!previewData || !previewData.karyawan || !previewData.kalkulasi) return;

  const { karyawan, kalkulasi: k, periode, pinjaman: pinjamanData } = previewData;
  const doc = new jsPDF("p", "pt", "a4");

  // --- Header ---
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("SLIP GAJI KARYAWAN", 40, 40);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Periode: ${format(new Date(periode), "MMMM yyyy", { locale: id })}`, 40, 55);

  // --- Employee Info ---
  doc.setFont("helvetica", "bold");
  doc.text("Informasi Karyawan", 40, 80);
  doc.setFont("helvetica", "normal");
  doc.text(`Nama Lengkap: ${karyawan.namaLengkap}`, 40, 95);
  doc.text(`NIK: ${karyawan.nik || "-"}`, 40, 110);
  doc.text(`Jabatan: ${karyawan.jabatan || "-"}`, 300, 95);
  doc.text(`Tipe Kontrak: ${karyawan.tipeKontrak || "-"}`, 300, 110);

  doc.setLineWidth(0.5);
  doc.line(40, 120, 550, 120);

  // --- Summary Absensi ---
  doc.setFont("helvetica", "bold");
  doc.text("Rekap Absensi", 40, 140);
  doc.setFont("helvetica", "normal");
  doc.text(`Hari Hadir: ${k.hariHadir}`, 40, 155);
  doc.text(`Izin/Sakit: ${k.hariIzin}`, 40, 170);
  doc.text(`Total Jam Kerja: ${k.totalJamKerja}j`, 300, 155);
  doc.text(`Jam Lembur: ${k.totalJamLembur}j`, 300, 170);

  doc.line(40, 180, 550, 180);

  // --- Rincian Pendapatan & Potongan ---
  let startY = 200;
  
  doc.setFont("helvetica", "bold");
  doc.text("PENDAPATAN", 40, startY);
  doc.text("POTONGAN", 300, startY);
  
  doc.setFont("helvetica", "normal");
  startY += 15;
  
  const isHarian = karyawan.tipeKontrak === "HARIAN" || karyawan.tipePenggajian === "HARIAN_BULANAN";
  
  // Pendapatan Left
  let pendY = startY;
  doc.text(isHarian ? "Gaji Harian (Pro-rate)" : "Gaji Pokok", 40, pendY);
  doc.text(fmt(k.gajiKerja), 250, pendY, { align: "right" });
  pendY += 15;
  
  if (k.tunjanganJabatan > 0) {
    doc.text("Tunjangan Jabatan", 40, pendY);
    doc.text(fmt(k.tunjanganJabatan), 250, pendY, { align: "right" });
    pendY += 15;
  }
  if (k.tunjanganKeluarga > 0) {
    doc.text("Tunjangan Keluarga", 40, pendY);
    doc.text(fmt(k.tunjanganKeluarga), 250, pendY, { align: "right" });
    pendY += 15;
  }
  if (k.tunjanganMakan > 0) {
    doc.text("Tunjangan Makan", 40, pendY);
    doc.text(fmt(k.tunjanganMakan), 250, pendY, { align: "right" });
    pendY += 15;
  }
  if (k.uangMakanLembur > 0) {
    doc.text("Uang Makan Lembur", 40, pendY);
    doc.text(fmt(k.uangMakanLembur), 250, pendY, { align: "right" });
    pendY += 15;
  }
  if (k.tunjanganTransport > 0) {
    doc.text("Tunjangan Transport", 40, pendY);
    doc.text(fmt(k.tunjanganTransport), 250, pendY, { align: "right" });
    pendY += 15;
  }
  if (k.tunjanganKehadiran > 0) {
    doc.text(`Premi Hadir (${k.hariHadir} hari)`, 40, pendY);
    doc.text(fmt(k.tunjanganKehadiran), 250, pendY, { align: "right" });
    pendY += 15;
  }
  if (k.tunjanganShift > 0) {
    doc.text("Tunjangan Shift", 40, pendY);
    doc.text(fmt(k.tunjanganShift), 250, pendY, { align: "right" });
    pendY += 15;
  }
  if (k.tunjangan > ((k.tunjanganJabatan||0) + (k.tunjanganKeluarga||0) + (k.tunjanganMakan||0) + (k.tunjanganTransport||0) + (k.tunjanganKehadiran||0) + (k.tunjanganShift||0) + (k.uangMakanLembur||0))) {
    doc.text("Tunjangan Lainnya", 40, pendY);
    doc.text(fmt(k.tunjangan - ((k.tunjanganJabatan||0) + (k.tunjanganKeluarga||0) + (k.tunjanganMakan||0) + (k.tunjanganTransport||0) + (k.tunjanganKehadiran||0) + (k.tunjanganShift||0) + (k.uangMakanLembur||0))), 250, pendY, { align: "right" });
    pendY += 15;
  }
  if (k.upahLembur > 0) {
    doc.text(`Upah Lembur (${k.totalJamLembur}j)`, 40, pendY);
    doc.text(fmt(k.upahLembur), 250, pendY, { align: "right" });
    pendY += 15;
  }
  
  // Potongan Right
  let potY = startY;
  if (k.potonganPinjaman > 0) {
    doc.text("Pinjaman", 300, potY);
    doc.text(fmt(k.potonganPinjaman), 550, potY, { align: "right" });
    potY += 15;
  }
  if (k.potonganKasbon > 0) {
    doc.text("Kasbon", 300, potY);
    doc.text(fmt(k.potonganKasbon), 550, potY, { align: "right" });
    potY += 15;
  }
  if (k.pajak > 0) {
    doc.text("Pajak", 300, potY);
    doc.text(fmt(k.pajak), 550, potY, { align: "right" });
    potY += 15;
  }
  
  // Totals
  const finalY = Math.max(pendY, potY) + 15;
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL PENDAPATAN", 40, finalY);
  doc.text(fmt(k.gajiKerja + k.tunjangan + k.upahLembur), 250, finalY, { align: "right" });
  
  const totalPotongan = (k.potongan || 0) + k.pajak + k.potonganPinjaman + k.potonganKasbon + k.potonganDpGaji;
  doc.text("TOTAL POTONGAN", 300, finalY);
  doc.text(fmt(totalPotongan), 550, finalY, { align: "right" });
  
  doc.line(40, finalY + 10, 550, finalY + 10);
  
  doc.setFontSize(12);
  doc.text("GAJI BERSIH DITERIMA", 300, finalY + 30);
  doc.text(fmt(k.total), 550, finalY + 30, { align: "right" });

  // --- Sisa Pinjaman Info ---
  let sisaInfoY = finalY + 45;
  if (pinjamanData?.details?.length > 0 && k.potonganPinjaman > 0) {
    // Get unique loans and their remaining balances
    const loanMap = new Map<string, { sisa: number }>();
    for (const detail of pinjamanData.details) {
      if (detail.pinjaman?.id && !loanMap.has(detail.pinjaman.id)) {
        loanMap.set(detail.pinjaman.id, {
          sisa: Number(detail.pinjaman.sisaPinjaman || 0),
        });
      }
    }
    // Total sisa after this payroll deduction
    const totalSisaAfter = Array.from(loanMap.values()).reduce((sum, l) => sum + l.sisa, 0) - k.potonganPinjaman;

    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100);
    doc.text(`* Sisa Pinjaman setelah potongan bulan ini: ${fmt(Math.max(0, totalSisaAfter))}`, 300, sisaInfoY);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    sisaInfoY += 15;
  }

  // --- Detail Per Hari (Tabel) ---
  if (k.detailHarian && k.detailHarian.length > 0) {
    doc.setFontSize(10);
    doc.text("Detail Absensi & Gaji Per Hari", 40, sisaInfoY + 15);
    
    const tableData = k.detailHarian.map((d: any) => [
      format(new Date(d.tanggal), "dd MMM", { locale: id }),
      d.status,
      d.jamMasuk ? format(new Date(d.jamMasuk), "HH:mm") : "-",
      d.jamKeluar ? format(new Date(d.jamKeluar), "HH:mm") : "-",
      d.jamKerja > 0 ? `${d.jamKerja}j` : "-",
      d.jamLemburRaw > 0 ? `${d.jamLemburRaw}j` : "-",
      d.jamLembur > 0 ? `${d.jamLembur}j` : "-",
      d.gajiKerjaHariIni > 0 ? fmt(d.gajiKerjaHariIni) : "-",
      d.uangMakanHariIni > 0 ? fmt(d.uangMakanHariIni) : "-",
      d.uangMakanLemburHariIni > 0 ? fmt(d.uangMakanLemburHariIni) : "-",
      d.upahLemburHariIni > 0 ? fmt(d.upahLemburHariIni) : "-"
    ]);

    autoTable(doc, {
      startY: sisaInfoY + 25,
      head: [["Tanggal", "Status", "Masuk", "Keluar", "Kerja", "Lbr.Akt", "Lbr.Setuju", "Gaji Harian", "Uang Makan", "UM Lembur", "Upah Lembur"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [8, 145, 178] }, // cyan-600
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        7: { halign: 'right' },
        8: { halign: 'right' },
        9: { halign: 'right' },
        10: { halign: 'right' }
      }
    });
  }

  doc.save(`Slip_Gaji_${karyawan.namaLengkap.replace(/\s+/g, '_')}_${periode}.pdf`);
};
