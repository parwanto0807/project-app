import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("=== Checking AccountEmail Table ===");
  const accountEmails = await prisma.accountEmail.findMany();
  console.log(`Total allowed emails: ${accountEmails.length}`);
  accountEmails.forEach(ae => console.log(`- ${ae.email} (ID: ${ae.id})`));

  console.log("\n=== Checking User Table ===");
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
  console.log(`Total users: ${users.length}`);
  users.forEach(u => console.log(`- ${u.email} | Name: ${u.name} | Role: ${u.role} | Provider: ${u.provider} | Active: ${u.active}`));

  console.log("\n=== Checking Karyawan Table ===");
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
  console.log(`Total employees (Karyawan): ${karyawans.length}`);
  karyawans.forEach(k => console.log(`- ${k.email} | Name: ${k.namaLengkap} | NIK: ${k.nik} | UserID: ${k.userId} | Active: ${k.isActive}`));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
