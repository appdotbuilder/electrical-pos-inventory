
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, warehousesTable, productsTable, salesTable, saleItemsTable, productCategoriesTable } from '../db/schema';
import { type SalesReportInput } from '../schema';
import { generateSalesReport } from '../handlers/generate_sales_report';

describe('generateSalesReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const setupTestData = async () => {
    // Create a user for foreign key constraint
    const userResult = await db.insert(usersTable).values({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'hashedpassword',
      full_name: 'Test User',
      role: 'CASHIER'
    }).returning().execute();
    const userId = userResult[0].id;

    // Create warehouses
    const warehouseResult = await db.insert(warehousesTable).values([
      {
        name: 'Main Warehouse',
        type: 'PHYSICAL',
        address: '123 Main St'
      },
      {
        name: 'Online Store',
        type: 'ONLINE',
        address: '456 Online Ave'
      }
    ]).returning().execute();
    const warehouse1Id = warehouseResult[0].id;
    const warehouse2Id = warehouseResult[1].id;

    // Create category
    const categoryResult = await db.insert(productCategoriesTable).values({
      name: 'Electronics',
      description: 'Electronic products'
    }).returning().execute();
    const categoryId = categoryResult[0].id;

    // Create products
    const productResult = await db.insert(productsTable).values([
      {
        sku: 'PROD-001',
        name: 'Product A',
        description: 'First product',
        category_id: categoryId,
        base_unit: 'piece',
        cost_price: '10.00',
        retail_price: '20.00',
        wholesale_price: '15.00',
        minimum_stock_level: 10
      },
      {
        sku: 'PROD-002',
        name: 'Product B',
        description: 'Second product',
        category_id: categoryId,
        base_unit: 'piece',
        cost_price: '5.00',
        retail_price: '15.00',
        wholesale_price: '12.00',
        minimum_stock_level: 5
      }
    ]).returning().execute();
    const product1Id = productResult[0].id;
    const product2Id = productResult[1].id;

    return { userId, warehouse1Id, warehouse2Id, product1Id, product2Id };
  };

  const createSale = async (data: {
    warehouseId: number;
    saleType: 'RETAIL' | 'WHOLESALE' | 'ONLINE';
    totalAmount: string;
    saleDate: Date;
    items: Array<{ productId: number; quantity: string; unitPrice: string; totalAmount: string; costPrice: string; }>;
  }) => {
    const saleResult = await db.insert(salesTable).values({
      sale_number: `SALE-${Date.now()}-${Math.random()}`,
      warehouse_id: data.warehouseId,
      sale_type: data.saleType,
      status: 'COMPLETED',
      subtotal: data.totalAmount,
      tax_amount: '0.00',
      discount_amount: '0.00',
      total_amount: data.totalAmount,
      sale_date: data.saleDate
    }).returning().execute();
    const saleId = saleResult[0].id;

    // Add sale items
    for (const item of data.items) {
      await db.insert(saleItemsTable).values({
        sale_id: saleId,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount_amount: '0.00',
        total_amount: item.totalAmount,
        cost_price: item.costPrice
      }).execute();
    }

    return saleId;
  };

  it('should generate basic sales report', async () => {
    const { userId, warehouse1Id, product1Id } = await setupTestData();

    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');
    const saleDate = new Date('2024-01-15');

    // Create a test sale: 5 units at $20 each = $100 revenue
    // Cost: 5 units at $10 each = $50 total cost
    // Profit should be $100 - $50 = $50
    await createSale({
      warehouseId: warehouse1Id,
      saleType: 'RETAIL',
      totalAmount: '100.00',
      saleDate: saleDate,
      items: [{
        productId: product1Id,
        quantity: '5.00',
        unitPrice: '20.00',
        totalAmount: '100.00',
        costPrice: '10.00'
      }]
    });

    const input: SalesReportInput = {
      start_date: startDate,
      end_date: endDate,
      warehouse_id: null,
      sale_type: null
    };

    const result = await generateSalesReport(input);

    // Basic assertions
    expect(result.total_sales).toEqual(1);
    expect(result.total_revenue).toEqual(100);
    expect(result.sales_count).toEqual(1);
    expect(result.average_sale_value).toEqual(100);
    expect(result.total_profit).toEqual(50); // 100 revenue - 50 total cost (5 * 10)
    expect(result.top_products).toHaveLength(1);
    expect(result.daily_breakdown).toHaveLength(1);
  });

  it('should filter by warehouse', async () => {
    const { userId, warehouse1Id, warehouse2Id, product1Id } = await setupTestData();

    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');
    const saleDate = new Date('2024-01-15');

    // Create sales in both warehouses
    await createSale({
      warehouseId: warehouse1Id,
      saleType: 'RETAIL',
      totalAmount: '100.00',
      saleDate: saleDate,
      items: [{
        productId: product1Id,
        quantity: '5.00',
        unitPrice: '20.00',
        totalAmount: '100.00',
        costPrice: '10.00'
      }]
    });

    await createSale({
      warehouseId: warehouse2Id,
      saleType: 'ONLINE',
      totalAmount: '200.00',
      saleDate: saleDate,
      items: [{
        productId: product1Id,
        quantity: '10.00',
        unitPrice: '20.00',
        totalAmount: '200.00',
        costPrice: '10.00'
      }]
    });

    const input: SalesReportInput = {
      start_date: startDate,
      end_date: endDate,
      warehouse_id: warehouse1Id,
      sale_type: null
    };

    const result = await generateSalesReport(input);

    // Should only include warehouse1 sales
    expect(result.total_sales).toEqual(1);
    expect(result.total_revenue).toEqual(100);
    expect(result.sales_count).toEqual(1);
  });

  it('should filter by sale type', async () => {
    const { userId, warehouse1Id, product1Id } = await setupTestData();

    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');
    const saleDate = new Date('2024-01-15');

    // Create different types of sales
    await createSale({
      warehouseId: warehouse1Id,
      saleType: 'RETAIL',
      totalAmount: '100.00',
      saleDate: saleDate,
      items: [{
        productId: product1Id,
        quantity: '5.00',
        unitPrice: '20.00',
        totalAmount: '100.00',
        costPrice: '10.00'
      }]
    });

    await createSale({
      warehouseId: warehouse1Id,
      saleType: 'WHOLESALE',
      totalAmount: '150.00',
      saleDate: saleDate,
      items: [{
        productId: product1Id,
        quantity: '10.00',
        unitPrice: '15.00',
        totalAmount: '150.00',
        costPrice: '10.00'
      }]
    });

    const input: SalesReportInput = {
      start_date: startDate,
      end_date: endDate,
      warehouse_id: null,
      sale_type: 'RETAIL'
    };

    const result = await generateSalesReport(input);

    // Should only include retail sales
    expect(result.total_sales).toEqual(1);
    expect(result.total_revenue).toEqual(100);
    expect(result.sales_count).toEqual(1);
  });

  it('should return top products correctly', async () => {
    const { userId, warehouse1Id, product1Id, product2Id } = await setupTestData();

    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');
    const saleDate = new Date('2024-01-15');

    // Create sales with different products
    await createSale({
      warehouseId: warehouse1Id,
      saleType: 'RETAIL',
      totalAmount: '200.00',
      saleDate: saleDate,
      items: [
        {
          productId: product1Id,
          quantity: '5.00',
          unitPrice: '20.00',
          totalAmount: '100.00',
          costPrice: '10.00'
        },
        {
          productId: product2Id,
          quantity: '10.00',
          unitPrice: '10.00',
          totalAmount: '100.00',
          costPrice: '5.00'
        }
      ]
    });

    const input: SalesReportInput = {
      start_date: startDate,
      end_date: endDate,
      warehouse_id: null,
      sale_type: null
    };

    const result = await generateSalesReport(input);

    expect(result.top_products).toHaveLength(2);
    expect(result.top_products[0].product_name).toEqual('Product A');
    expect(result.top_products[0].quantity_sold).toEqual(5);
    expect(result.top_products[0].revenue).toEqual(100);
    expect(result.top_products[1].product_name).toEqual('Product B');
    expect(result.top_products[1].quantity_sold).toEqual(10);
    expect(result.top_products[1].revenue).toEqual(100);
  });

  it('should return daily breakdown correctly', async () => {
    const { userId, warehouse1Id, product1Id } = await setupTestData();

    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    // Create sales on different days
    await createSale({
      warehouseId: warehouse1Id,
      saleType: 'RETAIL',
      totalAmount: '100.00',
      saleDate: new Date('2024-01-15'),
      items: [{
        productId: product1Id,
        quantity: '5.00',
        unitPrice: '20.00',
        totalAmount: '100.00',
        costPrice: '10.00'
      }]
    });

    await createSale({
      warehouseId: warehouse1Id,
      saleType: 'RETAIL',
      totalAmount: '200.00',
      saleDate: new Date('2024-01-20'),
      items: [{
        productId: product1Id,
        quantity: '10.00',
        unitPrice: '20.00',
        totalAmount: '200.00',
        costPrice: '10.00'
      }]
    });

    const input: SalesReportInput = {
      start_date: startDate,
      end_date: endDate,
      warehouse_id: null,
      sale_type: null
    };

    const result = await generateSalesReport(input);

    expect(result.daily_breakdown).toHaveLength(2);
    expect(result.daily_breakdown[0].date).toEqual('2024-01-15');
    expect(result.daily_breakdown[0].sales_count).toEqual(1);
    expect(result.daily_breakdown[0].revenue).toEqual(100);
    expect(result.daily_breakdown[1].date).toEqual('2024-01-20');
    expect(result.daily_breakdown[1].sales_count).toEqual(1);
    expect(result.daily_breakdown[1].revenue).toEqual(200);
  });

  it('should handle empty results', async () => {
    await setupTestData();

    const input: SalesReportInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31'),
      warehouse_id: null,
      sale_type: null
    };

    const result = await generateSalesReport(input);

    expect(result.total_sales).toEqual(0);
    expect(result.total_revenue).toEqual(0);
    expect(result.total_profit).toEqual(0);
    expect(result.sales_count).toEqual(0);
    expect(result.average_sale_value).toEqual(0);
    expect(result.top_products).toHaveLength(0);
    expect(result.daily_breakdown).toHaveLength(0);
  });
});
