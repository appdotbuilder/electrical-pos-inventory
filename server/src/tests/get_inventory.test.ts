
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { inventoryTable, productsTable, warehousesTable, usersTable, productCategoriesTable } from '../db/schema';
import { getInventory } from '../handlers/get_inventory';

describe('getInventory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no inventory exists', async () => {
    const result = await getInventory();
    expect(result).toEqual([]);
  });

  it('should fetch all inventory records when no warehouse filter is provided', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash123',
        full_name: 'Test User',
        role: 'MANAGER'
      })
      .returning()
      .execute();

    const warehouse1 = await db.insert(warehousesTable)
      .values({
        name: 'Warehouse 1',
        type: 'PHYSICAL',
        manager_id: user[0].id
      })
      .returning()
      .execute();

    const warehouse2 = await db.insert(warehousesTable)
      .values({
        name: 'Warehouse 2',
        type: 'ONLINE',
        manager_id: user[0].id
      })
      .returning()
      .execute();

    const category = await db.insert(productCategoriesTable)
      .values({
        name: 'Test Category',
        description: 'A test category'
      })
      .returning()
      .execute();

    const product1 = await db.insert(productsTable)
      .values({
        sku: 'TEST001',
        name: 'Test Product 1',
        category_id: category[0].id,
        base_unit: 'piece',
        cost_price: '10.00',
        retail_price: '15.00',
        wholesale_price: '12.00',
        minimum_stock_level: 5
      })
      .returning()
      .execute();

    const product2 = await db.insert(productsTable)
      .values({
        sku: 'TEST002',
        name: 'Test Product 2',
        category_id: category[0].id,
        base_unit: 'kg',
        cost_price: '8.50',
        retail_price: '12.99',
        wholesale_price: '10.00',
        minimum_stock_level: 10
      })
      .returning()
      .execute();

    // Create inventory records
    await db.insert(inventoryTable)
      .values([
        {
          product_id: product1[0].id,
          warehouse_id: warehouse1[0].id,
          quantity: '100.50',
          reserved_quantity: '10.25'
        },
        {
          product_id: product2[0].id,
          warehouse_id: warehouse2[0].id,
          quantity: '75.00',
          reserved_quantity: '5.00'
        }
      ])
      .execute();

    const result = await getInventory();

    expect(result).toHaveLength(2);
    
    // Verify first inventory record
    const inventory1 = result.find(inv => inv.product_id === product1[0].id);
    expect(inventory1).toBeDefined();
    expect(inventory1!.warehouse_id).toEqual(warehouse1[0].id);
    expect(inventory1!.quantity).toEqual(100.50); // Numeric conversion
    expect(inventory1!.reserved_quantity).toEqual(10.25); // Numeric conversion
    expect(typeof inventory1!.quantity).toBe('number');
    expect(typeof inventory1!.reserved_quantity).toBe('number');
    expect(inventory1!.last_updated).toBeInstanceOf(Date);

    // Verify second inventory record
    const inventory2 = result.find(inv => inv.product_id === product2[0].id);
    expect(inventory2).toBeDefined();
    expect(inventory2!.warehouse_id).toEqual(warehouse2[0].id);
    expect(inventory2!.quantity).toEqual(75.00);
    expect(inventory2!.reserved_quantity).toEqual(5.00);
  });

  it('should filter inventory by warehouse when warehouse_id is provided', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash123',
        full_name: 'Test User',
        role: 'MANAGER'
      })
      .returning()
      .execute();

    const warehouse1 = await db.insert(warehousesTable)
      .values({
        name: 'Warehouse 1',
        type: 'PHYSICAL',
        manager_id: user[0].id
      })
      .returning()
      .execute();

    const warehouse2 = await db.insert(warehousesTable)
      .values({
        name: 'Warehouse 2',
        type: 'ONLINE',
        manager_id: user[0].id
      })
      .returning()
      .execute();

    const category = await db.insert(productCategoriesTable)
      .values({
        name: 'Test Category',
        description: 'A test category'
      })
      .returning()
      .execute();

    const product = await db.insert(productsTable)
      .values({
        sku: 'TEST001',
        name: 'Test Product',
        category_id: category[0].id,
        base_unit: 'piece',
        cost_price: '10.00',
        retail_price: '15.00',
        wholesale_price: '12.00',
        minimum_stock_level: 5
      })
      .returning()
      .execute();

    // Create inventory in both warehouses
    await db.insert(inventoryTable)
      .values([
        {
          product_id: product[0].id,
          warehouse_id: warehouse1[0].id,
          quantity: '50.00',
          reserved_quantity: '5.00'
        },
        {
          product_id: product[0].id,
          warehouse_id: warehouse2[0].id,
          quantity: '30.00',
          reserved_quantity: '3.00'
        }
      ])
      .execute();

    // Filter by warehouse1
    const result = await getInventory(warehouse1[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].warehouse_id).toEqual(warehouse1[0].id);
    expect(result[0].product_id).toEqual(product[0].id);
    expect(result[0].quantity).toEqual(50.00);
    expect(result[0].reserved_quantity).toEqual(5.00);
  });

  it('should return empty array for non-existent warehouse', async () => {
    const result = await getInventory(999);
    expect(result).toEqual([]);
  });

  it('should handle inventory with zero quantities correctly', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash123',
        full_name: 'Test User',
        role: 'MANAGER'
      })
      .returning()
      .execute();

    const warehouse = await db.insert(warehousesTable)
      .values({
        name: 'Test Warehouse',
        type: 'PHYSICAL',
        manager_id: user[0].id
      })
      .returning()
      .execute();

    const category = await db.insert(productCategoriesTable)
      .values({
        name: 'Test Category',
        description: 'A test category'
      })
      .returning()
      .execute();

    const product = await db.insert(productsTable)
      .values({
        sku: 'TEST001',
        name: 'Test Product',
        category_id: category[0].id,
        base_unit: 'piece',
        cost_price: '10.00',
        retail_price: '15.00',
        wholesale_price: '12.00',
        minimum_stock_level: 5
      })
      .returning()
      .execute();

    // Create inventory with zero quantities
    await db.insert(inventoryTable)
      .values({
        product_id: product[0].id,
        warehouse_id: warehouse[0].id,
        quantity: '0.00',
        reserved_quantity: '0.00'
      })
      .execute();

    const result = await getInventory();

    expect(result).toHaveLength(1);
    expect(result[0].quantity).toEqual(0);
    expect(result[0].reserved_quantity).toEqual(0);
    expect(typeof result[0].quantity).toBe('number');
    expect(typeof result[0].reserved_quantity).toBe('number');
  });
});
