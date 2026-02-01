import { prisma } from "../src/config/db.js";
import fs from 'fs';

async function mapWarehouses() {
  const coaMap = {
    'GUDANG BENGKEL': '1-10202',
    'GUDANG KEBON': '1-10203',
    'GUDANG B ZHAENAL': '1-10204',
    'GUDANG WIP PROJECT ': '1-10205'
  };

  const updates = [];

  for (const [whName, coaCode] of Object.entries(coaMap)) {
    const coa = await prisma.chartOfAccounts.findFirst({
      where: { code: coaCode }
    });

    if (coa) {
      const result = await prisma.warehouse.updateMany({
        where: { name: whName },
        data: { inventoryAccountId: coa.id }
      });
      updates.push({ whName, coaCode, coaId: coa.id, updated: result.count });
    } else {
      updates.push({ whName, coaCode, status: 'COA not found' });
    }
  }

  fs.writeFileSync('warehouse_mapping_result.json', JSON.stringify(updates, null, 2));
}

mapWarehouses()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
