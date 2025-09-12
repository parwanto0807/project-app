// /types/karyawan.ts
export interface Karyawan {
  id: string
  nik: string
  namaLengkap: string
  tanggalLahir?: string | null
  alamat?: string | null
  nomorTelepon?: string | null
  email?: string | null
  jabatan?: string | null
  departemen?: string | null
  tanggalMasuk?: string | null
  tanggalKeluar?: string | null
  statusKerja: string
  foto?: string | null
  tipeKontrak?: string | null
  gajiPokok?: number | null
  tunjangan?: number | null
  potongan?: number | null
  isActive: boolean

  createdAt: string
  updatedAt: string
}
