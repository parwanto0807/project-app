// lib/generateCode.js
import { PrismaClient } from "../../prisma/generated/prisma/index.js";
const prisma = new PrismaClient();


const pad = (n, len = 5) => String(n).padStart(len, "0");

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