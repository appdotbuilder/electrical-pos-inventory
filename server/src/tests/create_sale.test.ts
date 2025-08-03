
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, warehousesTable, productsTable, inventoryTable, salesTable, saleItemsTable } from '../db/schema';
import { type CreateSaleInput } from '../schema';
import { createSale } from '../handlers/create_sale';
import { eq, and } from 'drizzle-orm';

describe('createSale', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testWarehouseId: number;
  let testProductId: number;

  beforeEach(async () => {
    // Create test user (cashier)
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testcashier',
        email: 'cashier@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Test Cashier',
        role: 'CASHIER',
        commission_rate: '5.00'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test warehouse
    const warehouseResult = await db.insert(warehousesTable)
      .values({
        name: 'Test Warehouse',
        type: 'PHYSICAL',
        address: '123 Test St'
      })
      .returning()
      .execute();
    testWarehouseId = warehouseResult[0].id;

    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        sku: 'TEST-001',
        name: 'Test Product',
        description: 'A test product',
        base_unit: 'piece',
        cost_price: '10.00',
        retail_price: '20.00',
        wholesale_price: '15.00',
        minimum_stock_level: 5
      })
      .returning()
      .execute();
    testProductId = productResult[0].id;

    // Create inventory
    await db.insert(inventoryTable)
      .values({
        product_id: testProductId,
        warehouse_id: testWarehouseId,
        quantity: '100.00',
        reserved_quantity: '0.00'
      })
      .execute();
  });

  const testInput: CreateSaleInput = {
    warehouse_id: 0, // Will be set in test
    customer_name: 'John Doe',
    customer_contact: 'john@example.com',
    sale_type: 'RETAIL',
    tracking_number: 'TRK123',
    notes: 'Test sale',
    items: [{
      product_id: 0, // Will be set in test
      quantity: 2,
      unit_price: 20.00,
      discount_amount: 5.00
    }]
  };

  it('should create a sale with items', async () => {
    const input = {
      ...testInput,
      warehouse_id: testWarehouseId,
      items: [{
        ...testInput.items[0],
        product_id: testProductId
      }]
    };

    const result = await createSale(input, testUserId);

    // Verify sale properties
    expect(result.id).toBeDefined();
    expect(result.sale_number).toMatch(/^SALE-\d+$/);
    expect(result.warehouse_id).toEqual(testWarehouseId);
    expect(result.cashier_id).toEqual(testUserId);
    expect(result.customer_name).toEqual('John Doe');
    expect(result.customer_contact).toEqual('john@example.com');
    expect(result.sale_type).toEqual('RETAIL');
    expect(result.status).toEqual('PENDING');
    expect(result.tracking_number).toEqual('TRK123');
    expect(result.notes).toEqual('Test sale');

    // Verify calculated amounts
    expect(result.subtotal).toEqual(35.00); // (2 * 20.00) - 5.00
    expect(result.tax_amount).toEqual(0);
    expect(result.discount_amount).toEqual(5.00);
    expect(result.total_amount).toEqual(35.00);
    expect(result.commission_amount).toEqual(1.75); // 35.00 * 5%

    expect(result.sale_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save sale to database', async () => {
    const input = {
      ...testInput,
      warehouse_id: testWarehouseId,
      items: [{
        ...testInput.items[0],
        product_id: testProductId
      }]
    };

    const result = await createSale(input, testUserId);

    // Verify sale in database
    const sales = await db.select()
      .from(salesTable)
      .where(eq(salesTable.id, result.id))
      .execute();

    expect(sales).toHaveLength(1);
    expect(sales[0].sale_number).toEqual(result.sale_number);
    expect(sales[0].warehouse_id).toEqual(testWarehouseId);
    expect(parseFloat(sales[0].subtotal)).toEqual(35.00);
  });

  it('should create sale items in database', async () => {
    const input = {
      ...testInput,
      warehouse_id: testWarehouseId,
      items: [{
        ...testInput.items[0],
        product_id: testProductId
      }]
    };

    const result = await createSale(input, testUserId);

    // Verify sale items in database
    const saleItems = await db.select()
      .from(saleItemsTable)
      .where(eq(saleItemsTable.sale_id, result.id))
      .execute();

    expect(saleItems).toHaveLength(1);
    expect(saleItems[0].product_id).toEqual(testProductId);
    expect(parseFloat(saleItems[0].quantity)).toEqual(2);
    expect(parseFloat(saleItems[0].unit_price)).toEqual(20.00);
    expect(parseFloat(saleItems[0].discount_amount)).toEqual(5.00);
    expect(parseFloat(saleItems[0].total_amount)).toEqual(35.00);
  });

  it('should reserve inventory', async () => {
    const input = {
      ...testInput,
      warehouse_id: testWarehouseId,
      items: [{
        ...testInput.items[0],
        product_id: testProductId
      }]
    };

    await createSale(input, testUserId);

    // Verify inventory was reserved
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
    expect(parseFloat(inventory[0].reserved_quantity)).toEqual(2);
  });

  it('should work without cashier', async () => {
    const input = {
      ...testInput,
      warehouse_id: testWarehouseId,
      items: [{
        ...testInput.items[0],
        product_id: testProductId
      }]
    };

    const result = await createSale(input); // No cashier ID

    expect(result.cashier_id).toBeNull();
    expect(result.commission_amount).toBeNull();
  });

  it('should throw error for insufficient inventory', async () => {
    const input = {
      ...testInput,
      warehouse_id: testWarehouseId,
      items: [{
        ...testInput.items[0],
        product_id: testProductId,
        quantity: 150 // More than available (100)
      }]
    };

    expect(createSale(input, testUserId)).rejects.toThrow(/insufficient inventory/i);
  });

  it('should throw error for non-existent product', async () => {
    const input = {
      ...testInput,
      warehouse_id: testWarehouseId,
      items: [{
        ...testInput.items[0],
        product_id: 99999 // Non-existent product
      }]
    };

    expect(createSale(input, testUserId)).rejects.toThrow(/product.*not found/i);
  });

  it('should throw error for non-existent cashier', async () => {
    const input = {
      ...testInput,
      warehouse_id: testWarehouseId,
      items: [{
        ...testInput.items[0],
        product_id: testProductId
      }]
    };

    expect(createSale(input, 99999)).rejects.toThrow(/cashier.*not found/i);
  });
});
