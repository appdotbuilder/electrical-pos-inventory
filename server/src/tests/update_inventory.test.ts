
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { inventoryTable, productsTable, warehousesTable, productCategoriesTable } from '../db/schema';
import { type UpdateInventoryInput } from '../schema';
import { updateInventory } from '../handlers/update_inventory';
import { eq, and } from 'drizzle-orm';

describe('updateInventory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testProductId: number;
  let testWarehouseId: number;

  beforeEach(async () => {
    // Create test category
    const category = await db.insert(productCategoriesTable)
      .values({
        name: 'Test Category',
        description: 'Category for testing'
      })
      .returning()
      .execute();

    // Create test product
    const product = await db.insert(productsTable)
      .values({
        sku: 'TEST-001',
        name: 'Test Product',
        description: 'A product for testing',
        category_id: category[0].id,
        base_unit: 'pcs',
        cost_price: '10.00',
        retail_price: '15.00',
        wholesale_price: '12.00',
        minimum_stock_level: 5
      })
      .returning()
      .execute();

    testProductId = product[0].id;

    // Create test warehouse
    const warehouse = await db.insert(warehousesTable)
      .values({
        name: 'Test Warehouse',
        type: 'PHYSICAL',
        address: '123 Test St'
      })
      .returning()
      .execute();

    testWarehouseId = warehouse[0].id;
  });

  const testInput: UpdateInventoryInput = {
    product_id: 0, // Will be set in tests
    warehouse_id: 0, // Will be set in tests
    quantity: 100
  };

  it('should create new inventory record if none exists', async () => {
    const input = {
      ...testInput,
      product_id: testProductId,
      warehouse_id: testWarehouseId
    };

    const result = await updateInventory(input);

    // Verify return values
    expect(result.product_id).toEqual(testProductId);
    expect(result.warehouse_id).toEqual(testWarehouseId);
    expect(result.quantity).toEqual(100);
    expect(result.reserved_quantity).toEqual(0);
    expect(result.id).toBeDefined();
    expect(result.last_updated).toBeInstanceOf(Date);
    expect(typeof result.quantity).toBe('number');
    expect(typeof result.reserved_quantity).toBe('number');

    // Verify database record
    const inventory = await db.select()
      .from(inventoryTable)
      .where(
        and(
          eq(inventoryTable.product_id, testProductId),
          eq(inventoryTable.warehouse_id, testWarehouseId)
        )
      )
      .execute();

    expect(inventory).toHaveLength(1);
    expect(parseFloat(inventory[0].quantity)).toEqual(100);
    expect(parseFloat(inventory[0].reserved_quantity)).toEqual(0);
  });

  it('should update existing inventory record', async () => {
    // Create initial inventory record
    await db.insert(inventoryTable)
      .values({
        product_id: testProductId,
        warehouse_id: testWarehouseId,
        quantity: '50',
        reserved_quantity: '10'
      })
      .execute();

    const input = {
      ...testInput,
      product_id: testProductId,
      warehouse_id: testWarehouseId,
      quantity: 150
    };

    const result = await updateInventory(input);

    // Verify return values
    expect(result.product_id).toEqual(testProductId);
    expect(result.warehouse_id).toEqual(testWarehouseId);
    expect(result.quantity).toEqual(150);
    expect(result.reserved_quantity).toEqual(10); // Should preserve existing reserved quantity
    expect(typeof result.quantity).toBe('number');
    expect(typeof result.reserved_quantity).toBe('number');

    // Verify database record
    const inventory = await db.select()
      .from(inventoryTable)
      .where(
        and(
          eq(inventoryTable.product_id, testProductId),
          eq(inventoryTable.warehouse_id, testWarehouseId)
        )
      )
      .execute();

    expect(inventory).toHaveLength(1);
    expect(parseFloat(inventory[0].quantity)).toEqual(150);
    expect(parseFloat(inventory[0].reserved_quantity)).toEqual(10);
  });

  it('should reject quantity below reserved quantity', async () => {
    // Create inventory record with reserved quantity
    await db.insert(inventoryTable)
      .values({
        product_id: testProductId,
        warehouse_id: testWarehouseId,
        quantity: '100',
        reserved_quantity: '25'
      })
      .execute();

    const input = {
      ...testInput,
      product_id: testProductId,
      warehouse_id: testWarehouseId,
      quantity: 20 // Less than reserved quantity of 25
    };

    await expect(updateInventory(input)).rejects.toThrow(/cannot set quantity.*below reserved quantity/i);

    // Verify inventory wasn't changed
    const inventory = await db.select()
      .from(inventoryTable)
      .where(
        and(
          eq(inventoryTable.product_id, testProductId),
          eq(inventoryTable.warehouse_id, testWarehouseId)
        )
      )
      .execute();

    expect(parseFloat(inventory[0].quantity)).toEqual(100); // Should remain unchanged
  });

  it('should allow quantity equal to reserved quantity', async () => {
    // Create inventory record with reserved quantity
    await db.insert(inventoryTable)
      .values({
        product_id: testProductId,
        warehouse_id: testWarehouseId,
        quantity: '100',
        reserved_quantity: '30'
      })
      .execute();

    const input = {
      ...testInput,
      product_id: testProductId,
      warehouse_id: testWarehouseId,
      quantity: 30 // Equal to reserved quantity
    };

    const result = await updateInventory(input);

    expect(result.quantity).toEqual(30);
    expect(result.reserved_quantity).toEqual(30);
  });

  it('should update last_updated timestamp', async () => {
    // Create initial inventory record
    const initialInventory = await db.insert(inventoryTable)
      .values({
        product_id: testProductId,
        warehouse_id: testWarehouseId,
        quantity: '50',
        reserved_quantity: '0'
      })
      .returning()
      .execute();

    const originalTimestamp = initialInventory[0].last_updated;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input = {
      ...testInput,
      product_id: testProductId,
      warehouse_id: testWarehouseId,
      quantity: 75
    };

    const result = await updateInventory(input);

    expect(result.last_updated).toBeInstanceOf(Date);
    expect(result.last_updated.getTime()).toBeGreaterThan(originalTimestamp.getTime());
  });
});
