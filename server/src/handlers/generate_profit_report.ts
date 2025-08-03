
import { db } from '../db';
import { salesTable, saleItemsTable, productsTable, warehousesTable } from '../db/schema';
import { type ProfitReportInput } from '../schema';
import { eq, and, gte, lte, sum, count, SQL } from 'drizzle-orm';

export interface ProfitReportData {
  total_revenue: number;
  total_cost: number;
  gross_profit: number;
  profit_margin: number;
  product_breakdown: Array<{
    product_name: string;
    revenue: number;
    cost: number;
    profit: number;
    margin: number;
    quantity_sold: number;
  }>;
  warehouse_breakdown: Array<{
    warehouse_name: string;
    revenue: number;
    cost: number;
    profit: number;
    margin: number;
  }>;
}

export const generateProfitReport = async (input: ProfitReportInput): Promise<ProfitReportData> => {
  try {
    // Build base query conditions
    const conditions: SQL<unknown>[] = [
      gte(salesTable.sale_date, input.start_date),
      lte(salesTable.sale_date, input.end_date),
      eq(salesTable.status, 'COMPLETED')
    ];

    if (input.warehouse_id !== null) {
      conditions.push(eq(salesTable.warehouse_id, input.warehouse_id));
    }

    if (input.product_id !== null) {
      conditions.push(eq(saleItemsTable.product_id, input.product_id));
    }

    // Get overall totals
    const totalQuery = db
      .select({
        total_revenue: sum(saleItemsTable.total_amount),
        total_cost: sum(saleItemsTable.cost_price)
      })
      .from(saleItemsTable)
      .innerJoin(salesTable, eq(saleItemsTable.sale_id, salesTable.id))
      .where(and(...conditions));

    const totalResults = await totalQuery.execute();
    const totals = totalResults[0];

    const totalRevenue = parseFloat(totals.total_revenue || '0');
    const totalCost = parseFloat(totals.total_cost || '0');
    const grossProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // Get product breakdown
    const productQuery = db
      .select({
        product_name: productsTable.name,
        revenue: sum(saleItemsTable.total_amount),
        cost: sum(saleItemsTable.cost_price),
        quantity_sold: sum(saleItemsTable.quantity)
      })
      .from(saleItemsTable)
      .innerJoin(salesTable, eq(saleItemsTable.sale_id, salesTable.id))
      .innerJoin(productsTable, eq(saleItemsTable.product_id, productsTable.id))
      .where(and(...conditions))
      .groupBy(productsTable.id, productsTable.name);

    const productResults = await productQuery.execute();
    const productBreakdown = productResults.map(product => {
      const revenue = parseFloat(product.revenue || '0');
      const cost = parseFloat(product.cost || '0');
      const profit = revenue - cost;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

      return {
        product_name: product.product_name,
        revenue,
        cost,
        profit,
        margin,
        quantity_sold: parseFloat(product.quantity_sold || '0')
      };
    });

    // Get warehouse breakdown
    const warehouseQuery = db
      .select({
        warehouse_name: warehousesTable.name,
        revenue: sum(saleItemsTable.total_amount),
        cost: sum(saleItemsTable.cost_price)
      })
      .from(saleItemsTable)
      .innerJoin(salesTable, eq(saleItemsTable.sale_id, salesTable.id))
      .innerJoin(warehousesTable, eq(salesTable.warehouse_id, warehousesTable.id))
      .where(and(...conditions))
      .groupBy(warehousesTable.id, warehousesTable.name);

    const warehouseResults = await warehouseQuery.execute();
    const warehouseBreakdown = warehouseResults.map(warehouse => {
      const revenue = parseFloat(warehouse.revenue || '0');
      const cost = parseFloat(warehouse.cost || '0');
      const profit = revenue - cost;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

      return {
        warehouse_name: warehouse.warehouse_name,
        revenue,
        cost,
        profit,
        margin
      };
    });

    return {
      total_revenue: totalRevenue,
      total_cost: totalCost,
      gross_profit: grossProfit,
      profit_margin: profitMargin,
      product_breakdown: productBreakdown,
      warehouse_breakdown: warehouseBreakdown
    };
  } catch (error) {
    console.error('Profit report generation failed:', error);
    throw error;
  }
};
