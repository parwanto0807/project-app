const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const target = '1778564560767-739245594.jpeg';
  const karyawan = await prisma.karyawan.findMany({
    where: {
      foto: {
        contains: target
      }
    }
  });
  ;(() => {})(JSON.stringify(karyawan, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
