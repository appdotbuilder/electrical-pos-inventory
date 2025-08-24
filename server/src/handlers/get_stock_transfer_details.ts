import { db } from '../db';
import { stockTransfersTable, stockTransferItemsTable, productsTable, warehousesTable } from '../db/schema';
import { type StockTransfer, type StockTransferItem, type Product, type Warehouse } from '../schema';
import { eq } from 'drizzle-orm';
import { type GetStockTransferDetailsInput } from '../schema';

export interface StockTransferDetail extends StockTransfer {
  fromWarehouse?: Warehouse;
  toWarehouse?: Warehouse;
  items: Array<StockTransferItem & { product?: Product }>;
}

export const getStockTransferDetails = async (input: GetStockTransferDetailsInput): Promise<StockTransferDetail | null> => {
  try {
    const result = await db.query.stockTransfersTable.findFirst({
      where: eq(stockTransfersTable.id, input.id),
      with: {
        fromWarehouse: true,
        toWarehouse: true,
        items: {
          with: {
            product: true,
          },
        },
      },
    });

    if (!result) {
      return null;
    }

    // Map numeric fields from string to number in nested objects
    const itemsWithNumeric = result.items.map(item => ({
      ...item,
      requested_quantity: parseFloat(item.requested_quantity),
      transferred_quantity: item.transferred_quantity ? parseFloat(item.transferred_quantity) : null,
      product: item.product ? {
        ...item.product,
        cost_price: parseFloat(item.product.cost_price),
        retail_price: parseFloat(item.product.retail_price),
        wholesale_price: parseFloat(item.product.wholesale_price),
      } : undefined,
    }));

    return {
      ...result,
      items: itemsWithNumeric,
    };
  } catch (error) {
    console.error('Failed to get stock transfer details:', error);
    throw error;
  }
};