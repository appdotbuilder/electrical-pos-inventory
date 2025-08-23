
import { db } from '../db';
import { productsTable, warehousesTable, inventoryTable } from '../db/schema';
import { type CreateProductInput, type Product } from '../schema';
import { eq } from 'drizzle-orm';

export const createProduct = async (input: CreateProductInput): Promise<Product> => {
  try {
    // Insert product record
    const productResult = await db.insert(productsTable)
      .values({
        sku: input.sku,
        name: input.name,
        description: input.description,
        category_id: input.category_id,
        base_unit: input.base_unit,
        cost_price: input.cost_price.toString(),
        retail_price: input.retail_price.toString(),
        wholesale_price: input.wholesale_price.toString(),
        minimum_stock_level: input.minimum_stock_level,
        is_active: input.is_active ?? true
      })
      .returning()
      .execute();

    const product = productResult[0];

    // Get all active warehouses
    const activeWarehouses = await db.select()
      .from(warehousesTable)
      .where(eq(warehousesTable.is_active, true))
      .execute();

    // Initialize inventory records for all active warehouses
    if (activeWarehouses.length > 0) {
      const inventoryRecords = activeWarehouses.map(warehouse => ({
        product_id: product.id,
        warehouse_id: warehouse.id,
        quantity: '0',
        reserved_quantity: '0'
      }));

      await db.insert(inventoryTable)
        .values(inventoryRecords)
        .execute();
    }

    // Convert numeric fields back to numbers before returning
    return {
      ...product,
      cost_price: parseFloat(product.cost_price),
      retail_price: parseFloat(product.retail_price),
      wholesale_price: parseFloat(product.wholesale_price)
    };
  } catch (error) {
    console.error('Product creation failed:', error);
    throw error;
  }
};
