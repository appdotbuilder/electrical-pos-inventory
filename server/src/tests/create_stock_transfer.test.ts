
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, warehousesTable, productsTable, stockTransfersTable, stockTransferItemsTable } from '../db/schema';
import { type CreateStockTransferInput } from '../schema';
import { createStockTransfer } from '../handlers/create_stock_transfer';
import { eq } from 'drizzle-orm';

describe('createStockTransfer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let fromWarehouseId: number;
  let toWarehouseId: number;
  let productId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        full_name: 'Test User',
        role: 'WAREHOUSE'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test warehouses
    const fromWarehouseResult = await db.insert(warehousesTable)
      .values({
        name: 'Source Warehouse',
        type: 'PHYSICAL',
        address: '123 Source St'
      })
      .returning()
      .execute();
    fromWarehouseId = fromWarehouseResult[0].id;

    const toWarehouseResult = await db.insert(warehousesTable)
      .values({
        name: 'Destination Warehouse',
        type: 'PHYSICAL',
        address: '456 Dest Ave'
      })
      .returning()
      .execute();
    toWarehouseId = toWarehouseResult[0].id;

    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        sku: 'TEST-001',
        name: 'Test Product',
        base_unit: 'piece',
        cost_price: '10.00',
        retail_price: '20.00',
        wholesale_price: '15.00',
        minimum_stock_level: 10
      })
      .returning()
      .execute();
    productId = productResult[0].id;
  });

  const testInput: CreateStockTransferInput = {
    from_warehouse_id: 0, // Will be set in beforeEach
    to_warehouse_id: 0, // Will be set in beforeEach
    notes: 'Test transfer notes',
    items: [
      {
        product_id: 0, // Will be set in beforeEach
        requested_quantity: 50
      }
    ]
  };

  it('should create a stock transfer', async () => {
    const input = {
      ...testInput,
      from_warehouse_id: fromWarehouseId,
      to_warehouse_id: toWarehouseId,
      items: [
        {
          product_id: productId,
          requested_quantity: 50
        }
      ]
    };

    const result = await createStockTransfer(input, testUserId);

    // Basic field validation
    expect(result.transfer_number).toBeDefined();
    expect(result.transfer_number).toMatch(/^TRANS-\d+-\d+$/);
    expect(result.from_warehouse_id).toEqual(fromWarehouseId);
    expect(result.to_warehouse_id).toEqual(toWarehouseId);
    expect(result.requested_by).toEqual(testUserId);
    expect(result.approved_by).toBeNull();
    expect(result.status).toEqual('PENDING');
    expect(result.transfer_date).toBeNull();
    expect(result.notes).toEqual('Test transfer notes');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save stock transfer to database', async () => {
    const input = {
      ...testInput,
      from_warehouse_id: fromWarehouseId,
      to_warehouse_id: toWarehouseId,
      items: [
        {
          product_id: productId,
          requested_quantity: 50
        }
      ]
    };

    const result = await createStockTransfer(input, testUserId);

    // Query stock transfer
    const transfers = await db.select()
      .from(stockTransfersTable)
      .where(eq(stockTransfersTable.id, result.id))
      .execute();

    expect(transfers).toHaveLength(1);
    expect(transfers[0].transfer_number).toEqual(result.transfer_number);
    expect(transfers[0].from_warehouse_id).toEqual(fromWarehouseId);
    expect(transfers[0].to_warehouse_id).toEqual(toWarehouseId);
    expect(transfers[0].requested_by).toEqual(testUserId);
    expect(transfers[0].status).toEqual('PENDING');
    expect(transfers[0].notes).toEqual('Test transfer notes');
  });

  it('should create stock transfer items', async () => {
    const input = {
      ...testInput,
      from_warehouse_id: fromWarehouseId,
      to_warehouse_id: toWarehouseId,
      items: [
        {
          product_id: productId,
          requested_quantity: 50
        }
      ]
    };

    const result = await createStockTransfer(input, testUserId);

    // Query stock transfer items
    const items = await db.select()
      .from(stockTransferItemsTable)
      .where(eq(stockTransferItemsTable.transfer_id, result.id))
      .execute();

    expect(items).toHaveLength(1);
    expect(items[0].product_id).toEqual(productId);
    expect(parseFloat(items[0].requested_quantity)).toEqual(50);
    expect(items[0].transferred_quantity).toBeNull();
    expect(items[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle multiple transfer items', async () => {
    // Create second product
    const product2Result = await db.insert(productsTable)
      .values({
        sku: 'TEST-002',
        name: 'Test Product 2',
        base_unit: 'piece',
        cost_price: '5.00',
        retail_price: '10.00',
        wholesale_price: '7.50',
        minimum_stock_level: 5
      })
      .returning()
      .execute();
    const product2Id = product2Result[0].id;

    const input = {
      ...testInput,
      from_warehouse_id: fromWarehouseId,
      to_warehouse_id: toWarehouseId,
      items: [
        {
          product_id: productId,
          requested_quantity: 30
        },
        {
          product_id: product2Id,
          requested_quantity: 20
        }
      ]
    };

    const result = await createStockTransfer(input, testUserId);

    // Query stock transfer items
    const items = await db.select()
      .from(stockTransferItemsTable)
      .where(eq(stockTransferItemsTable.transfer_id, result.id))
      .execute();

    expect(items).toHaveLength(2);
    
    const item1 = items.find(item => item.product_id === productId);
    const item2 = items.find(item => item.product_id === product2Id);
    
    expect(item1).toBeDefined();
    expect(parseFloat(item1!.requested_quantity)).toEqual(30);
    
    expect(item2).toBeDefined();
    expect(parseFloat(item2!.requested_quantity)).toEqual(20);
  });

  it('should handle transfer without notes', async () => {
    const input = {
      from_warehouse_id: fromWarehouseId,
      to_warehouse_id: toWarehouseId,
      notes: null,
      items: [
        {
          product_id: productId,
          requested_quantity: 25
        }
      ]
    };

    const result = await createStockTransfer(input, testUserId);

    expect(result.notes).toBeNull();
    
    // Verify in database
    const transfers = await db.select()
      .from(stockTransfersTable)
      .where(eq(stockTransfersTable.id, result.id))
      .execute();

    expect(transfers[0].notes).toBeNull();
  });
});
