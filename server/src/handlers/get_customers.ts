import { db } from '../db';
import { customersTable } from '../db/schema';
import { type GetCustomersInput, type Customer } from '../schema';
import { eq, and, or, ilike, SQL } from 'drizzle-orm';

export const getCustomers = async (input: GetCustomersInput = {}): Promise<Customer[]> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    // Filter by active status if specified
    if (input.is_active !== undefined) {
      conditions.push(eq(customersTable.is_active, input.is_active));
    }

    // Add search functionality
    if (input.search_query) {
      const searchTerm = `%${input.search_query}%`;
      conditions.push(
        or(
          ilike(customersTable.name, searchTerm),
          ilike(customersTable.contact_person, searchTerm),
          ilike(customersTable.email, searchTerm),
          ilike(customersTable.phone, searchTerm)
        )!
      );
    }

    // Build the query step by step
    let query = db.select().from(customersTable);

    // Apply where clause if there are conditions
    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions)) as any;
    }

    // Order by name and execute
    const results = await query.orderBy(customersTable.name).execute();

    // Convert numeric fields back to numbers
    return results.map(customer => ({
      ...customer,
      receivable_limit: customer.receivable_limit ? parseFloat(customer.receivable_limit) : null,
      special_discount: customer.special_discount ? parseFloat(customer.special_discount) : null
    }));
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    throw error;
  }
};