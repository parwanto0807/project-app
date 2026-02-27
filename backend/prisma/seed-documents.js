import { PrismaClient } from './generated/prisma/index.js'
const prisma = new PrismaClient()

async function main() {
  const depts = [
    { code: 'SM', name: 'Sales & Marketing' },
    { code: 'HR', name: 'Human Resources' },
    { code: 'IT', name: 'Information Technology' },
    { code: 'FIN', name: 'Finance' },
    { code: 'OPS', name: 'Operations' },
  ]

  for (const dept of depts) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: dept,
    })
  }

  console.log('Seeded departments')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
