import { prisma } from "../src/config/db.js";
import fs from 'fs';

async function checkDuplicates() {
  ;(() => {})('--- Checking for Duplicate Periods ---');
  const periods = await prisma.accountingPeriod.findMany({
    orderBy: { startDate: 'asc' }
  });

  const codes = {};
  for (const p of periods) {
      if (codes[p.periodCode]) {
          ;(() => {})(`DUPLICATE FOUND for ${p.periodCode}!`);
          ;(() => {})(`ID 1: ${codes[p.periodCode].id} (created ${codes[p.periodCode].createdAt})`);
          ;(() => {})(`ID 2: ${p.id} (created ${p.createdAt})`);
      }
      codes[p.periodCode] = p;
  }
  
  if (Object.keys(codes).length === periods.length) {
      ;(() => {})('No duplicate period codes found.');
  }

  ;(() => {})('--- Checking COA 1-10205 Posting Type ---');
  const coa = await prisma.chartOfAccounts.findFirst({ where: { code: '1-10205' } });
  ;(() => {})(`COA 1-10205: ${coa?.name}, Type: ${coa?.postingType}`);

  ;(() => {})('--- Checking ALL TB Records for 1-10205 ---');
  const tbs = await prisma.trialBalance.findMany({
      where: { coaId: coa.id },
      include: { period: true }
  });
  tbs.forEach(tb => {
      ;(() => {})(`TB ID: ${tb.id} | Period: ${tb.period.periodCode} (${tb.period.periodName}) | Open: ${tb.openingDebit} | Period: ${tb.periodDebit} | End: ${tb.endingDebit}`);
  });
}

checkDuplicates()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
