
import { db } from '../db';
import { inventoryTable, productsTable, warehousesTable } from '../db/schema';
import { type Inventory } from '../schema';
import { eq } from 'drizzle-orm';

export const getInventory = async (warehouseId?: number): Promise<Inventory[]> => {
  try {
    let results;

    if (warehouseId !== undefined) {
      // Query with warehouse filter
      results = await db.select({
        id: inventoryTable.id,
        product_id: inventoryTable.product_id,
        warehouse_id: inventoryTable.warehouse_id,
        quantity: inventoryTable.quantity,
        reserved_quantity: inventoryTable.reserved_quantity,
        last_updated: inventoryTable.last_updated
      })
      .from(inventoryTable)
      .where(eq(inventoryTable.warehouse_id, warehouseId))
      .innerJoin(productsTable, eq(inventoryTable.product_id, productsTable.id))
      .innerJoin(warehousesTable, eq(inventoryTable.warehouse_id, warehousesTable.id))
      .execute();
    } else {
      // Query without filter
      results = await db.select({
        id: inventoryTable.id,
        product_id: inventoryTable.product_id,
        warehouse_id: inventoryTable.warehouse_id,
        quantity: inventoryTable.quantity,
        reserved_quantity: inventoryTable.reserved_quantity,
        last_updated: inventoryTable.last_updated
      })
      .from(inventoryTable)
      .innerJoin(productsTable, eq(inventoryTable.product_id, productsTable.id))
      .innerJoin(warehousesTable, eq(inventoryTable.warehouse_id, warehousesTable.id))
      .execute();
    }

    // Convert numeric fields to numbers since they're stored as strings in PostgreSQL
    return results.map(result => ({
      id: result.id,
      product_id: result.product_id,
      warehouse_id: result.warehouse_id,
      quantity: parseFloat(result.quantity),
      reserved_quantity: parseFloat(result.reserved_quantity),
      last_updated: result.last_updated
    }));
  } catch (error) {
    console.error('Inventory fetch failed:', error);
    throw error;
  }
};
