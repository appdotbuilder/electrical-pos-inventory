
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, warehousesTable, inventoryTable, productCategoriesTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { createProduct } from '../handlers/create_product';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateProductInput = {
  sku: 'TEST-SKU-001',
  name: 'Test Product',
  description: 'A product for testing purposes',
  category_id: null,
  base_unit: 'piece',
  cost_price: 10.50,
  retail_price: 19.99,
  wholesale_price: 15.00,
  minimum_stock_level: 5
};

describe('createProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a product with correct fields', async () => {
    const result = await createProduct(testInput);

    // Verify all product fields
    expect(result.sku).toEqual('TEST-SKU-001');
    expect(result.name).toEqual('Test Product');
    expect(result.description).toEqual('A product for testing purposes');
    expect(result.category_id).toBeNull();
    expect(result.base_unit).toEqual('piece');
    expect(result.cost_price).toEqual(10.50);
    expect(typeof result.cost_price).toBe('number');
    expect(result.retail_price).toEqual(19.99);
    expect(typeof result.retail_price).toBe('number');
    expect(result.wholesale_price).toEqual(15.00);
    expect(typeof result.wholesale_price).toBe('number');
    expect(result.minimum_stock_level).toEqual(5);
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save product to database correctly', async () => {
    const result = await createProduct(testInput);

    // Query the database to verify the product was saved
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products).toHaveLength(1);
    const savedProduct = products[0];
    expect(savedProduct.sku).toEqual('TEST-SKU-001');
    expect(savedProduct.name).toEqual('Test Product');
    expect(parseFloat(savedProduct.cost_price)).toEqual(10.50);
    expect(parseFloat(savedProduct.retail_price)).toEqual(19.99);
    expect(parseFloat(savedProduct.wholesale_price)).toEqual(15.00);
    expect(savedProduct.is_active).toBe(true);
  });

  it('should create inventory records for all active warehouses', async () => {
    // Create test warehouses - one active, one inactive
    const warehouseResults = await db.insert(warehousesTable)
      .values([
        {
          name: 'Active Warehouse',
          type: 'PHYSICAL',
          address: '123 Test St',
          is_active: true
        },
        {
          name: 'Inactive Warehouse',
          type: 'PHYSICAL',
          address: '456 Test Ave',
          is_active: false
        }
      ])
      .returning()
      .execute();

    const result = await createProduct(testInput);

    // Check inventory records were created
    const inventoryRecords = await db.select()
      .from(inventoryTable)
      .where(eq(inventoryTable.product_id, result.id))
      .execute();

    // Should only create inventory for active warehouses
    expect(inventoryRecords).toHaveLength(1);
    expect(inventoryRecords[0].warehouse_id).toEqual(warehouseResults[0].id);
    expect(parseFloat(inventoryRecords[0].quantity)).toEqual(0);
    expect(parseFloat(inventoryRecords[0].reserved_quantity)).toEqual(0);
  });

  it('should work with valid category_id', async () => {
    // Create a product category first
    const categoryResult = await db.insert(productCategoriesTable)
      .values({
        name: 'Test Category',
        description: 'Category for testing'
      })
      .returning()
      .execute();

    const inputWithCategory = {
      ...testInput,
      category_id: categoryResult[0].id
    };

    const result = await createProduct(inputWithCategory);

    expect(result.category_id).toEqual(categoryResult[0].id);

    // Verify in database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products[0].category_id).toEqual(categoryResult[0].id);
  });

  it('should handle multiple active warehouses', async () => {
    // Create multiple active warehouses
    const warehouseResults = await db.insert(warehousesTable)
      .values([
        {
          name: 'Warehouse 1',
          type: 'PHYSICAL',
          is_active: true
        },
        {
          name: 'Warehouse 2',
          type: 'ONLINE',
          is_active: true
        },
        {
          name: 'Warehouse 3',
          type: 'PHYSICAL',
          is_active: true
        }
      ])
      .returning()
      .execute();

    const result = await createProduct(testInput);

    // Check inventory records for all active warehouses
    const inventoryRecords = await db.select()
      .from(inventoryTable)
      .where(eq(inventoryTable.product_id, result.id))
      .execute();

    expect(inventoryRecords).toHaveLength(3);
    
    const warehouseIds = inventoryRecords.map(record => record.warehouse_id).sort();
    const expectedWarehouseIds = warehouseResults.map(w => w.id).sort();
    expect(warehouseIds).toEqual(expectedWarehouseIds);

    // All should have zero quantities
    inventoryRecords.forEach(record => {
      expect(parseFloat(record.quantity)).toEqual(0);
      expect(parseFloat(record.reserved_quantity)).toEqual(0);
    });
  });

  it('should reject duplicate SKU', async () => {
    // Create first product
    await createProduct(testInput);

    // Try to create another product with same SKU
    await expect(createProduct(testInput))
      .rejects.toThrow(/duplicate key value violates unique constraint/i);
  });
});
