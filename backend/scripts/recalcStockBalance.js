import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("Starting stock recalculation...");

    const products = await prisma.product.findMany();
    const productMap = new Map(products.map(p => [p.id, p]));

    // Find bad details
    const details = await prisma.stockDetail.findMany();
    const badDetails = details.filter(d => {
        const product = productMap.get(d.productId);
        if (!product) return false;
        
        let expectedBaseQty = Number(d.transQty);
        if (d.transUnit === product.usageUnit && product.usageUnit !== product.storageUnit) {
            expectedBaseQty = Number(d.transQty) / Number(product.conversionToUsage || 1);
        } else if (d.transUnit === product.purchaseUnit && product.purchaseUnit !== product.storageUnit) {
            expectedBaseQty = Number(d.transQty) * Number(product.conversionToStorage || 1);
        }
        
        return Math.abs(Number(d.baseQty) - expectedBaseQty) > 0.0001;
    });

    console.log(`Found ${badDetails.length} bad details.`);
    
    // Fix bad details
    for (const d of badDetails) {
        const product = productMap.get(d.productId);
        let expectedBaseQty = Number(d.transQty);
        if (d.transUnit === product.usageUnit && product.usageUnit !== product.storageUnit) {
            expectedBaseQty = Number(d.transQty) / Number(product.conversionToUsage || 1);
        } else if (d.transUnit === product.purchaseUnit && product.purchaseUnit !== product.storageUnit) {
            expectedBaseQty = Number(d.transQty) * Number(product.conversionToStorage || 1);
        }

        let newResidualQty = Number(d.residualQty);
        // If it's an IN transaction that hasn't been consumed, adjust residualQty
        if (d.type === 'IN' || d.type === 'ADJUSTMENT_IN') {
            if (Number(d.baseQty) === Number(d.residualQty)) {
                newResidualQty = expectedBaseQty;
            } else if (Number(d.residualQty) > expectedBaseQty) {
                newResidualQty = expectedBaseQty;
            }
        }

        await prisma.stockDetail.update({
            where: { id: d.id },
            data: {
                baseQty: expectedBaseQty,
                residualQty: newResidualQty
            }
        });
        console.log(`Fixed detail ${d.id}: baseQty ${d.baseQty} -> ${expectedBaseQty}, residualQty -> ${newResidualQty}`);
    }

    // Identify affected products
    const affectedProductIds = [...new Set(badDetails.map(d => d.productId))];
    
    // Recalculate StockBalance for affected products
    for (const productId of affectedProductIds) {
        console.log(`Recalculating StockBalance for product ${productId}...`);
        const allDetails = await prisma.stockDetail.findMany({
            where: { productId },
            orderBy: { createdAt: 'asc' }
        });

        const balances = {}; // warehouseId -> { stockAwal, stockIn, stockOut, bookedStock, etc }

        for (const detail of allDetails) {
            const wh = detail.warehouseId;
            if (!balances[wh]) {
                balances[wh] = { stockIn: 0, stockOut: 0, bookedStock: 0 };
            }
            if (detail.type === 'IN' || detail.type === 'ADJUSTMENT_IN') {
                balances[wh].stockIn += Number(detail.baseQty);
            } else if (detail.type === 'OUT' || detail.type === 'ADJUSTMENT_OUT') {
                balances[wh].stockOut += Number(detail.baseQty);
            }
        }

        // Get booked stock from pending MRs
        const pendingMRs = await prisma.materialRequisition.findMany({
            where: { status: 'PENDING' },
            include: { items: true }
        });

        const product = productMap.get(productId);

        for (const mr of pendingMRs) {
            const wh = mr.warehouseId;
            for (const item of mr.items) {
                if (item.productId === productId) {
                    if (!balances[wh]) {
                        balances[wh] = { stockIn: 0, stockOut: 0, bookedStock: 0 };
                    }
                    
                    let conversion = 1;
                    if (item.unit === product.usageUnit && product.usageUnit !== product.storageUnit) {
                        conversion = 1 / Number(product.conversionToUsage || 1);
                    } else if (item.unit === product.purchaseUnit && product.purchaseUnit !== product.storageUnit) {
                        conversion = Number(product.conversionToStorage || 1);
                    }
                    
                    balances[wh].bookedStock += Number(item.qtyRequested) * conversion;
                }
            }
        }

        // Update current StockBalance
        for (const wh of Object.keys(balances)) {
            const { stockIn, stockOut, bookedStock } = balances[wh];
            const stockAkhir = stockIn - stockOut;
            const availableStock = stockAkhir - bookedStock;

            // We update the latest StockBalance period
            const latestBalance = await prisma.stockBalance.findFirst({
                where: { productId, warehouseId: wh },
                orderBy: { period: 'desc' }
            });

            if (latestBalance) {
                await prisma.stockBalance.update({
                    where: { id: latestBalance.id },
                    data: {
                        stockAkhir,
                        availableStock,
                        bookedStock,
                    }
                });
                console.log(`Updated StockBalance for ${wh}: stockAkhir=${stockAkhir}, available=${availableStock}, booked=${bookedStock}`);
            }
        }
    }

    console.log("Recalculation complete.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
