import { db } from '../db';
import { customersTable } from '../db/schema';
import { type DeleteCustomerInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteCustomer = async (input: DeleteCustomerInput): Promise<{ success: boolean }> => {
  try {
    const result = await db.delete(customersTable)
      .where(eq(customersTable.id, input.id))
      .returning({ id: customersTable.id })
      .execute();

    if (result.length === 0) {
      throw new Error(`Customer with ID ${input.id} not found`);
    }

    return { success: true };
  } catch (error) {
    console.error('Customer deletion failed:', error);
    throw error;
  }
};