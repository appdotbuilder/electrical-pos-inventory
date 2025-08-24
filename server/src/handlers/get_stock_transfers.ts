
import { db } from '../db';
import { stockTransfersTable } from '../db/schema';
import { type StockTransfer } from '../schema';
import { eq, and, not } from 'drizzle-orm';
import { type SQL } from 'drizzle-orm';

export const getStockTransfers = async (status?: string, include_cancelled: boolean = false): Promise<StockTransfer[]> => {
  try {
    const conditions: SQL<unknown>[] = [];

    if (status) {
      conditions.push(eq(stockTransfersTable.status, status as any));
    }

    // Add condition to exclude CANCELLED transfers by default
    if (!include_cancelled) {
      conditions.push(not(eq(stockTransfersTable.status, 'CANCELLED')));
    }

    const results = conditions.length > 0
      ? await db.select()
          .from(stockTransfersTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .execute()
      : await db.select()
          .from(stockTransfersTable)
          .execute();
    
    // Return results directly - no numeric conversions needed for stock transfers
    return results;
  } catch (error) {
    console.error('Failed to get stock transfers:', error);
    throw error;
  }
};
