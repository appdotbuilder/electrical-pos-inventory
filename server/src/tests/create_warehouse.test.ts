
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { warehousesTable, usersTable } from '../db/schema';
import { type CreateWarehouseInput } from '../schema';
import { createWarehouse } from '../handlers/create_warehouse';
import { eq } from 'drizzle-orm';

// Test inputs
const testInput: CreateWarehouseInput = {
  name: 'Test Warehouse',
  type: 'PHYSICAL',
  address: '123 Main St',
  manager_id: null
};

const testInputWithManager: CreateWarehouseInput = {
  name: 'Managed Warehouse',
  type: 'ONLINE',
  address: '456 Oak Ave',
  manager_id: 1
};

describe('createWarehouse', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a warehouse without manager', async () => {
    const result = await createWarehouse(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Warehouse');
    expect(result.type).toEqual('PHYSICAL');
    expect(result.address).toEqual('123 Main St');
    expect(result.manager_id).toBeNull();
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save warehouse to database', async () => {
    const result = await createWarehouse(testInput);

    // Query using proper drizzle syntax
    const warehouses = await db.select()
      .from(warehousesTable)
      .where(eq(warehousesTable.id, result.id))
      .execute();

    expect(warehouses).toHaveLength(1);
    expect(warehouses[0].name).toEqual('Test Warehouse');
    expect(warehouses[0].type).toEqual('PHYSICAL');
    expect(warehouses[0].address).toEqual('123 Main St');
    expect(warehouses[0].is_active).toBe(true);
    expect(warehouses[0].created_at).toBeInstanceOf(Date);
  });

  it('should create warehouse with valid manager', async () => {
    // Create a manager user first
    await db.insert(usersTable).values({
      username: 'manager1',
      email: 'manager@test.com',
      password_hash: 'hashed_password',
      full_name: 'Test Manager',
      role: 'MANAGER',
      commission_rate: null
    }).execute();

    const result = await createWarehouse(testInputWithManager);

    expect(result.name).toEqual('Managed Warehouse');
    expect(result.type).toEqual('ONLINE');
    expect(result.manager_id).toEqual(1);
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
  });

  it('should allow SYSTEM_ADMIN as manager', async () => {
    // Create a system admin user
    await db.insert(usersTable).values({
      username: 'admin1',
      email: 'admin@test.com',
      password_hash: 'hashed_password',
      full_name: 'System Admin',
      role: 'SYSTEM_ADMIN',
      commission_rate: null
    }).execute();

    const input = { ...testInputWithManager, manager_id: 1 };
    const result = await createWarehouse(input);

    expect(result.manager_id).toEqual(1);
    expect(result.name).toEqual('Managed Warehouse');
  });

  it('should allow APP_ADMIN as manager', async () => {
    // Create an app admin user
    await db.insert(usersTable).values({
      username: 'appadmin1',
      email: 'appadmin@test.com',
      password_hash: 'hashed_password',
      full_name: 'App Admin',
      role: 'APP_ADMIN',
      commission_rate: null
    }).execute();

    const input = { ...testInputWithManager, manager_id: 1 };
    const result = await createWarehouse(input);

    expect(result.manager_id).toEqual(1);
    expect(result.name).toEqual('Managed Warehouse');
  });

  it('should throw error when manager does not exist', async () => {
    const input = { ...testInputWithManager, manager_id: 999 };

    await expect(createWarehouse(input)).rejects.toThrow(/manager not found/i);
  });

  it('should throw error when user does not have manager permissions', async () => {
    // Create a cashier user (not allowed as manager)
    await db.insert(usersTable).values({
      username: 'cashier1',
      email: 'cashier@test.com',
      password_hash: 'hashed_password',
      full_name: 'Test Cashier',
      role: 'CASHIER',
      commission_rate: null
    }).execute();

    const input = { ...testInputWithManager, manager_id: 1 };

    await expect(createWarehouse(input)).rejects.toThrow(/does not have manager permissions/i);
  });

  it('should throw error when warehouse user has invalid role', async () => {
    // Create a warehouse user (not allowed as manager)
    await db.insert(usersTable).values({
      username: 'warehouse1',
      email: 'warehouse@test.com',
      password_hash: 'hashed_password',
      full_name: 'Warehouse Worker',
      role: 'WAREHOUSE',
      commission_rate: null
    }).execute();

    const input = { ...testInputWithManager, manager_id: 1 };

    await expect(createWarehouse(input)).rejects.toThrow(/does not have manager permissions/i);
  });

  it('should handle null address correctly', async () => {
    const inputWithNullAddress = {
      ...testInput,
      address: null
    };

    const result = await createWarehouse(inputWithNullAddress);

    expect(result.address).toBeNull();
    expect(result.name).toEqual('Test Warehouse');
    expect(result.type).toEqual('PHYSICAL');
  });
});
