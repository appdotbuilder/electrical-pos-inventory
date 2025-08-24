import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput, type Customer } from '../schema';

export const createCustomer = async (input: CreateCustomerInput): Promise<Customer> => {
  try {
    // Convert numeric fields to strings for database insertion
    const customerData = {
      name: input.name,
      contact_person: input.contact_person || null,
      email: input.email || null,
      phone: input.phone || null,
      address: input.address || null,
      term_time: input.term_time || null,
      receivable_limit: input.receivable_limit ? input.receivable_limit.toString() : null,
      special_discount: input.special_discount ? input.special_discount.toString() : null,
      is_active: input.is_active ?? true
    };

    const result = await db.insert(customersTable)
      .values(customerData)
      .returning()
      .execute();

    const customer = result[0];

    // Convert numeric fields back to numbers before returning
    return {
      ...customer,
      receivable_limit: customer.receivable_limit ? parseFloat(customer.receivable_limit) : null,
      special_discount: customer.special_discount ? parseFloat(customer.special_discount) : null
    };
  } catch (error) {
    console.error('Customer creation failed:', error);
    throw error;
  }
};