import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface DashboardSummary {
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

export function Dashboard() {
  const { user, token, hasRole } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      const result = await trpc.getDashboardSummary.query(token ? { token } : undefined);
      setSummary(result);
      setError(null);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin text-4xl mb-4">⚡</div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>
            No dashboard data available.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.full_name}! 👋
        </h2>
        <p className="text-gray-600">
          Here's what's happening in your store today.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <span className="text-2xl">📦</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_products}</div>
            <p className="text-xs text-gray-500">Active products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warehouses</CardTitle>
            <span className="text-2xl">🏪</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_warehouses}</div>
            <p className="text-xs text-gray-500">Active locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.today_sales_count}</div>
            <p className="text-xs text-gray-500">
              ${summary.today_sales_revenue.toFixed(2)} revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <span className="text-2xl">⚠️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summary.low_stock_alerts}
            </div>
            <p className="text-xs text-gray-500">Items need restocking</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Tasks (Only for management roles) */}
      {hasRole(['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER']) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Stock Transfers</span>
                <Badge variant={summary.pending_transfers > 0 ? "destructive" : "secondary"}>
                  {summary.pending_transfers}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Packing Orders</span>
                <Badge variant={summary.pending_packing > 0 ? "destructive" : "secondary"}>
                  {summary.pending_packing}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Overdue Receivables</span>
                <Badge variant={summary.overdue_receivables > 0 ? "destructive" : "secondary"}>
                  {summary.overdue_receivables}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Overdue Payables</span>
                <Badge variant={summary.overdue_payables > 0 ? "destructive" : "secondary"}>
                  {summary.overdue_payables}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Recent Sales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Sales</CardTitle>
              <CardDescription>Latest completed transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {summary.recent_sales.length === 0 ? (
                <p className="text-gray-500 text-sm">No recent sales</p>
              ) : (
                <div className="space-y-3">
                  {summary.recent_sales.slice(0, 5).map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{sale.sale_number}</p>
                        <p className="text-xs text-gray-500">
                          {sale.customer_name || 'Walk-in Customer'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          ${sale.total_amount.toFixed(2)}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {sale.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Selling Products */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Products</CardTitle>
              <CardDescription>Best sellers (last 30 days)</CardDescription>
            </CardHeader>
            <CardContent>
              {summary.top_selling_products.length === 0 ? (
                <p className="text-gray-500 text-sm">No sales data</p>
              ) : (
                <div className="space-y-3">
                  {summary.top_selling_products.map((product, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{product.product_name}</p>
                        <p className="text-xs text-gray-500">
                          {product.quantity_sold} units sold
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          ${product.revenue.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Role-based welcome messages */}
      {hasRole('CASHIER') && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <p className="text-green-800">
              💰 Ready to process sales? Your commission rate is {user?.commission_rate}% 
              for wholesale transactions.
            </p>
          </CardContent>
        </Card>
      )}

      {hasRole('WAREHOUSE') && (
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-6">
            <p className="text-purple-800">
              📦 Check stock levels and manage inventory transfers to keep operations smooth.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}