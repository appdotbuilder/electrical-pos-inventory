
import { db } from '../db';
import { salesTable, saleItemsTable, productsTable, warehousesTable } from '../db/schema';
import { type SalesReportInput } from '../schema';
import { eq, and, gte, lte, sum, count, desc, SQL, sql } from 'drizzle-orm';

export interface SalesReportData {
  total_sales: number;
  total_revenue: number;
  total_profit: number;
  sales_count: number;
  average_sale_value: number;
  top_products: Array<{
    product_name: string;
    quantity_sold: number;
    revenue: number;
  }>;
  daily_breakdown: Array<{
    date: string;
    sales_count: number;
    revenue: number;
  }>;
}

export const generateSalesReport = async (input: SalesReportInput): Promise<SalesReportData> => {
  try {
    // Build base conditions for filtering
    const conditions: SQL<unknown>[] = [
      gte(salesTable.sale_date, input.start_date),
      lte(salesTable.sale_date, input.end_date),
      eq(salesTable.status, 'COMPLETED')
    ];

    if (input.warehouse_id) {
      conditions.push(eq(salesTable.warehouse_id, input.warehouse_id));
    }

    if (input.sale_type) {
      conditions.push(eq(salesTable.sale_type, input.sale_type));
    }

    const whereClause = and(...conditions);

    // Get total sales summary
    const summaryQuery = db.select({
      total_revenue: sum(salesTable.total_amount).as('total_revenue'),
      sales_count: count(salesTable.id).as('sales_count')
    })
      .from(salesTable)
      .where(whereClause);

    const summaryResult = await summaryQuery.execute();
    const summary = summaryResult[0];

    const totalRevenue = parseFloat(summary.total_revenue || '0');
    const salesCount = summary.sales_count || 0;
    const averageSaleValue = salesCount > 0 ? totalRevenue / salesCount : 0;

    // Calculate total profit (total item revenue - total item cost)
    // We need to multiply cost_price by quantity to get total cost per item
    const profitQuery = db.select({
      total_item_revenue: sum(saleItemsTable.total_amount).as('total_item_revenue'),
      total_cost: sum(sql`${saleItemsTable.cost_price} * ${saleItemsTable.quantity}`).as('total_cost')
    })
      .from(saleItemsTable)
      .innerJoin(salesTable, eq(saleItemsTable.sale_id, salesTable.id))
      .where(whereClause);

    const profitResult = await profitQuery.execute();
    const profitData = profitResult[0];
    const totalItemRevenue = parseFloat(profitData.total_item_revenue || '0');
    const totalCost = parseFloat(profitData.total_cost || '0');
    const totalProfit = totalItemRevenue - totalCost;

    // Get top products
    const topProductsQuery = db.select({
      product_name: productsTable.name,
      quantity_sold: sum(saleItemsTable.quantity).as('quantity_sold'),
      revenue: sum(saleItemsTable.total_amount).as('revenue')
    })
      .from(saleItemsTable)
      .innerJoin(salesTable, eq(saleItemsTable.sale_id, salesTable.id))
      .innerJoin(productsTable, eq(saleItemsTable.product_id, productsTable.id))
      .where(whereClause)
      .groupBy(productsTable.id, productsTable.name)
      .orderBy(desc(sum(saleItemsTable.total_amount)))
      .limit(10);

    const topProductsResult = await topProductsQuery.execute();
    const topProducts = topProductsResult.map(product => ({
      product_name: product.product_name,
      quantity_sold: parseFloat(product.quantity_sold || '0'),
      revenue: parseFloat(product.revenue || '0')
    }));

    // Get daily breakdown
    const dailyQuery = db.select({
      date: salesTable.sale_date,
      sales_count: count(salesTable.id).as('daily_sales_count'),
      revenue: sum(salesTable.total_amount).as('daily_revenue')
    })
      .from(salesTable)
      .where(whereClause)
      .groupBy(salesTable.sale_date)
      .orderBy(salesTable.sale_date);

    const dailyResult = await dailyQuery.execute();
    const dailyBreakdown = dailyResult.map(day => ({
      date: day.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
      sales_count: day.sales_count || 0,
      revenue: parseFloat(day.revenue || '0')
    }));

    return {
      total_sales: salesCount,
      total_revenue: totalRevenue,
      total_profit: totalProfit,
      sales_count: salesCount,
      average_sale_value: averageSaleValue,
      top_products: topProducts,
      daily_breakdown: dailyBreakdown
    };
  } catch (error) {
    console.error('Sales report generation failed:', error);
    throw error;
  }
};
