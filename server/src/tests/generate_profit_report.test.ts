
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, warehousesTable, productsTable, salesTable, saleItemsTable } from '../db/schema';
import { type ProfitReportInput } from '../schema';
import { generateProfitReport } from '../handlers/generate_profit_report';

// Test data setup
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'hash123',
  full_name: 'Test User',
  role: 'CASHIER' as const
};

const testWarehouse = {
  name: 'Test Warehouse',
  type: 'PHYSICAL' as const,
  address: '123 Test St'
};

const testWarehouse2 = {
  name: 'Test Warehouse 2',
  type: 'ONLINE' as const,
  address: '456 Test Ave'
};

const testProduct = {
  sku: 'TEST001',
  name: 'Test Product',
  description: 'A test product',
  base_unit: 'piece',
  cost_price: '10.00',
  retail_price: '20.00',
  wholesale_price: '15.00',
  minimum_stock_level: 10
};

const testProduct2 = {
  sku: 'TEST002',
  name: 'Test Product 2',
  description: 'Another test product',
  base_unit: 'piece',
  cost_price: '5.00',
  retail_price: '12.00',
  wholesale_price: '8.00',
  minimum_stock_level: 5
};

const testSale = {
  sale_number: 'SALE001',
  sale_type: 'RETAIL' as const,
  status: 'COMPLETED' as const,
  subtotal: '30.00',
  tax_amount: '3.00',
  discount_amount: '0.00',
  total_amount: '33.00',
  sale_date: new Date('2024-01-15')
};

const testSale2 = {
  sale_number: 'SALE002',
  sale_type: 'WHOLESALE' as const,
  status: 'COMPLETED' as const,
  subtotal: '12.00',
  tax_amount: '1.20',
  discount_amount: '0.00',
  total_amount: '13.20',
  sale_date: new Date('2024-01-20')
};

const reportInput: ProfitReportInput = {
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-01-31'),
  warehouse_id: null,
  product_id: null
};

