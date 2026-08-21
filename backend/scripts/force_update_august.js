import { PrismaClient } from '@prisma/client';
import { updatePRRemainingBudget } from '../src/utils/prParentChildHelpers.js';

const prisma = new PrismaClient();

async function main() {
  const prs = await prisma.purchaseRequest.findMany({
    where: { nomorPr: { contains: 'VIII/26' } },
    select: { id: true, nomorPr: true }
  });
  console.log('Found', prs.length, 'PRs in August');
  for (const pr of prs) {
    console.log('Updating', pr.nomorPr);
    await updatePRRemainingBudget(pr.id, prisma);
  }
  console.log('Done updating August PRs!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
