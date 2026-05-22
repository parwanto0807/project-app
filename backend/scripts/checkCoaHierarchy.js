import { prisma } from '../src/config/db.js';

async function checkHierarchy() {
  const allCoas = await prisma.chartOfAccounts.findMany({
    select: {
      id: true,
      code: true,
      name: true,
      parentId: true,
      postingType: true
    }
  });

  const withParent = allCoas.filter(c => c.parentId).length;
  ;(() => {})(`Total COAs: ${allCoas.length}`);
  ;(() => {})(`COAs with parentId: ${withParent}`);
  ;(() => {})(`COAs without parentId: ${allCoas.length - withParent}`);

  ;(() => {})('\n--- Sample COAs without parentId (POSTING type) ---');
  ;(() => {})(allCoas.filter(c => !c.parentId && c.postingType === 'POSTING').slice(0, 10));

  ;(() => {})('\n--- Sample HEADER accounts ---');
  ;(() => {})(allCoas.filter(c => c.postingType === 'HEADER').slice(0, 10));

  await prisma.$disconnect();
}

checkHierarchy();
