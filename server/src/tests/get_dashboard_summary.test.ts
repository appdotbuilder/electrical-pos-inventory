
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  usersTable, 
  warehousesTable, 
  productsTable, 
  inventoryTable,
  salesTable,
  saleItemsTable,
  stockTransfersTable,
  packingTable,
  accountTransactionsTable
} from '../db/schema';
import { getDashboardSummary } from '../handlers/get_dashboard_summary';

describe('getDashboardSummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty dashboard summary when no data exists', async () => {
    const result = await getDashboardSummary();

    expect(result.total_products).toEqual(0);
    expect(result.total_warehouses).toEqual(0);
    expect(result.low_stock_alerts).toEqual(0);
    expect(result.pending_transfers).toEqual(0);
    expect(result.pending_packing).toEqual(0);
    expect(result.today_sales_count).toEqual(0);
    expect(result.today_sales_revenue).toEqual(0);
    expect(result.overdue_receivables).toEqual(0);
    expect(result.overdue_payables).toEqual(0);
    expect(result.recent_sales).toEqual([]);
    expect(result.top_selling_products).toEqual([]);
  });

  it('should count active products and warehouses correctly', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash123',
        full_name: 'Test User',
        role: 'MANAGER'
      })
      .returning()
      .execute();

    // Create warehouses
    await db.insert(warehousesTable)
      .values([
        { name: 'Warehouse 1', type: 'PHYSICAL', manager_id: userResult[0].id },
        { name: 'Warehouse 2', type: 'ONLINE', manager_id: userResult[0].id },
        { name: 'Inactive Warehouse', type: 'PHYSICAL', is_active: false, manager_id: userResult[0].id }
      ])
      .execute();

    // Create products
    await db.insert(productsTable)
      .values([
        {
          sku: 'PROD001',
          name: 'Product 1',
          base_unit: 'pcs',
          cost_price: '10.00',
          retail_price: '15.00',
          wholesale_price: '12.00',
          minimum_stock_level: 10
        },
        {
          sku: 'PROD002',
          name: 'Product 2',
          base_unit: 'pcs',
          cost_price: '20.00',
          retail_price: '30.00',
          wholesale_price: '25.00',
          minimum_stock_level: 5
        },
        {
          sku: 'PROD003',
          name: 'Inactive Product',
          base_unit: 'pcs',
          cost_price: '5.00',
          retail_price: '8.00',
          wholesale_price: '6.00',
          minimum_stock_level: 1,
          is_active: false
        }
      ])
      .execute();

    const result = await getDashboardSummary();

    expect(result.total_products).toEqual(2); // Only active products
    expect(result.total_warehouses).toEqual(2); // Only active warehouses
  });

  it('should detect low stock alerts correctly', async () => {
    // Create user and warehouse
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash123',
        full_name: 'Test User',
        role: 'MANAGER'
      })
      .returning()
      .execute();

    const warehouseResult = await db.insert(warehousesTable)
      .values({
        name: 'Test Warehouse',
        type: 'PHYSICAL',
        manager_id: userResult[0].id
      })
      .returning()
      .execute();

    // Create products with different stock levels
    const productResults = await db.insert(productsTable)
      .values([
        {
          sku: 'LOW001',
          name: 'Low Stock Product',
          base_unit: 'pcs',
          cost_price: '10.00',
          retail_price: '15.00',
          wholesale_price: '12.00',
          minimum_stock_level: 10
        },
        {
          sku: 'OK001',
          name: 'OK Stock Product',
          base_unit: 'pcs',
          cost_price: '20.00',
          retail_price: '30.00',
          wholesale_price: '25.00',
          minimum_stock_level: 5
        }
      ])
      .returning()
      .execute();

    // Create inventory with low stock
    await db.insert(inventoryTable)
      .values([
        {
          product_id: productResults[0].id,
          warehouse_id: warehouseResult[0].id,
          quantity: '5.00' // Below minimum of 10
        },
        {
          product_id: productResults[1].id,
          warehouse_id: warehouseResult[0].id,
          quantity: '10.00' // Above minimum of 5
        }
      ])
      .execute();

    const result = await getDashboardSummary();

    expect(result.low_stock_alerts).toEqual(1);
  });

  it('should calculate today sales correctly', async () => {
    // Create user and warehouse
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash123',
        full_name: 'Test User',
        role: 'CASHIER'
      })
      .returning()
      .execute();

    const warehouseResult = await db.insert(warehousesTable)
      .values({
        name: 'Test Warehouse',
        type: 'PHYSICAL',
        manager_id: userResult[0].id
      })
      .returning()
      .execute();

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Create sales - some today, some yesterday
    await db.insert(salesTable)
      .values([
        {
          sale_number: 'SALE001',
          warehouse_id: warehouseResult[0].id,
          cashier_id: userResult[0].id,
          sale_type: 'RETAIL',
          status: 'COMPLETED',
          subtotal: '100.00',
          total_amount: '100.00',
          sale_date: today
        },
        {
          sale_number: 'SALE002',
          warehouse_id: warehouseResult[0].id,
          cashier_id: userResult[0].id,
          sale_type: 'RETAIL',
          status: 'COMPLETED',
          subtotal: '50.00',
          total_amount: '50.00',
          sale_date: today
        },
        {
          sale_number: 'SALE003',
          warehouse_id: warehouseResult[0].id,
          cashier_id: userResult[0].id,
          sale_type: 'RETAIL',
          status: 'COMPLETED',
          subtotal: '75.00',
          total_amount: '75.00',
          sale_date: yesterday
        },
        {
          sale_number: 'SALE004',
          warehouse_id: warehouseResult[0].id,
          cashier_id: userResult[0].id,
          sale_type: 'RETAIL',
          status: 'PENDING',
          subtotal: '25.00',
          total_amount: '25.00',
          sale_date: today
        }
      ])
      .execute();

    const result = await getDashboardSummary();

    expect(result.today_sales_count).toEqual(2); // Only completed sales today
    expect(result.today_sales_revenue).toEqual(150); // 100 + 50
  });

  it('should return recent sales with correct data types', async () => {
    // Create user and warehouse
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash123',
        full_name: 'Test User',
        role: 'CASHIER'
      })
      .returning()
      .execute();

    const warehouseResult = await db.insert(warehousesTable)
      .values({
        name: 'Test Warehouse',
        type: 'PHYSICAL',
        manager_id: userResult[0].id
      })
      .returning()
      .execute();

    // Create a completed sale
    await db.insert(salesTable)
      .values({
        sale_number: 'SALE001',
        warehouse_id: warehouseResult[0].id,
        cashier_id: userResult[0].id,
        customer_name: 'John Doe',
        sale_type: 'RETAIL',
        status: 'COMPLETED',
        subtotal: '100.00',
        total_amount: '100.00',
        sale_date: new Date()
      })
      .execute();

    const result = await getDashboardSummary();

    expect(result.recent_sales).toHaveLength(1);
    expect(result.recent_sales[0].sale_number).toEqual('SALE001');
    expect(result.recent_sales[0].customer_name).toEqual('John Doe');
    expect(typeof result.recent_sales[0].total_amount).toEqual('number');
    expect(result.recent_sales[0].total_amount).toEqual(100);
    expect(result.recent_sales[0].sale_date).toBeInstanceOf(Date);
  });

  it('should count pending transfers and packing correctly', async () => {
    // Create users and warehouses
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash123',
        full_name: 'Test User',
        role: 'MANAGER'
      })
      .returning()
      .execute();

    const warehouseResults = await db.insert(warehousesTable)
      .values([
        { name: 'Warehouse 1', type: 'PHYSICAL', manager_id: userResult[0].id },
        { name: 'Warehouse 2', type: 'PHYSICAL', manager_id: userResult[0].id }
      ])
      .returning()
      .execute();

    // Create pending transfer
    await db.insert(stockTransfersTable)
      .values({
        transfer_number: 'TRANS001',
        from_warehouse_id: warehouseResults[0].id,
        to_warehouse_id: warehouseResults[1].id,
        requested_by: userResult[0].id,
        status: 'PENDING'
      })
      .execute();

    // Create sale and pending packing
    const saleResult = await db.insert(salesTable)
      .values({
        sale_number: 'SALE001',
        warehouse_id: warehouseResults[0].id,
        sale_type: 'ONLINE',
        status: 'COMPLETED',
        subtotal: '100.00',
        total_amount: '100.00',
        sale_date: new Date()
      })
      .returning()
      .execute();

    await db.insert(packingTable)
      .values({
        sale_id: saleResult[0].id,
        status: 'PENDING'
      })
      .execute();

    const result = await getDashboardSummary();

    expect(result.pending_transfers).toEqual(1);
    expect(result.pending_packing).toEqual(1);
  });

  it('should count overdue transactions correctly', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash123',
        full_name: 'Test User',
        role: 'MANAGER'
      })
      .returning()
      .execute();

    // Create overdue transactions
    await db.insert(accountTransactionsTable)
      .values([
        {
          transaction_number: 'REC001',
          type: 'RECEIVABLE',
          customer_supplier: 'Customer A',
          description: 'Overdue receivable',
          amount: '1000.00',
          due_date: new Date('2023-01-01'),
          status: 'OVERDUE',
          created_by: userResult[0].id
        },
        {
          transaction_number: 'PAY001',
          type: 'PAYABLE',
          customer_supplier: 'Supplier B',
          description: 'Overdue payable',
          amount: '500.00',
          due_date: new Date('2023-01-01'),
          status: 'OVERDUE',
          created_by: userResult[0].id
        },
        {
          transaction_number: 'REC002',
          type: 'RECEIVABLE',
          customer_supplier: 'Customer C',
          description: 'Pending receivable',
          amount: '200.00',
          due_date: new Date('2024-12-31'),
          status: 'PENDING',
          created_by: userResult[0].id
        }
      ])
      .execute();

    const result = await getDashboardSummary();

    expect(result.overdue_receivables).toEqual(1);
    expect(result.overdue_payables).toEqual(1);
  });
});
