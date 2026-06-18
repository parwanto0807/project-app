/**
 * Stock Balance Validation Utility
 * 
 * This utility ensures stock balance calculations are always correct:
 * stockAkhir = stockAwal + stockIn - stockOut + justIn - justOut
 * 
 * CRITICAL: Use this before ANY stockBalance.create() or stockBalance.update()
 */

/**
 * Validate stock balance calculation
 * @param {Object} data - Stock balance data
 * @returns {Object} - { isValid, expected, actual, diff, corrected }
 */
export function validateStockCalculation(data) {
    const stockAwal = Number(data.stockAwal) || 0;
    const stockIn = Number(data.stockIn) || 0;
    const stockOut = Number(data.stockOut) || 0;
    const justIn = Number(data.justIn) || 0;
    const justOut = Number(data.justOut) || 0;
    const stockAkhir = Number(data.stockAkhir) || 0;
    
    const expectedStockAkhir = stockAwal + stockIn - stockOut + justIn - justOut;
    const diff = Math.abs(stockAkhir - expectedStockAkhir);
    
    if (diff > 0.01) { // Small floating point tolerance
        console.warn('⚠️  Stock calculation mismatch:', {
            stockAwal,
            stockIn,
            stockOut,
            justIn,
            justOut,
            expected: expectedStockAkhir,
            actual: stockAkhir,
            diff
        });
        
        return {
            isValid: false,
            expected: expectedStockAkhir,
            actual: stockAkhir,
            diff,
            corrected: {
                ...data,
                stockAkhir: expectedStockAkhir,
                availableStock: Math.max(0, expectedStockAkhir - (Number(data.bookedStock) || 0))
            }
        };
    }
    
    return { isValid: true, expected: stockAkhir, actual: stockAkhir, diff: 0, corrected: data };
}

/**
 * Calculate correct stockAkhir from components
 * @param {Object} data - Stock balance data with stockAwal, stockIn, stockOut, justIn, justOut
 * @returns {number} - Correct stockAkhir value
 */
export function calculateStockAkhir(data) {
    const stockAwal = Number(data.stockAwal) || 0;
    const stockIn = Number(data.stockIn) || 0;
    const stockOut = Number(data.stockOut) || 0;
    const justIn = Number(data.justIn) || 0;
    const justOut = Number(data.justOut) || 0;
    
    return stockAwal + stockIn - stockOut + justIn - justOut;
}

/**
 * Calculate available stock (with floor of 0)
 * @param {number} stockAkhir 
 * @param {number} bookedStock 
 * @returns {number} - availableStock (min 0)
 */
export function calculateAvailableStock(stockAkhir, bookedStock = 0) {
    return Math.max(0, Number(stockAkhir) - Number(bookedStock));
}

/**
 * Prepare stock balance data for create/update with validation
 * @param {Object} data - Stock balance data
 * @param {boolean} autoFix - Auto-correct if invalid (default: true)
 * @returns {Object} - Validated (and possibly corrected) stock balance data
 */
export function prepareStockBalance(data, autoFix = true) {
    const validation = validateStockCalculation(data);
    
    if (!validation.isValid && autoFix) {
        console.warn('🔧 Auto-fixing stock balance calculation');
        return validation.corrected;
    }
    
    if (!validation.isValid && !autoFix) {
        throw new Error(`Invalid stock balance calculation: expected ${validation.expected}, got ${validation.actual}`);
    }
    
    // Ensure availableStock is correct
    const stockAkhir = Number(data.stockAkhir);
    const bookedStock = Number(data.bookedStock) || 0;
    const availableStock = calculateAvailableStock(stockAkhir, bookedStock);
    
    return {
        ...data,
        availableStock
    };
}

/**
 * Safe stock balance update wrapper
 * Use this instead of direct prisma.stockBalance.update()
 * 
 * @param {Object} tx - Prisma transaction
 * @param {string} id - Stock balance ID
 * @param {Object} data - Update data
 * @param {Object} options - Options (autoFix, log)
 * @returns {Promise<Object>} - Updated stock balance
 */
export async function safeStockBalanceUpdate(tx, id, data, options = {}) {
    const { autoFix = true, log = true } = options;
    
    // If updating stockAkhir or any component, validate
    if (data.stockAkhir || data.stockAwal || data.stockIn || data.stockOut || data.justIn || data.justOut) {
        // Get current balance to merge with update data
        const current = await tx.stockBalance.findUnique({
            where: { id }
        });
        
        if (current) {
            const merged = {
                ...current,
                ...data
            };
            
            const validation = validateStockCalculation(merged);
            
            if (!validation.isValid) {
                if (log) {
                    console.warn('⚠️  Stock balance update validation failed:', {
                        id,
                        ...validation
                    });
                }
                
                if (autoFix) {
                    if (log) {
                        console.log('🔧 Auto-correcting stockAkhir to:', validation.expected);
                    }
                    data.stockAkhir = validation.expected;
                    data.availableStock = calculateAvailableStock(
                        validation.expected,
                        data.bookedStock ?? current.bookedStock
                    );
                } else {
                    throw new Error(`Stock balance calculation invalid for ID ${id}`);
                }
            }
        }
    }
    
    // Ensure availableStock is calculated if stockAkhir or bookedStock changed
    if (data.stockAkhir !== undefined || data.bookedStock !== undefined) {
        const current = await tx.stockBalance.findUnique({ where: { id } });
        const stockAkhir = data.stockAkhir ?? current?.stockAkhir ?? 0;
        const bookedStock = data.bookedStock ?? current?.bookedStock ?? 0;
        data.availableStock = calculateAvailableStock(stockAkhir, bookedStock);
    }
    
    return tx.stockBalance.update({
        where: { id },
        data
    });
}

/**
 * Safe stock balance create wrapper
 * Use this instead of direct prisma.stockBalance.create()
 * 
 * @param {Object} tx - Prisma transaction
 * @param {Object} data - Create data
 * @param {Object} options - Options (autoFix, log)
 * @returns {Promise<Object>} - Created stock balance
 */
export async function safeStockBalanceCreate(tx, data, options = {}) {
    const { autoFix = true, log = true } = options;
    
    // Validate calculation
    const validation = validateStockCalculation(data);
    
    if (!validation.isValid) {
        if (log) {
            console.warn('⚠️  Stock balance create validation failed:', validation);
        }
        
        if (autoFix) {
            if (log) {
                console.log('🔧 Auto-correcting stockAkhir to:', validation.expected);
            }
            data = validation.corrected;
        } else {
            throw new Error('Stock balance calculation invalid');
        }
    }
    
    // Ensure availableStock is correct
    data.availableStock = calculateAvailableStock(data.stockAkhir, data.bookedStock);
    
    return tx.stockBalance.create({
        data
    });
}

export default {
    validateStockCalculation,
    calculateStockAkhir,
    calculateAvailableStock,
    prepareStockBalance,
    safeStockBalanceUpdate,
    safeStockBalanceCreate
};
