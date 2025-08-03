
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { warehousesTable, usersTable } from '../db/schema';
import { getWarehouses } from '../handlers/get_warehouses';

describe('getWarehouses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no warehouses exist', async () => {
    const result = await getWarehouses();
    expect(result).toEqual([]);
  });

  it('should return all warehouses', async () => {
    // Create test manager user first
    const [manager] = await db.insert(usersTable)
      .values({
        username: 'manager1',
        email: 'manager1@test.com',
        password_hash: 'hash123',
        full_name: 'Test Manager',
        role: 'MANAGER'
      })
      .returning()
      .execute();

    // Create test warehouses
    await db.insert(warehousesTable)
      .values([
        {
          name: 'Main Warehouse',
          type: 'PHYSICAL',
          address: '123 Main St',
          manager_id: manager.id,
          is_active: true
        },
        {
          name: 'Online Store',
          type: 'ONLINE',
          address: null,
          manager_id: null,
          is_active: true
        },
        {
          name: 'Inactive Warehouse',
          type: 'PHYSICAL',
          address: '456 Old St',
          manager_id: manager.id,
          is_active: false
        }
      ])
      .execute();

    const result = await getWarehouses();

    expect(result).toHaveLength(3);
    
    // Verify first warehouse
    const mainWarehouse = result.find(w => w.name === 'Main Warehouse');
    expect(mainWarehouse).toBeDefined();
    expect(mainWarehouse!.type).toEqual('PHYSICAL');
    expect(mainWarehouse!.address).toEqual('123 Main St');
    expect(mainWarehouse!.manager_id).toEqual(manager.id);
    expect(mainWarehouse!.is_active).toBe(true);
    expect(mainWarehouse!.id).toBeDefined();
    expect(mainWarehouse!.created_at).toBeInstanceOf(Date);
    expect(mainWarehouse!.updated_at).toBeInstanceOf(Date);

    // Verify online store
    const onlineStore = result.find(w => w.name === 'Online Store');
    expect(onlineStore).toBeDefined();
    expect(onlineStore!.type).toEqual('ONLINE');
    expect(onlineStore!.address).toBeNull();
    expect(onlineStore!.manager_id).toBeNull();
    expect(onlineStore!.is_active).toBe(true);

    // Verify inactive warehouse is also returned
    const inactiveWarehouse = result.find(w => w.name === 'Inactive Warehouse');
    expect(inactiveWarehouse).toBeDefined();
    expect(inactiveWarehouse!.is_active).toBe(false);
  });

  it('should return warehouses with correct field types', async () => {
    // Create a warehouse
    await db.insert(warehousesTable)
      .values({
        name: 'Test Warehouse',
        type: 'PHYSICAL',
        address: 'Test Address',
        manager_id: null,
        is_active: true
      })
      .execute();

    const result = await getWarehouses();

    expect(result).toHaveLength(1);
    const warehouse = result[0];

    // Verify all field types
    expect(typeof warehouse.id).toBe('number');
    expect(typeof warehouse.name).toBe('string');
    expect(typeof warehouse.type).toBe('string');
    expect(typeof warehouse.address).toBe('string');
    expect(warehouse.manager_id).toBeNull();
    expect(typeof warehouse.is_active).toBe('boolean');
    expect(warehouse.created_at).toBeInstanceOf(Date);
    expect(warehouse.updated_at).toBeInstanceOf(Date);
  });

  it('should save warehouses to database correctly', async () => {
    // Create warehouse through handler indirectly by inserting directly
    await db.insert(warehousesTable)
      .values({
        name: 'Direct Insert Warehouse',
        type: 'ONLINE',
        address: null,
        manager_id: null,
        is_active: true
      })
      .execute();

    // Verify it was saved and can be retrieved
    const result = await getWarehouses();
    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Direct Insert Warehouse');
    expect(result[0].type).toEqual('ONLINE');

    // Also verify by direct database query
    const directQuery = await db.select()
      .from(warehousesTable)
      .execute();
    
    expect(directQuery).toHaveLength(1);
    expect(directQuery[0].name).toEqual('Direct Insert Warehouse');
  });
});