describe('generateProfitReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate empty report when no sales exist', async () => {
    const result = await generateProfitReport(reportInput);

    expect(result.total_revenue).toEqual(0);
    expect(result.total_cost).toEqual(0);
    expect(result.gross_profit).toEqual(0);
    expect(result.profit_margin).toEqual(0);
    expect(result.product_breakdown).toHaveLength(0);
    expect(result.warehouse_breakdown).toHaveLength(0);
  });

  it('should calculate profit report with sales data', async () => {
    // Create test data
    const userResult = await db.insert(usersTable).values(testUser).returning();
    const user = userResult[0];

    const warehouseResult = await db.insert(warehousesTable).values(testWarehouse).returning();
    const warehouse = warehouseResult[0];

    const productResult = await db.insert(productsTable).values(testProduct).returning();
    const product = productResult[0];

    const saleResult = await db.insert(salesTable).values({
      ...testSale,
      warehouse_id: warehouse.id,
      cashier_id: user.id
    }).returning();
    const sale = saleResult[0];

    await db.insert(saleItemsTable).values({
      sale_id: sale.id,
      product_id: product.id,
      quantity: '2.00',
      unit_price: '20.00',
      discount_amount: '0.00',
      total_amount: '40.00',
      cost_price: '20.00' // Total cost for 2 items at $10 each
    });

    const result = await generateProfitReport(reportInput);

    expect(result.total_revenue).toEqual(40);
    expect(result.total_cost).toEqual(20);
    expect(result.gross_profit).toEqual(20);
    expect(result.profit_margin).toEqual(50); // 20/40 * 100
    expect(result.product_breakdown).toHaveLength(1);
    expect(result.warehouse_breakdown).toHaveLength(1);

    // Check product breakdown
    const productBreakdown = result.product_breakdown[0];
    expect(productBreakdown.product_name).toEqual('Test Product');
    expect(productBreakdown.revenue).toEqual(40);
    expect(productBreakdown.cost).toEqual(20);
    expect(productBreakdown.profit).toEqual(20);
    expect(productBreakdown.margin).toEqual(50);
    expect(productBreakdown.quantity_sold).toEqual(2);

    // Check warehouse breakdown
    const warehouseBreakdown = result.warehouse_breakdown[0];
    expect(warehouseBreakdown.warehouse_name).toEqual('Test Warehouse');
    expect(warehouseBreakdown.revenue).toEqual(40);
    expect(warehouseBreakdown.cost).toEqual(20);
    expect(warehouseBreakdown.profit).toEqual(20);
    expect(warehouseBreakdown.margin).toEqual(50);
  });

  it('should filter by warehouse_id when specified', async () => {
    // Create test data with two warehouses
    const userResult = await db.insert(usersTable).values(testUser).returning();
    const user = userResult[0];

    const warehouse1Result = await db.insert(warehousesTable).values(testWarehouse).returning();
    const warehouse1 = warehouse1Result[0];

    const warehouse2Result = await db.insert(warehousesTable).values(testWarehouse2).returning();
    const warehouse2 = warehouse2Result[0];

    const productResult = await db.insert(productsTable).values(testProduct).returning();
    const product = productResult[0];

    // Create sales in both warehouses
    const sale1Result = await db.insert(salesTable).values({
      ...testSale,
      warehouse_id: warehouse1.id,
      cashier_id: user.id
    }).returning();
    const sale1 = sale1Result[0];

    const sale2Result = await db.insert(salesTable).values({
      ...testSale2,
      warehouse_id: warehouse2.id,
      cashier_id: user.id
    }).returning();
    const sale2 = sale2Result[0];

    await db.insert(saleItemsTable).values([
      {
        sale_id: sale1.id,
        product_id: product.id,
        quantity: '1.00',
        unit_price: '20.00',
        discount_amount: '0.00',
        total_amount: '20.00',
        cost_price: '10.00'
      },
      {
        sale_id: sale2.id,
        product_id: product.id,
        quantity: '1.00',
        unit_price: '12.00',
        discount_amount: '0.00',
        total_amount: '12.00',
        cost_price: '5.00'
      }
    ]);

    // Filter by first warehouse only
    const filteredInput: ProfitReportInput = {
      ...reportInput,
      warehouse_id: warehouse1.id
    };

    const result = await generateProfitReport(filteredInput);

    expect(result.total_revenue).toEqual(20);
    expect(result.total_cost).toEqual(10);
    expect(result.warehouse_breakdown).toHaveLength(1);
    expect(result.warehouse_breakdown[0].warehouse_name).toEqual('Test Warehouse');
  });

  it('should filter by product_id when specified', async () => {
    // Create test data with two products
    const userResult = await db.insert(usersTable).values(testUser).returning();
    const user = userResult[0];

    const warehouseResult = await db.insert(warehousesTable).values(testWarehouse).returning();
    const warehouse = warehouseResult[0];

    const product1Result = await db.insert(productsTable).values(testProduct).returning();
    const product1 = product1Result[0];

    const product2Result = await db.insert(productsTable).values(testProduct2).returning();
    const product2 = product2Result[0];

    const saleResult = await db.insert(salesTable).values({
      ...testSale,
      warehouse_id: warehouse.id,
      cashier_id: user.id
    }).returning();
    const sale = saleResult[0];

    await db.insert(saleItemsTable).values([
      {
        sale_id: sale.id,
        product_id: product1.id,
        quantity: '1.00',
        unit_price: '20.00',
        discount_amount: '0.00',
        total_amount: '20.00',
        cost_price: '10.00'
      },
      {
        sale_id: sale.id,
        product_id: product2.id,
        quantity: '1.00',
        unit_price: '12.00',
        discount_amount: '0.00',
        total_amount: '12.00',
        cost_price: '5.00'
      }
    ]);

    // Filter by first product only
    const filteredInput: ProfitReportInput = {
      ...reportInput,
      product_id: product1.id
    };

    const result = await generateProfitReport(filteredInput);

    expect(result.total_revenue).toEqual(20);
    expect(result.total_cost).toEqual(10);
    expect(result.product_breakdown).toHaveLength(1);
    expect(result.product_breakdown[0].product_name).toEqual('Test Product');
  });

  it('should only include completed sales', async () => {
    // Create test data
    const userResult = await db.insert(usersTable).values(testUser).returning();
    const user = userResult[0];

    const warehouseResult = await db.insert(warehousesTable).values(testWarehouse).returning();
    const warehouse = warehouseResult[0];

    const productResult = await db.insert(productsTable).values(testProduct).returning();
    const product = productResult[0];

    // Create pending sale (should be excluded)
    const pendingSaleResult = await db.insert(salesTable).values({
      ...testSale,
      sale_number: 'PENDING001',
      status: 'PENDING',
      warehouse_id: warehouse.id,
      cashier_id: user.id
    }).returning();
    const pendingSale = pendingSaleResult[0];

    // Create completed sale (should be included)
    const completedSaleResult = await db.insert(salesTable).values({
      ...testSale,
      sale_number: 'COMPLETED001',
      status: 'COMPLETED',
      warehouse_id: warehouse.id,
      cashier_id: user.id
    }).returning();
    const completedSale = completedSaleResult[0];

    await db.insert(saleItemsTable).values([
      {
        sale_id: pendingSale.id,
        product_id: product.id,
        quantity: '1.00',
        unit_price: '20.00',
        discount_amount: '0.00',
        total_amount: '20.00',
        cost_price: '10.00'
      },
      {
        sale_id: completedSale.id,
        product_id: product.id,
        quantity: '1.00',
        unit_price: '20.00',
        discount_amount: '0.00',
        total_amount: '20.00',
        cost_price: '10.00'
      }
    ]);

    const result = await generateProfitReport(reportInput);

    // Should only include the completed sale
    expect(result.total_revenue).toEqual(20);
    expect(result.total_cost).toEqual(10);
  });

  it('should handle zero profit margin correctly', async () => {
    // Create test data where cost equals revenue
    const userResult = await db.insert(usersTable).values(testUser).returning();
    const user = userResult[0];

    const warehouseResult = await db.insert(warehousesTable).values(testWarehouse).returning();
    const warehouse = warehouseResult[0];

    const productResult = await db.insert(productsTable).values(testProduct).returning();
    const product = productResult[0];

    const saleResult = await db.insert(salesTable).values({
      ...testSale,
      warehouse_id: warehouse.id,
      cashier_id: user.id
    }).returning();
    const sale = saleResult[0];

    await db.insert(saleItemsTable).values({
      sale_id: sale.id,
      product_id: product.id,
      quantity: '1.00',
      unit_price: '20.00',
      discount_amount: '0.00',
      total_amount: '20.00',
      cost_price: '20.00' // Same as revenue
    });

    const result = await generateProfitReport(reportInput);

    expect(result.total_revenue).toEqual(20);
    expect(result.total_cost).toEqual(20);
    expect(result.gross_profit).toEqual(0);
    expect(result.profit_margin).toEqual(0);
  });
});
