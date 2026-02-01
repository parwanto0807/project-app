import { prisma } from "../src/config/db.js";

async function fix() {
  const result = await prisma.accountingPeriod.update({
    where: { id: "e14167d7-6e0e-4d6b-9964-79b2128370dc" },
    data: {
      fiscalYear: 2026,
      periodMonth: 1,
      quarter: 1
    }
  });
  console.log('Fixed January 2026 period meta:', result);
}

fix()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
