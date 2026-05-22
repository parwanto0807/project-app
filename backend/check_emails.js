import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  ;(() => {})("=== Checking AccountEmail Table ===");
  const accountEmails = await prisma.accountEmail.findMany();
  ;(() => {})(`Total allowed emails: ${accountEmails.length}`);
  accountEmails.forEach(ae  => (() => {})(`- ${ae.email} (ID: ${ae.id})`));

  ;(() => {})("\n=== Checking User Table ===");
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      provider: true,
      active: true
    }
  });
  ;(() => {})(`Total users: ${users.length}`);
  users.forEach(u  => (() => {})(`- ${u.email} | Name: ${u.name} | Role: ${u.role} | Provider: ${u.provider} | Active: ${u.active}`));

  ;(() => {})("\n=== Checking Karyawan Table ===");
  const karyawans = await prisma.karyawan.findMany({
    select: {
      id: true,
      email: true,
      namaLengkap: true,
      nik: true,
      userId: true,
      isActive: true
    }
  });
  ;(() => {})(`Total employees (Karyawan): ${karyawans.length}`);
  karyawans.forEach(k  => (() => {})(`- ${k.email} | Name: ${k.namaLengkap} | NIK: ${k.nik} | UserID: ${k.userId} | Active: ${k.isActive}`));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
