
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, warehousesTable, salesTable } from '../db/schema';
import { getSales } from '../handlers/get_sales';

describe('getSales', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no sales exist', async () => {
    const result = await getSales();
    expect(result).toEqual([]);
  });

  it('should return all sales when no filters applied', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        full_name: 'Test User',
        role: 'CASHIER'
      })
      .returning()
      .execute();

    // Create test warehouse
    const warehouse = await db.insert(warehousesTable)
      .values({
        name: 'Test Warehouse',
        type: 'PHYSICAL',
        address: '123 Test St'
      })
      .returning()
      .execute();

    // Create test sales
    const saleDate1 = new Date('2024-01-15');
    const saleDate2 = new Date('2024-01-20');

    await db.insert(salesTable)
      .values([
        {
          sale_number: 'SALE-001',
          warehouse_id: warehouse[0].id,
          cashier_id: user[0].id,
          customer_name: 'Customer 1',
          sale_type: 'RETAIL',
          status: 'COMPLETED',
          subtotal: '100.00',
          tax_amount: '10.00',
          discount_amount: '5.00',
          total_amount: '105.00',
          sale_date: saleDate1
        },
        {
          sale_number: 'SALE-002',
          warehouse_id: warehouse[0].id,
          sale_type: 'WHOLESALE',
          status: 'PENDING',
          subtotal: '200.00',
          tax_amount: '20.00',
          discount_amount: '0.00',
          total_amount: '220.00',
          sale_date: saleDate2
        }
      ])
      .execute();

    const result = await getSales();

    expect(result).toHaveLength(2);
    
    // Check that results are ordered by sale_date desc (most recent first)
    expect(result[0].sale_number).toBe('SALE-002');
    expect(result[1].sale_number).toBe('SALE-001');

    // Verify numeric conversions
    expect(typeof result[0].subtotal).toBe('number');
    expect(result[0].subtotal).toBe(200);
    expect(result[0].total_amount).toBe(220);
    expect(result[1].subtotal).toBe(100);
    expect(result[1].discount_amount).toBe(5);
  });

  it('should filter sales by warehouse_id', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        full_name: 'Test User',
        role: 'CASHIER'
      })
      .returning()
      .execute();

    // Create two warehouses
    const warehouses = await db.insert(warehousesTable)
      .values([
        {
          name: 'Warehouse A',
          type: 'PHYSICAL'
        },
        {
          name: 'Warehouse B',
          type: 'ONLINE'
        }
      ])
      .returning()
      .execute();

    const saleDate = new Date('2024-01-15');

    // Create sales for both warehouses
    await db.insert(salesTable)
      .values([
        {
          sale_number: 'SALE-A1',
          warehouse_id: warehouses[0].id,
          cashier_id: user[0].id,
          sale_type: 'RETAIL',
          status: 'COMPLETED',
          subtotal: '100.00',
          tax_amount: '10.00',
          discount_amount: '0.00',
          total_amount: '110.00',
          sale_date: saleDate
        },
        {
          sale_number: 'SALE-B1',
          warehouse_id: warehouses[1].id,
          sale_type: 'ONLINE',
          status: 'COMPLETED',
          subtotal: '200.00',
          tax_amount: '20.00',
          discount_amount: '10.00',
          total_amount: '210.00',
          sale_date: saleDate
        }
      ])
      .execute();

    const result = await getSales(warehouses[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].sale_number).toBe('SALE-A1');
    expect(result[0].warehouse_id).toBe(warehouses[0].id);
  });

  it('should filter sales by date range', async () => {
    // Create test user and warehouse
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        full_name: 'Test User',
        role: 'CASHIER'
      })
      .returning()
      .execute();

    const warehouse = await db.insert(warehousesTable)
      .values({
        name: 'Test Warehouse',
        type: 'PHYSICAL'
      })
      .returning()
      .execute();

    // Create sales with different dates
    const date1 = new Date('2024-01-10');
    const date2 = new Date('2024-01-15');
    const date3 = new Date('2024-01-20');

    await db.insert(salesTable)
      .values([
        {
          sale_number: 'SALE-001',
          warehouse_id: warehouse[0].id,
          cashier_id: user[0].id,
          sale_type: 'RETAIL',
          status: 'COMPLETED',
          subtotal: '100.00',
          tax_amount: '10.00',
          discount_amount: '0.00',
          total_amount: '110.00',
          sale_date: date1
        },
        {
          sale_number: 'SALE-002',
          warehouse_id: warehouse[0].id,
          sale_type: 'RETAIL',
          status: 'COMPLETED',
          subtotal: '150.00',
          tax_amount: '15.00',
          discount_amount: '0.00',
          total_amount: '165.00',
          sale_date: date2
        },
        {
          sale_number: 'SALE-003',
          warehouse_id: warehouse[0].id,
          sale_type: 'RETAIL',
          status: 'COMPLETED',
          subtotal: '200.00',
          tax_amount: '20.00',
          discount_amount: '0.00',
          total_amount: '220.00',
          sale_date: date3
        }
      ])
      .execute();

    // Test filtering by start date only
    const resultWithStartDate = await getSales(undefined, new Date('2024-01-15'));
    expect(resultWithStartDate).toHaveLength(2);
    expect(resultWithStartDate.map(s => s.sale_number).sort()).toEqual(['SALE-002', 'SALE-003']);

    // Test filtering by end date only
    const resultWithEndDate = await getSales(undefined, undefined, new Date('2024-01-15'));
    expect(resultWithEndDate).toHaveLength(2);
    expect(resultWithEndDate.map(s => s.sale_number).sort()).toEqual(['SALE-001', 'SALE-002']);

    // Test filtering by date range
    const resultWithDateRange = await getSales(
      undefined,
      new Date('2024-01-12'),
      new Date('2024-01-18')
    );
    expect(resultWithDateRange).toHaveLength(1);
    expect(resultWithDateRange[0].sale_number).toBe('SALE-002');
  });

  it('should combine warehouse and date filters', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        full_name: 'Test User',
        role: 'CASHIER'
      })
      .returning()
      .execute();

    // Create two warehouses
    const warehouses = await db.insert(warehousesTable)
      .values([
        {
          name: 'Warehouse A',
          type: 'PHYSICAL'
        },
        {
          name: 'Warehouse B',
          type: 'ONLINE'
        }
      ])
      .returning()
      .execute();

    const date1 = new Date('2024-01-10');
    const date2 = new Date('2024-01-20');

    // Create sales for different warehouses and dates
    await db.insert(salesTable)
      .values([
        {
          sale_number: 'SALE-A1',
          warehouse_id: warehouses[0].id,
          cashier_id: user[0].id,
          sale_type: 'RETAIL',
          status: 'COMPLETED',
          subtotal: '100.00',
          tax_amount: '10.00',
          discount_amount: '0.00',
          total_amount: '110.00',
          sale_date: date1
        },
        {
          sale_number: 'SALE-A2',
          warehouse_id: warehouses[0].id,
          sale_type: 'RETAIL',
          status: 'COMPLETED',
          subtotal: '150.00',
          tax_amount: '15.00',
          discount_amount: '0.00',
          total_amount: '165.00',
          sale_date: date2
        },
        {
          sale_number: 'SALE-B1',
          warehouse_id: warehouses[1].id,
          sale_type: 'ONLINE',
          status: 'COMPLETED',
          subtotal: '200.00',
          tax_amount: '20.00',
          discount_amount: '0.00',
          total_amount: '220.00',
          sale_date: date2
        }
      ])
      .execute();

    // Filter by warehouse A and start date
    const result = await getSales(warehouses[0].id, new Date('2024-01-15'));

    expect(result).toHaveLength(1);
    expect(result[0].sale_number).toBe('SALE-A2');
    expect(result[0].warehouse_id).toBe(warehouses[0].id);
    expect(result[0].sale_date).toEqual(date2);
  });

  it('should handle commission_amount correctly', async () => {
    // Create test user and warehouse
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        full_name: 'Test User',
        role: 'CASHIER',
        commission_rate: '5.00'
      })
      .returning()
      .execute();

    const warehouse = await db.insert(warehousesTable)
      .values({
        name: 'Test Warehouse',
        type: 'PHYSICAL'
      })
      .returning()
      .execute();

    // Create sales with and without commission
    await db.insert(salesTable)
      .values([
        {
          sale_number: 'SALE-001',
          warehouse_id: warehouse[0].id,
          cashier_id: user[0].id,
          sale_type: 'RETAIL',
          status: 'COMPLETED',
          subtotal: '100.00',
          tax_amount: '10.00',
          discount_amount: '0.00',
          total_amount: '110.00',
          commission_amount: '5.50',
          sale_date: new Date('2024-01-15')
        },
        {
          sale_number: 'SALE-002',
          warehouse_id: warehouse[0].id,
          sale_type: 'RETAIL',
          status: 'COMPLETED',
          subtotal: '200.00',
          tax_amount: '20.00',
          discount_amount: '0.00',
          total_amount: '220.00',
          commission_amount: null,
          sale_date: new Date('2024-01-16')
        }
      ])
      .execute();

    const result = await getSales();

    expect(result).toHaveLength(2);
    
    // Check commission_amount conversion
    const saleWithCommission = result.find(s => s.sale_number === 'SALE-001');
    const saleWithoutCommission = result.find(s => s.sale_number === 'SALE-002');

    expect(typeof saleWithCommission?.commission_amount).toBe('number');
    expect(saleWithCommission?.commission_amount).toBe(5.5);
    expect(saleWithoutCommission?.commission_amount).toBeNull();
  });
});
