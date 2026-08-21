import { PrismaClient } from '@prisma/client';
import { updatePRRemainingBudget } from '../src/utils/prParentChildHelpers.js';

const prisma = new PrismaClient();

async function main() {
  const pr = await prisma.purchaseRequest.findFirst({
    where: { nomorPr: { contains: '00756' } }
  });

  if (!pr) {
    console.log('PR 00756 not found');
    return;
  }
  
  console.log(`Updating remaining budget for PR: ${pr.nomorPr}`);
  await updatePRRemainingBudget(pr.id, prisma);
  console.log('Update complete!');
  
  const updatedPr = await prisma.purchaseRequest.findUnique({
    where: { id: pr.id }
  });
  console.log('Sisa budget now:', updatedPr.sisaBudget);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
