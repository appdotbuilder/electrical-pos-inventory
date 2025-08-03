
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, productCategoriesTable } from '../db/schema';
import { getProducts } from '../handlers/get_products';

describe('getProducts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no products exist', async () => {
    const result = await getProducts();
    expect(result).toEqual([]);
  });

  it('should return all active products', async () => {
    // Create test products
    await db.insert(productsTable).values([
      {
        sku: 'PROD001',
        name: 'Product 1',
        description: 'First product',
        base_unit: 'piece',
        cost_price: '10.50',
        retail_price: '15.99',
        wholesale_price: '12.99',
        minimum_stock_level: 5,
        is_active: true
      },
      {
        sku: 'PROD002',
        name: 'Product 2',
        description: 'Second product',
        base_unit: 'kg',
        cost_price: '25.00',
        retail_price: '35.99',
        wholesale_price: '29.99',
        minimum_stock_level: 10,
        is_active: true
      }
    ]).execute();

    const result = await getProducts();

    expect(result).toHaveLength(2);
    
    // Verify first product
    expect(result[0].sku).toEqual('PROD001');
    expect(result[0].name).toEqual('Product 1');
    expect(result[0].description).toEqual('First product');
    expect(result[0].base_unit).toEqual('piece');
    expect(result[0].cost_price).toEqual(10.50);
    expect(result[0].retail_price).toEqual(15.99);
    expect(result[0].wholesale_price).toEqual(12.99);
    expect(result[0].minimum_stock_level).toEqual(5);
    expect(result[0].is_active).toEqual(true);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Verify numeric conversions
    expect(typeof result[0].cost_price).toBe('number');
    expect(typeof result[0].retail_price).toBe('number');
    expect(typeof result[0].wholesale_price).toBe('number');
  });

  it('should exclude inactive products', async () => {
    // Create both active and inactive products
    await db.insert(productsTable).values([
      {
        sku: 'ACTIVE001',
        name: 'Active Product',
        description: 'This is active',
        base_unit: 'piece',
        cost_price: '10.00',
        retail_price: '15.00',
        wholesale_price: '12.00',
        minimum_stock_level: 5,
        is_active: true
      },
      {
        sku: 'INACTIVE001',
        name: 'Inactive Product',
        description: 'This is inactive',
        base_unit: 'piece',
        cost_price: '20.00',
        retail_price: '25.00',
        wholesale_price: '22.00',
        minimum_stock_level: 0,
        is_active: false
      }
    ]).execute();

    const result = await getProducts();

    expect(result).toHaveLength(1);
    expect(result[0].sku).toEqual('ACTIVE001');
    expect(result[0].name).toEqual('Active Product');
    expect(result[0].is_active).toEqual(true);
  });

  it('should handle products with categories', async () => {
    // Create category first
    const categoryResult = await db.insert(productCategoriesTable).values({
      name: 'Electronics',
      description: 'Electronic products'
    }).returning().execute();

    const categoryId = categoryResult[0].id;

    // Create product with category
    await db.insert(productsTable).values({
      sku: 'ELEC001',
      name: 'Smartphone',
      description: 'Latest smartphone',
      category_id: categoryId,
      base_unit: 'piece',
      cost_price: '500.00',
      retail_price: '699.99',
      wholesale_price: '599.99',
      minimum_stock_level: 2,
      is_active: true
    }).execute();

    const result = await getProducts();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Smartphone');
    expect(result[0].category_id).toEqual(categoryId);
    expect(result[0].cost_price).toEqual(500.00);
    expect(result[0].retail_price).toEqual(699.99);
    expect(result[0].wholesale_price).toEqual(599.99);
  });

  it('should handle products without categories', async () => {
    // Create product without category
    await db.insert(productsTable).values({
      sku: 'MISC001',
      name: 'Miscellaneous Item',
      description: 'No category item',
      category_id: null,
      base_unit: 'piece',
      cost_price: '5.99',
      retail_price: '9.99',
      wholesale_price: '7.99',
      minimum_stock_level: 20,
      is_active: true
    }).execute();

    const result = await getProducts();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Miscellaneous Item');
    expect(result[0].category_id).toBeNull();
    expect(result[0].cost_price).toEqual(5.99);
    expect(result[0].retail_price).toEqual(9.99);
    expect(result[0].wholesale_price).toEqual(7.99);
  });
});
