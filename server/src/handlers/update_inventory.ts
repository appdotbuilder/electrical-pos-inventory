
import { db } from '../db';
import { inventoryTable } from '../db/schema';
import { type UpdateInventoryInput, type Inventory } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updateInventory = async (input: UpdateInventoryInput): Promise<Inventory> => {
  try {
    // Check if inventory record exists
    const existingInventory = await db.select()
      .from(inventoryTable)
      .where(
        and(
          eq(inventoryTable.product_id, input.product_id),
          eq(inventoryTable.warehouse_id, input.warehouse_id)
        )
      )
      .execute();

    if (existingInventory.length === 0) {
      // Create new inventory record if it doesn't exist
      const result = await db.insert(inventoryTable)
        .values({
          product_id: input.product_id,
          warehouse_id: input.warehouse_id,
          quantity: input.quantity.toString(), // Convert number to string for numeric column
          reserved_quantity: '0' // Default reserved quantity to 0
        })
        .returning()
        .execute();

      const inventory = result[0];
      return {
        ...inventory,
        quantity: parseFloat(inventory.quantity), // Convert string back to number
        reserved_quantity: parseFloat(inventory.reserved_quantity)
      };
    }

    // Get current reserved quantity
    const currentReservedQuantity = parseFloat(existingInventory[0].reserved_quantity);

    // Validate that new quantity is not less than reserved quantity
    if (input.quantity < currentReservedQuantity) {
      throw new Error(`Cannot set quantity (${input.quantity}) below reserved quantity (${currentReservedQuantity})`);
    }

    // Update existing inventory record
    const result = await db.update(inventoryTable)
      .set({
        quantity: input.quantity.toString(), // Convert number to string for numeric column
        last_updated: new Date()
      })
      .where(
        and(
          eq(inventoryTable.product_id, input.product_id),
          eq(inventoryTable.warehouse_id, input.warehouse_id)
        )
      )
      .returning()
      .execute();

    const inventory = result[0];
    return {
      ...inventory,
      quantity: parseFloat(inventory.quantity), // Convert string back to number
      reserved_quantity: parseFloat(inventory.reserved_quantity)
    };
  } catch (error) {
    console.error('Inventory update failed:', error);
    throw error;
  }
};
