
import { db } from '../db';
import { warehousesTable } from '../db/schema';
import { type Warehouse } from '../schema';

export const getWarehouses = async (): Promise<Warehouse[]> => {
  try {
    const results = await db.select()
      .from(warehousesTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(warehouse => ({
      ...warehouse,
      // All fields are already correct types - no numeric conversions needed
      id: warehouse.id,
      name: warehouse.name,
      type: warehouse.type,
      address: warehouse.address,
      manager_id: warehouse.manager_id,
      is_active: warehouse.is_active,
      created_at: warehouse.created_at,
      updated_at: warehouse.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch warehouses:', error);
    throw error;
  }
};
