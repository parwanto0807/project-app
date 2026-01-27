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
  console.log(`Total COAs: ${allCoas.length}`);
  console.log(`COAs with parentId: ${withParent}`);
  console.log(`COAs without parentId: ${allCoas.length - withParent}`);

  console.log('\n--- Sample COAs without parentId (POSTING type) ---');
  console.log(allCoas.filter(c => !c.parentId && c.postingType === 'POSTING').slice(0, 10));

  console.log('\n--- Sample HEADER accounts ---');
  console.log(allCoas.filter(c => c.postingType === 'HEADER').slice(0, 10));

  await prisma.$disconnect();
}

checkHierarchy();
