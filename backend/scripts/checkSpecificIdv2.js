import { prisma } from "../src/config/db.js";
import fs from 'fs';

async function checkSpecificId() {
  const idToCheck = '2242b43b'; 
  (() => {})(`Checking ID ${idToCheck}...`);

  const tb = await prisma.trialBalance.findFirst({
    where: { id: { startsWith: idToCheck } },
    include: { coa: true, period: true }
  });

  if (tb) {
      (() => {})('Record Found:');
      (() => {})('Period:', tb.period.periodName, tb.period.periodCode, tb.period.id);
      (() => {})('Opening:', tb.openingDebit);
      (() => {})('Period:', tb.periodDebit);
      (() => {})('Ending:', tb.endingDebit);
  } else {
      (() => {})('Record NOT Found.');
  }
}

checkSpecificId()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
