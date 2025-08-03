
import { db } from '../db';
import { salesTable } from '../db/schema';
import { type Sale } from '../schema';
import { eq, gte, lte, and, desc, type SQL } from 'drizzle-orm';

export const getSales = async (warehouseId?: number, startDate?: Date, endDate?: Date): Promise<Sale[]> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    if (warehouseId !== undefined) {
      conditions.push(eq(salesTable.warehouse_id, warehouseId));
    }

    if (startDate !== undefined) {
      conditions.push(gte(salesTable.sale_date, startDate));
    }

    if (endDate !== undefined) {
      conditions.push(lte(salesTable.sale_date, endDate));
    }

    // Build final query
    const baseQuery = db.select().from(salesTable);
    
    const queryWithConditions = conditions.length > 0 
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseQuery;

    const results = await queryWithConditions
      .orderBy(desc(salesTable.sale_date))
      .execute();

    // Convert numeric fields to numbers
    return results.map(sale => ({
      ...sale,
      subtotal: parseFloat(sale.subtotal),
      tax_amount: parseFloat(sale.tax_amount),
      discount_amount: parseFloat(sale.discount_amount),
      total_amount: parseFloat(sale.total_amount),
      commission_amount: sale.commission_amount ? parseFloat(sale.commission_amount) : null
    }));
  } catch (error) {
    console.error('Failed to fetch sales:', error);
    throw error;
  }
};
