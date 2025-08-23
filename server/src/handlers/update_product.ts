import { db } from '../db';
import { productsTable } from '../db/schema';
import { type UpdateProductInput, type Product } from '../schema';
import { eq } from 'drizzle-orm';

export const updateProduct = async (input: UpdateProductInput): Promise<Product> => {
  try {
    // Update product record
    const productResult = await db.update(productsTable)
      .set({
        sku: input.sku,
        name: input.name,
        description: input.description,
        category_id: input.category_id,
        base_unit: input.base_unit,
        cost_price: input.cost_price.toString(),
        retail_price: input.retail_price.toString(),
        wholesale_price: input.wholesale_price.toString(),
        minimum_stock_level: input.minimum_stock_level,
        is_active: input.is_active,
        updated_at: new Date()
      })
      .where(eq(productsTable.id, input.id))
      .returning()
      .execute();

    const product = productResult[0];
    if (!product) {
      throw new Error('Product not found');
    }

    // Convert numeric fields back to numbers before returning
    return {
      ...product,
      cost_price: parseFloat(product.cost_price),
      retail_price: parseFloat(product.retail_price),
      wholesale_price: parseFloat(product.wholesale_price)
    };
  } catch (error) {
    console.error('Product update failed:', error);
    throw error;
  }
};