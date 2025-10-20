// lib/generateCode.js
// import { PrismaClient } from "../../prisma/generated/prisma/index.js";
// const prisma = new PrismaClient();

import { prisma} from '../config/db.js';

const pad = (n, len = 5) => String(n).padStart(len, "0");
const padSpk = (n, len = 5) => String(n).padStart(len, "0");

// 👇 Konversi bulan ke Romawi
export const getRomanMonth = (month) => {
  const roman = [
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
    "XI",
    "XII",
  ];
  return roman[month - 1] || "I";
};

export async function getNextCode(entity, prefix, padLen = 5, tx = prisma) {
  const counter = await tx.counter.upsert({
    where: { name: entity },
    create: { name: entity, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
    select: { lastNumber: true },
  });
  return `${prefix}-${pad(counter.lastNumber, padLen)}`;
}

export const getNextCustomerCode = (tx = prisma) =>
  getNextCode("CUSTOMER", "CUST", 5, tx);

export const getNextProjectCode = (tx = prisma) =>
  getNextCode("PROJECT", "PRJ", 5, tx);

export const getNextKaryawanCode = (tx = prisma) =>
  getNextCode("EMPLOYEE", "NIK", 5, tx);


// 👇 Fungsi generate kode SPK
export async function getNextSpkCode(tx = prisma) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // Januari = 1, Desember = 12
  const romanMonth = getRomanMonth(month);

  // Nama counter: SPK-YYYY
  const counterName = `SPK-${year}`;

  const counter = await tx.counter.upsert({
    where: { name: counterName },
    create: { name: counterName, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
    select: { lastNumber: true },
  });

  const paddedNumber = padSpk(counter.lastNumber, 5);
  return `${paddedNumber}/RYLIF-SPK/${romanMonth}/${year}`;
}
