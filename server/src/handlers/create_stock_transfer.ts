
import { db } from '../db';
import { stockTransfersTable, stockTransferItemsTable } from '../db/schema';
import { type CreateStockTransferInput, type StockTransfer } from '../schema';

export const createStockTransfer = async (input: CreateStockTransferInput, requestedBy: number): Promise<StockTransfer> => {
  try {
    // Generate unique transfer number
    const transferNumber = `TRANS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Insert stock transfer record
    const transferResult = await db.insert(stockTransfersTable)
      .values({
        transfer_number: transferNumber,
        from_warehouse_id: input.from_warehouse_id,
        to_warehouse_id: input.to_warehouse_id,
        requested_by: requestedBy,
        notes: input.notes
      })
      .returning()
      .execute();

    const transfer = transferResult[0];

    // Insert stock transfer items
    if (input.items && input.items.length > 0) {
      const itemValues = input.items.map(item => ({
        transfer_id: transfer.id,
        product_id: item.product_id,
        requested_quantity: item.requested_quantity.toString() // Convert number to string for numeric column
      }));

      await db.insert(stockTransferItemsTable)
        .values(itemValues)
        .execute();
    }

    // Return the stock transfer with proper type conversions
    return transfer;
  } catch (error) {
    console.error('Stock transfer creation failed:', error);
    throw error;
  }
};
