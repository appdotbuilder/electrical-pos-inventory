
import { db } from '../db';
import { stockTransfersTable } from '../db/schema';
import { type StockTransfer } from '../schema';
import { eq } from 'drizzle-orm';

export const getStockTransfers = async (status?: string): Promise<StockTransfer[]> => {
  try {
    const results = status
      ? await db.select()
          .from(stockTransfersTable)
          .where(eq(stockTransfersTable.status, status as any))
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
