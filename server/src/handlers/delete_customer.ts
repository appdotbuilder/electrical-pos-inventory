import { db } from '../db';
import { customersTable } from '../db/schema';
import { type DeleteCustomerInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteCustomer = async (input: DeleteCustomerInput): Promise<void> => {
  try {
    await db.delete(customersTable)
      .where(eq(customersTable.id, input.id))
      .execute();
  } catch (error) {
    console.error('Customer deletion failed:', error);
    throw error;
  }
};