import { db } from '../db';
import { productsTable } from '../db/schema';
import { type DeleteProductInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteProduct = async (input: DeleteProductInput): Promise<{ success: boolean }> => {
  try {
    // Delete the product record
    const result = await db.delete(productsTable)
      .where(eq(productsTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Product deletion failed:', error);
    throw error;
  }
};