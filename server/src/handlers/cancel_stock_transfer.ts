import { db } from '../db';
import { stockTransfersTable } from '../db/schema';
import { type StockTransfer } from '../schema';
import { eq } from 'drizzle-orm';
import { type CancelStockTransferInput } from '../schema';

export const cancelStockTransfer = async (input: CancelStockTransferInput): Promise<StockTransfer> => {
  try {
    const result = await db.update(stockTransfersTable)
      .set({
        status: 'CANCELLED',
        updated_at: new Date()
      })
      .where(eq(stockTransfersTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Stock transfer not found');
    }

    return result[0];
  } catch (error) {
    console.error('Failed to cancel stock transfer:', error);
    throw error;
  }
};