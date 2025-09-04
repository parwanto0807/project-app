-- CreateTable
CREATE TABLE "TeamKaryawan" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "karyawanId" TEXT NOT NULL,

    CONSTRAINT "TeamKaryawan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "namaTeam" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Karyawan" (
    "id" TEXT NOT NULL,
    "nik" TEXT NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "tanggalLahir" TIMESTAMP(3),
    "alamat" TEXT,
    "nomorTelepon" TEXT,
    "email" TEXT,
    "jabatan" TEXT NOT NULL,
    "departemen" TEXT,
    "tanggalMasuk" TIMESTAMP(3),
    "tanggalKeluar" TIMESTAMP(3),
    "statusKerja" TEXT NOT NULL,
    "tipeKontrak" TEXT,
    "gajiPokok" DOUBLE PRECISION,
    "tunjangan" DOUBLE PRECISION,
    "potongan" DOUBLE PRECISION,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Karyawan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gaji" (
    "id" TEXT NOT NULL,
    "karyawanId" TEXT NOT NULL,
    "periode" TIMESTAMP(3) NOT NULL,
    "gajiPokok" DOUBLE PRECISION NOT NULL,
    "tunjangan" DOUBLE PRECISION,
    "potongan" DOUBLE PRECISION,
    "total" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gaji_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Karyawan_nik_key" ON "Karyawan"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "Karyawan_email_key" ON "Karyawan"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Karyawan_userId_key" ON "Karyawan"("userId");

-- AddForeignKey
ALTER TABLE "TeamKaryawan" ADD CONSTRAINT "TeamKaryawan_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamKaryawan" ADD CONSTRAINT "TeamKaryawan_karyawanId_fkey" FOREIGN KEY ("karyawanId") REFERENCES "Karyawan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Karyawan" ADD CONSTRAINT "Karyawan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gaji" ADD CONSTRAINT "Gaji_karyawanId_fkey" FOREIGN KEY ("karyawanId") REFERENCES "Karyawan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
