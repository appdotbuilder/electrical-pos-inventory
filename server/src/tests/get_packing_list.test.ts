
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  usersTable, 
  warehousesTable, 
  productsTable, 
  salesTable, 
  packingTable,
  productCategoriesTable
} from '../db/schema';
import { getPackingList } from '../handlers/get_packing_list';

describe('getPackingList', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no packing records exist', async () => {
    const result = await getPackingList();
    expect(result).toEqual([]);
  });

  it('should return only online sale packing records', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable).values({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'hash',
      full_name: 'Test User',
      role: 'CASHIER'
    }).returning().execute();

    const [warehouse] = await db.insert(warehousesTable).values({
      name: 'Test Warehouse',
      type: 'ONLINE'
    }).returning().execute();

    const [category] = await db.insert(productCategoriesTable).values({
      name: 'Test Category'
    }).returning().execute();

    const [product] = await db.insert(productsTable).values({
      sku: 'TEST-001',
      name: 'Test Product',
      category_id: category.id,
      base_unit: 'pcs',
      cost_price: '10.00',
      retail_price: '15.00',
      wholesale_price: '12.00',
      minimum_stock_level: 5
    }).returning().execute();

    // Create online sale
    const [onlineSale] = await db.insert(salesTable).values({
      sale_number: 'ON-001',
      warehouse_id: warehouse.id,
      cashier_id: user.id,
      sale_type: 'ONLINE',
      status: 'COMPLETED',
      subtotal: '100.00',
      total_amount: '100.00',
      sale_date: new Date()
    }).returning().execute();

    // Create retail sale (should be filtered out)
    const [retailSale] = await db.insert(salesTable).values({
      sale_number: 'RT-001',
      warehouse_id: warehouse.id,
      cashier_id: user.id,
      sale_type: 'RETAIL',
      status: 'COMPLETED',
      subtotal: '50.00',
      total_amount: '50.00',
      sale_date: new Date()
    }).returning().execute();

    // Create packing records
    await db.insert(packingTable).values([
      {
        sale_id: onlineSale.id,
        packer_id: user.id,
        status: 'PENDING'
      },
      {
        sale_id: retailSale.id,
        packer_id: user.id,
        status: 'PENDING'
      }
    ]).execute();

    const result = await getPackingList();

    expect(result).toHaveLength(1);
    expect(result[0].sale_id).toEqual(onlineSale.id);
    expect(result[0].packer_id).toEqual(user.id);
    expect(result[0].status).toEqual('PENDING');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should filter by status when provided', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable).values({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'hash',
      full_name: 'Test User',
      role: 'WAREHOUSE'
    }).returning().execute();

    const [warehouse] = await db.insert(warehousesTable).values({
      name: 'Online Store',
      type: 'ONLINE'
    }).returning().execute();

    const [category] = await db.insert(productCategoriesTable).values({
      name: 'Electronics'
    }).returning().execute();

    const [product] = await db.insert(productsTable).values({
      sku: 'ELEC-001',
      name: 'Electronics Product',
      category_id: category.id,
      base_unit: 'pcs',
      cost_price: '25.00',
      retail_price: '35.00',
      wholesale_price: '30.00',
      minimum_stock_level: 10
    }).returning().execute();

    // Create multiple online sales
    const [sale1] = await db.insert(salesTable).values({
      sale_number: 'ON-001',
      warehouse_id: warehouse.id,
      sale_type: 'ONLINE',
      status: 'COMPLETED',
      subtotal: '100.00',
      total_amount: '100.00',
      sale_date: new Date()
    }).returning().execute();

    const [sale2] = await db.insert(salesTable).values({
      sale_number: 'ON-002',
      warehouse_id: warehouse.id,
      sale_type: 'ONLINE',
      status: 'COMPLETED',
      subtotal: '150.00',
      total_amount: '150.00',
      sale_date: new Date()
    }).returning().execute();

    // Create packing records with different statuses
    await db.insert(packingTable).values([
      {
        sale_id: sale1.id,
        packer_id: user.id,
        status: 'PENDING'
      },
      {
        sale_id: sale2.id,
        packer_id: user.id,
        status: 'PACKED'
      }
    ]).execute();

    // Test filtering by PENDING status
    const pendingResult = await getPackingList('PENDING');
    expect(pendingResult).toHaveLength(1);
    expect(pendingResult[0].status).toEqual('PENDING');
    expect(pendingResult[0].sale_id).toEqual(sale1.id);

    // Test filtering by PACKED status
    const packedResult = await getPackingList('PACKED');
    expect(packedResult).toHaveLength(1);
    expect(packedResult[0].status).toEqual('PACKED');
    expect(packedResult[0].sale_id).toEqual(sale2.id);

    // Test filtering by non-existent status
    const shippedResult = await getPackingList('SHIPPED');
    expect(shippedResult).toHaveLength(0);
  });

  it('should handle packing records without assigned packer', async () => {
    // Create prerequisite data
    const [warehouse] = await db.insert(warehousesTable).values({
      name: 'Online Warehouse',
      type: 'ONLINE'
    }).returning().execute();

    const [category] = await db.insert(productCategoriesTable).values({
      name: 'Books'
    }).returning().execute();

    const [product] = await db.insert(productsTable).values({
      sku: 'BOOK-001',
      name: 'Test Book',
      category_id: category.id,
      base_unit: 'pcs',
      cost_price: '8.00',
      retail_price: '12.00',
      wholesale_price: '10.00',
      minimum_stock_level: 20
    }).returning().execute();

    const [sale] = await db.insert(salesTable).values({
      sale_number: 'ON-003',
      warehouse_id: warehouse.id,
      sale_type: 'ONLINE',
      status: 'COMPLETED',
      subtotal: '75.00',
      total_amount: '75.00',
      sale_date: new Date()
    }).returning().execute();

    // Create packing record without packer
    await db.insert(packingTable).values({
      sale_id: sale.id,
      packer_id: null,
      status: 'PENDING'
    }).execute();

    const result = await getPackingList();

    expect(result).toHaveLength(1);
    expect(result[0].sale_id).toEqual(sale.id);
    expect(result[0].packer_id).toBeNull();
    expect(result[0].status).toEqual('PENDING');
    expect(result[0].packed_date).toBeNull();
    expect(result[0].shipped_date).toBeNull();
    expect(result[0].tracking_info).toBeNull();
  });
});
