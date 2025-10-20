// import { prisma } from "../../prisma/generated/prisma/index.js";
// import { prisma } from "./prismaClient.js";
import { prisma } from "../config/db.js";

export function toNum(n) {
  const v = typeof n === "string" ? Number(n) : n;
  return Number.isFinite(v) ? v : 0;
}

export function calcLineTotal(qty, unitPrice, discount, taxRate) {
  const base = qty * unitPrice;
  const afterDisc = Math.max(base - discount, 0);
  const tax = (taxRate / 100) * afterDisc;
  return Math.max(afterDisc + tax, 0);
}

export function rollup(items) {
  let subtotal = 0,
    discountTotal = 0,
    taxTotal = 0,
    grandTotal = 0;
  for (const it of items) {
    const base = it.qty * it.unitPrice;
    const afterDisc = Math.max(base - it.discount, 0);
    const tax = (it.taxRate / 100) * afterDisc;
    const line = Math.max(afterDisc + tax, 0);
    subtotal += base;
    discountTotal += it.discount;
    taxTotal += tax;
    grandTotal += line;
  }
  return { subtotal, discountTotal, taxTotal, grandTotal };
}

/** Recalc header totals from DB; gunakan di transaksi (tx) jika ada, kalau tidak pakai prisma global */
export async function recalcHeaderTotals(executor, salesOrderId) {
  const client = executor || prisma; // tx atau prisma

  const dbItems = await client.salesOrderItem.findMany({
    where: { salesOrderId },
    select: { qty: true, unitPrice: true, discount: true, taxRate: true },
  });

  const totals = rollup(
    dbItems.map((it) => ({
      qty: Number(it.qty),
      unitPrice: Number(it.unitPrice),
      discount: Number(it.discount),
      taxRate: Number(it.taxRate),
    }))
  );

  await client.salesOrder.update({
    where: { id: salesOrderId },
    data: {
      subtotal: new prisma.Decimal(totals.subtotal),
      discountTotal: new prisma.Decimal(totals.discountTotal),
      taxTotal: new prisma.Decimal(totals.taxTotal),
      grandTotal: new prisma.Decimal(totals.grandTotal),
    },
  });

  return totals;
}
