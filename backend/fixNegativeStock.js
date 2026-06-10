import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixNegativeStockBalances() {
    try {
        console.log("Searching for StockBalance records with negative values...");
        const negativeBalances = await prisma.stockBalance.findMany({
            where: {
                OR: [
                    { onPR: { lt: 0 } },
                    { bookedStock: { lt: 0 } },
                    { availableStock: { lt: 0 } }
                ]
            }
        });

        console.log(`Found ${negativeBalances.length} records with negative values.`);

        for (const balance of negativeBalances) {
            const currentOnPR = Number(balance.onPR) || 0;
            const currentBooked = Number(balance.bookedStock) || 0;
            const currentAvailable = Number(balance.availableStock) || 0;

            const newOnPR = Math.max(0, currentOnPR);
            const newBooked = Math.max(0, currentBooked);
            const newAvailable = Math.max(0, currentAvailable);

            console.log(`Fixing Balance ID: ${balance.id}`);
            console.log(`  onPR: ${currentOnPR} -> ${newOnPR}`);
            console.log(`  bookedStock: ${currentBooked} -> ${newBooked}`);
            console.log(`  availableStock: ${currentAvailable} -> ${newAvailable}`);

            await prisma.stockBalance.update({
                where: { id: balance.id },
                data: {
                    onPR: newOnPR,
                    bookedStock: newBooked,
                    availableStock: newAvailable
                }
            });
        }

        console.log("All negative stock balances have been fixed and clamped to 0.");
    } catch (error) {
        console.error("Error fixing negative stock balances:", error);
    } finally {
        await prisma.$disconnect();
    }
}

fixNegativeStockBalances();
