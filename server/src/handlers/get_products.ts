import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product, type GetProductsInput } from '../schema';
import { eq } from 'drizzle-orm';

export const getProducts = async (input: GetProductsInput = {}): Promise<Product[]> => {
  try {
    let results;
    
    if (input.include_all === true) {
      // Get all products (active and inactive) for management purposes
      results = await db.select()
        .from(productsTable)
        .execute();
    } else if (input.is_active === true) {
      // Explicitly requesting active products
      results = await db.select()
        .from(productsTable)
        .where(eq(productsTable.is_active, true))
        .execute();
    } else if (input.is_active === false) {
      // Explicitly requesting inactive products
      results = await db.select()
        .from(productsTable)
        .where(eq(productsTable.is_active, false))
        .execute();
    } else {
      // Default behavior - return active products only (backward compatibility)
      results = await db.select()
        .from(productsTable)
        .where(eq(productsTable.is_active, true))
        .execute();
    }

    // Convert numeric fields from strings to numbers
    return results.map(product => ({
      ...product,
      cost_price: parseFloat(product.cost_price),
      retail_price: parseFloat(product.retail_price),
      wholesale_price: parseFloat(product.wholesale_price)
    }));
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw error;
  }
};