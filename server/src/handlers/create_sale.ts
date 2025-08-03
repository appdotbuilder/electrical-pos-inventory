
import { db } from '../db';
import { salesTable, saleItemsTable, inventoryTable, usersTable, productsTable } from '../db/schema';
import { type CreateSaleInput, type Sale } from '../schema';
import { eq, and, sql } from 'drizzle-orm';

export const createSale = async (input: CreateSaleInput, cashierId?: number): Promise<Sale> => {
  try {
    // Generate unique sale number
    const saleNumber = `SALE-${Date.now()}`;

    // Validate cashier if provided
    if (cashierId) {
      const cashier = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, cashierId))
        .execute();
      
      if (cashier.length === 0) {
        throw new Error(`Cashier with ID ${cashierId} not found`);
      }
    }

    // Check inventory availability for all items
    for (const item of input.items) {
      const inventory = await db.select()
        .from(inventoryTable)
        .where(
          and(
            eq(inventoryTable.product_id, item.product_id),
            eq(inventoryTable.warehouse_id, input.warehouse_id)
          )
        )
        .execute();

      if (inventory.length === 0) {
        throw new Error(`Product ${item.product_id} not found in warehouse ${input.warehouse_id}`);
      }

      const availableQuantity = parseFloat(inventory[0].quantity) - parseFloat(inventory[0].reserved_quantity);
      if (availableQuantity < item.quantity) {
        throw new Error(`Insufficient inventory for product ${item.product_id}. Available: ${availableQuantity}, Requested: ${item.quantity}`);
      }
    }

    // Get product details for cost prices
    const productIds = input.items.map(item => item.product_id);
    const productMap = new Map();
    for (const productId of productIds) {
      const product = await db.select()
        .from(productsTable)
        .where(eq(productsTable.id, productId))
        .execute();
      
      if (product.length === 0) {
        throw new Error(`Product with ID ${productId} not found`);
      }
      
      productMap.set(productId, product[0]);
    }

    // Calculate totals
    const subtotal = input.items.reduce((sum, item) => 
      sum + (item.quantity * item.unit_price - item.discount_amount), 0
    );
    const totalDiscountAmount = input.items.reduce((sum, item) => sum + item.discount_amount, 0);
    const taxAmount = 0; // No tax calculation in this implementation
    const totalAmount = subtotal;

    // Calculate commission if cashier exists
    let commissionAmount = null;
    if (cashierId) {
      const cashier = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, cashierId))
        .execute();
      
      if (cashier[0].commission_rate) {
        commissionAmount = totalAmount * (parseFloat(cashier[0].commission_rate) / 100);
      }
    }

    // Create sale record
    const saleResult = await db.insert(salesTable)
      .values({
        sale_number: saleNumber,
        warehouse_id: input.warehouse_id,
        cashier_id: cashierId || null,
        customer_name: input.customer_name,
        customer_contact: input.customer_contact,
        sale_type: input.sale_type,
        status: 'PENDING',
        subtotal: subtotal.toString(),
        tax_amount: taxAmount.toString(),
        discount_amount: totalDiscountAmount.toString(),
        total_amount: totalAmount.toString(),
        commission_amount: commissionAmount ? commissionAmount.toString() : null,
        tracking_number: input.tracking_number,
        notes: input.notes,
        sale_date: new Date()
      })
      .returning()
      .execute();

    const sale = saleResult[0];

    // Create sale items
    for (const item of input.items) {
      const product = productMap.get(item.product_id);
      const itemTotal = item.quantity * item.unit_price - item.discount_amount;

      await db.insert(saleItemsTable)
        .values({
          sale_id: sale.id,
          product_id: item.product_id,
          quantity: item.quantity.toString(),
          unit_price: item.unit_price.toString(),
          discount_amount: item.discount_amount.toString(),
          total_amount: itemTotal.toString(),
          cost_price: product.cost_price
        })
        .execute();
    }

    // Reserve inventory for all items
    for (const item of input.items) {
      await db.update(inventoryTable)
        .set({
          reserved_quantity: sql`reserved_quantity + ${item.quantity}`,
          last_updated: new Date()
        })
        .where(
          and(
            eq(inventoryTable.product_id, item.product_id),
            eq(inventoryTable.warehouse_id, input.warehouse_id)
          )
        )
        .execute();
    }

    // Convert numeric fields back to numbers before returning
    return {
      ...sale,
      subtotal: parseFloat(sale.subtotal),
      tax_amount: parseFloat(sale.tax_amount),
      discount_amount: parseFloat(sale.discount_amount),
      total_amount: parseFloat(sale.total_amount),
      commission_amount: sale.commission_amount ? parseFloat(sale.commission_amount) : null
    };
  } catch (error) {
    console.error('Sale creation failed:', error);
    throw error;
  }
};
