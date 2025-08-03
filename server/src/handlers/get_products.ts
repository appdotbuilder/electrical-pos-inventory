
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';
import { eq } from 'drizzle-orm';

export const getProducts = async (): Promise<Product[]> => {
  try {
    // Query all active products
    const results = await db.select()
      .from(productsTable)
      .where(eq(productsTable.is_active, true))
      .execute();

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
