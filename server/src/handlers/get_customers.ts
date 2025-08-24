import { db } from '../db';
import { customersTable } from '../db/schema';
import { type GetCustomersInput, type Customer } from '../schema';
import { eq, ilike, and, SQL } from 'drizzle-orm';

export const getCustomers = async (input: GetCustomersInput): Promise<Customer[]> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    if (input.is_active !== undefined) {
      conditions.push(eq(customersTable.is_active, input.is_active));
    }

    if (input.search_query) {
      conditions.push(ilike(customersTable.name, `%${input.search_query}%`));
    }

    // Execute query with proper chaining
    const results = conditions.length > 0
      ? await db.select()
          .from(customersTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(customersTable.name)
          .execute()
      : await db.select()
          .from(customersTable)
          .orderBy(customersTable.name)
          .execute();

    return results.map(customer => ({
      ...customer,
      receivable_limit: customer.receivable_limit ? parseFloat(customer.receivable_limit) : null,
      special_discount: customer.special_discount ? parseFloat(customer.special_discount) : null
    }));
  } catch (error) {
    console.error('Get customers failed:', error);
    throw error;
  }
};