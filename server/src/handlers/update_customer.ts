import { db } from '../db';
import { customersTable } from '../db/schema';
import { type UpdateCustomerInput, type Customer } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCustomer = async (input: UpdateCustomerInput): Promise<Customer> => {
  try {
    // Build update data object, only including provided fields
    const updateData: Record<string, any> = {};

    if (input.name !== undefined) {
      updateData['name'] = input.name;
    }
    if (input.contact_person !== undefined) {
      updateData['contact_person'] = input.contact_person;
    }
    if (input.email !== undefined) {
      updateData['email'] = input.email;
    }
    if (input.phone !== undefined) {
      updateData['phone'] = input.phone;
    }
    if (input.address !== undefined) {
      updateData['address'] = input.address;
    }
    if (input.term_time !== undefined) {
      updateData['term_time'] = input.term_time;
    }
    if (input.receivable_limit !== undefined) {
      updateData['receivable_limit'] = input.receivable_limit ? input.receivable_limit.toString() : null;
    }
    if (input.special_discount !== undefined) {
      updateData['special_discount'] = input.special_discount ? input.special_discount.toString() : null;
    }
    if (input.is_active !== undefined) {
      updateData['is_active'] = input.is_active;
    }

    // Always update the updated_at timestamp
    updateData['updated_at'] = new Date();

    const result = await db.update(customersTable)
      .set(updateData)
      .where(eq(customersTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Customer with ID ${input.id} not found`);
    }

    const customer = result[0];

    // Convert numeric fields back to numbers before returning
    return {
      ...customer,
      receivable_limit: customer.receivable_limit ? parseFloat(customer.receivable_limit) : null,
      special_discount: customer.special_discount ? parseFloat(customer.special_discount) : null
    };
  } catch (error) {
    console.error('Customer update failed:', error);
    throw error;
  }
};