import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput, type Customer } from '../schema';

export const createCustomer = async (input: CreateCustomerInput): Promise<Customer> => {
  try {
    const result = await db.insert(customersTable)
      .values({
        name: input.name,
        contact_person: input.contact_person,
        email: input.email,
        phone: input.phone,
        address: input.address,
        term_time: input.term_time,
        receivable_limit: input.receivable_limit ? input.receivable_limit.toString() : null,
        special_discount: input.special_discount ? input.special_discount.toString() : null,
        is_active: input.is_active ?? true
      })
      .returning()
      .execute();

    const customer = result[0];
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