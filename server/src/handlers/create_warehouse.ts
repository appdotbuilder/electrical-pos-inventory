
import { db } from '../db';
import { warehousesTable, usersTable } from '../db/schema';
import { type CreateWarehouseInput, type Warehouse } from '../schema';
import { eq } from 'drizzle-orm';

export const createWarehouse = async (input: CreateWarehouseInput): Promise<Warehouse> => {
  try {
    // Validate manager exists if manager_id is provided
    if (input.manager_id) {
      const manager = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, input.manager_id))
        .execute();

      if (manager.length === 0) {
        throw new Error('Manager not found');
      }

      // Check if manager has appropriate role (MANAGER or higher)
      const managerRole = manager[0].role;
      const validRoles = ['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER'];
      if (!validRoles.includes(managerRole)) {
        throw new Error('User does not have manager permissions');
      }
    }

    // Insert warehouse record
    const result = await db.insert(warehousesTable)
      .values({
        name: input.name,
        type: input.type,
        address: input.address,
        manager_id: input.manager_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Warehouse creation failed:', error);
    throw error;
  }
};
