
import { db } from '../db';
import { 
  productsTable, 
  warehousesTable, 
  inventoryTable, 
  stockTransfersTable, 
  packingTable, 
  salesTable,
  saleItemsTable,
  accountTransactionsTable 
} from '../db/schema';
import { eq, lt, and, desc, sql, gte } from 'drizzle-orm';

export interface DashboardSummary {
  total_products: number;
  total_warehouses: number;
  low_stock_alerts: number;
  pending_transfers: number;
  pending_packing: number;
  today_sales_count: number;
  today_sales_revenue: number;
  overdue_receivables: number;
  overdue_payables: number;
  recent_sales: Array<{
    id: number;
    sale_number: string;
    customer_name: string | null;
    total_amount: number;
    sale_date: Date;
    status: string;
  }>;
  top_selling_products: Array<{
    product_name: string;
    quantity_sold: number;
    revenue: number;
  }>;
}

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get total products count
    const totalProductsResult = await db.select({ count: sql<number>`count(*)::int` })
      .from(productsTable)
      .where(eq(productsTable.is_active, true))
      .execute();

    // Get total warehouses count
    const totalWarehousesResult = await db.select({ count: sql<number>`count(*)::int` })
      .from(warehousesTable)
      .where(eq(warehousesTable.is_active, true))
      .execute();

    // Get low stock alerts (inventory below minimum stock level)
    const lowStockResult = await db.select({ count: sql<number>`count(*)::int` })
      .from(inventoryTable)
      .innerJoin(productsTable, eq(inventoryTable.product_id, productsTable.id))
      .where(
        and(
          eq(productsTable.is_active, true),
          sql`${inventoryTable.quantity}::numeric < ${productsTable.minimum_stock_level}::numeric`
        )
      )
      .execute();

    // Get pending transfers count
    const pendingTransfersResult = await db.select({ count: sql<number>`count(*)::int` })
      .from(stockTransfersTable)
      .where(eq(stockTransfersTable.status, 'PENDING'))
      .execute();

    // Get pending packing count
    const pendingPackingResult = await db.select({ count: sql<number>`count(*)::int` })
      .from(packingTable)
      .where(eq(packingTable.status, 'PENDING'))
      .execute();

    // Get today's sales count and revenue
    const todaySalesResult = await db.select({
      count: sql<number>`count(*)::int`,
      revenue: sql<number>`coalesce(sum(${salesTable.total_amount}::numeric), 0)::numeric`
    })
      .from(salesTable)
      .where(
        and(
          gte(salesTable.sale_date, today),
          lt(salesTable.sale_date, tomorrow),
          eq(salesTable.status, 'COMPLETED')
        )
      )
      .execute();

    // Get overdue receivables count
    const overdueReceivablesResult = await db.select({ count: sql<number>`count(*)::int` })
      .from(accountTransactionsTable)
      .where(
        and(
          eq(accountTransactionsTable.type, 'RECEIVABLE'),
          eq(accountTransactionsTable.status, 'OVERDUE')
        )
      )
      .execute();

    // Get overdue payables count
    const overduePayablesResult = await db.select({ count: sql<number>`count(*)::int` })
      .from(accountTransactionsTable)
      .where(
        and(
          eq(accountTransactionsTable.type, 'PAYABLE'),
          eq(accountTransactionsTable.status, 'OVERDUE')
        )
      )
      .execute();

    // Get recent sales (last 10 completed sales)
    const recentSalesResult = await db.select({
      id: salesTable.id,
      sale_number: salesTable.sale_number,
      customer_name: salesTable.customer_name,
      total_amount: salesTable.total_amount,
      sale_date: salesTable.sale_date,
      status: salesTable.status
    })
      .from(salesTable)
      .where(eq(salesTable.status, 'COMPLETED'))
      .orderBy(desc(salesTable.sale_date))
      .limit(10)
      .execute();

    // Get top selling products (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const topSellingResult = await db.select({
      product_name: productsTable.name,
      quantity_sold: sql<number>`sum(${saleItemsTable.quantity}::numeric)::numeric`,
      revenue: sql<number>`sum(${saleItemsTable.total_amount}::numeric)::numeric`
    })
      .from(saleItemsTable)
      .innerJoin(salesTable, eq(saleItemsTable.sale_id, salesTable.id))
      .innerJoin(productsTable, eq(saleItemsTable.product_id, productsTable.id))
      .where(
        and(
          gte(salesTable.sale_date, thirtyDaysAgo),
          eq(salesTable.status, 'COMPLETED')
        )
      )
      .groupBy(productsTable.id, productsTable.name)
      .orderBy(desc(sql`sum(${saleItemsTable.quantity}::numeric)`))
      .limit(5)
      .execute();

    return {
      total_products: totalProductsResult[0]?.count || 0,
      total_warehouses: totalWarehousesResult[0]?.count || 0,
      low_stock_alerts: lowStockResult[0]?.count || 0,
      pending_transfers: pendingTransfersResult[0]?.count || 0,
      pending_packing: pendingPackingResult[0]?.count || 0,
      today_sales_count: todaySalesResult[0]?.count || 0,
      today_sales_revenue: parseFloat(todaySalesResult[0]?.revenue?.toString() || '0'),
      overdue_receivables: overdueReceivablesResult[0]?.count || 0,
      overdue_payables: overduePayablesResult[0]?.count || 0,
      recent_sales: recentSalesResult.map(sale => ({
        id: sale.id,
        sale_number: sale.sale_number,
        customer_name: sale.customer_name,
        total_amount: parseFloat(sale.total_amount),
        sale_date: sale.sale_date,
        status: sale.status
      })),
      top_selling_products: topSellingResult.map(product => ({
        product_name: product.product_name,
        quantity_sold: parseFloat(product.quantity_sold.toString()),
        revenue: parseFloat(product.revenue.toString())
      }))
    };
  } catch (error) {
    console.error('Dashboard summary generation failed:', error);
    throw error;
  }
};
