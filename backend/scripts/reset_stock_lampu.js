import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function run() {
  const prod = await prisma.product.findFirst({ where: { code: "PRD-96B0C97B" } })
  if (!prod) { console.log("Product not found"); return }

  const wh = await prisma.warehouse.findFirst({ where: { name: { contains: "WIP PROJECT" } } })
  if (!wh) { console.log("Warehouse not found"); return }

  const balance = await prisma.stockBalance.findFirst({
    where: {
      productId: prod.id,
      warehouseId: wh.id,
      stockAkhir: { gt: 0 }
    },
    orderBy: { period: "desc" }
  })

  if (!balance) {
    console.log("Tidak ada StockBalance dengan stock > 0 untuk product ini")
    await prisma.$disconnect()
    return
  }

  console.log(`Mereset stock: ${prod.name} (${prod.code})`)
  console.log(`  Warehouse: ${wh.name}`)
  console.log(`  Period: ${balance.period.toISOString()}`)
  console.log(`  Stock saat ini: ${balance.stockAkhir}`)

  const updated = await prisma.stockBalance.update({
    where: { id: balance.id },
    data: {
      stockAwal: 0,
      stockIn: 0,
      stockOut: 0,
      justIn: 0,
      justOut: 0,
      onPR: 0,
      bookedStock: 0,
      stockAkhir: 0,
      availableStock: 0,
      inventoryValue: 0
    }
  })

  console.log(`\n✅ Stock ${prod.code} di ${wh.name} telah direset ke 0`)
  await prisma.$disconnect()
}

run().catch(e => { console.error(e); prisma.$disconnect() })
