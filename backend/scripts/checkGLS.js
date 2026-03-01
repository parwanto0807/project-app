import { prisma } from '../src/config/db.js';
const period = await prisma.accountingPeriod.findFirst({ where: { fiscalYear: 2026, periodMonth: 3 }});
const gls = await prisma.generalLedgerSummary.findMany({
  where: { periodId: period.id },
  include: { coa: { select: { code: true, name: true } } },
  orderBy: { coa: { code: 'asc' } }
});
let totD=0, totC=0, totO=0;
for (const g of gls) {
  const d=Number(g.debitTotal), c=Number(g.creditTotal), o=Number(g.openingBalance), cl=Number(g.closingBalance);
  totD+=d; totC+=c; totO+=o;
  if(d>0||c>0||o!==0) console.log(g.coa.code, '|', g.coa.name.substring(0,25), '| O='+o.toLocaleString('id-ID'), '| D='+d.toLocaleString('id-ID'), '| K='+c.toLocaleString('id-ID'), '| CL='+cl.toLocaleString('id-ID'));
}
console.log('\nGRAND TOTAL: O='+totO.toLocaleString('id-ID'), 'D='+totD.toLocaleString('id-ID'), 'K='+totC.toLocaleString('id-ID'));
console.log('IsBalanced (D==K)?', Math.abs(totD-totC) < 0.01 ? 'YES' : 'NO (diff='+(totD-totC).toLocaleString('id-ID')+')');
await prisma.$disconnect();
