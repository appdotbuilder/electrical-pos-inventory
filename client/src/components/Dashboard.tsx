
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Package, Warehouse, AlertTriangle, ShoppingCart, DollarSign, TrendingUp, Clock, Server, CheckCircle } from 'lucide-react';
import type { DashboardSummary } from '../../../server/src/handlers/get_dashboard_summary';

interface DashboardProps {
  data: DashboardSummary | null;
  isLoading: boolean;
  onRefresh: () => void;
  backendAvailable?: boolean;
  errorMessage?: string | null;
}

export function Dashboard({ data, isLoading, onRefresh, backendAvailable = true, errorMessage }: DashboardProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center max-w-2xl">
            <Server className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-amber-800 mb-2">Backend Server Not Available</h3>
            <p className="text-amber-700 mb-4">
              {errorMessage || 'The dashboard cannot load data because the backend server is not running.'}
            </p>
            <div className="bg-white p-4 rounded-lg mb-4 border border-amber-200">
              <h4 className="font-medium text-amber-800 mb-3">🚀 To start the backend server:</h4>
              <div className="text-left text-sm text-amber-700 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <code className="bg-amber-100 px-2 py-1 rounded">cd server</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <code className="bg-amber-100 px-2 py-1 rounded">npm install</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <code className="bg-amber-100 px-2 py-1 rounded">npm run dev</code>
                </div>
                <div className="mt-3 p-2 bg-amber-50 rounded text-xs">
                  💡 Server will run on <code>http://localhost:2022</code>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-center">
              <Button onClick={onRefresh} variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={() => window.location.reload()} variant="default" className="bg-amber-600 hover:bg-amber-700">
                <Package className="h-4 w-4 mr-2" />
                Reload Page
              </Button>
            </div>
            <p className="text-xs text-amber-600 mt-4">
              Don't worry! The frontend UI is fully functional and will show demo data shortly.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      {!backendAvailable && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="font-medium text-blue-800">Demo Mode Active</h4>
                  <p className="text-sm text-blue-600">
                    Showing sample data to demonstrate the system's capabilities
                  </p>
                </div>
              </div>
              <Button onClick={onRefresh} variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                <RefreshCw className="h-4 w-4 mr-2" />
                Check Backend
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">📊 System Overview</h2>
        <Button onClick={onRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_products.toLocaleString()}</div>
            <p className="text-xs text-blue-100">Active electrical items</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warehouses</CardTitle>
            <Warehouse className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_warehouses}</div>
            <p className="text-xs text-green-100">Connected locations</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <ShoppingCart className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.today_sales_count}</div>
            <p className="text-xs text-orange-100">
              ${data.today_sales_revenue.toLocaleString()} revenue
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Today</CardTitle>
            <TrendingUp className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(data.today_sales_revenue * 0.25).toLocaleString()}
            </div>
            <p className="text-xs text-purple-100">Estimated gross profit</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className={data.low_stock_alerts > 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
            <AlertTriangle className={data.low_stock_alerts > 0 ? "h-4 w-4 text-red-500" : "h-4 w-4 text-green-500"} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.low_stock_alerts}</div>
            <p className="text-xs text-gray-600">Items below minimum level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Transfers</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pending_transfers}</div>
            <p className="text-xs text-gray-600">Inter-warehouse transfers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Packing</CardTitle>
            <Package className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pending_packing}</div>
            <p className="text-xs text-gray-600">Orders awaiting packing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Accounts</CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overdue_receivables + data.overdue_payables}
            </div>
            <p className="text-xs text-gray-600">
              {data.overdue_receivables}R / {data.overdue_payables}P
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Recent Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recent_sales.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent sales</p>
            ) : (
              <div className="space-y-3">
                {data.recent_sales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{sale.sale_number}</p>
                      <p className="text-sm text-gray-600">
                        {sale.customer_name || 'Walk-in Customer'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {sale.sale_date.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        ${sale.total_amount.toFixed(2)}
                      </p>
                      <Badge variant={sale.status === 'COMPLETED' ? 'default' : 'secondary'}>
                        {sale.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Selling Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.top_selling_products.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No sales data available</p>
            ) : (
              <div className="space-y-3">
                {data.top_selling_products.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{product.product_name}</p>
                      <p className="text-sm text-gray-600">
                        {product.quantity_sold} units sold
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">
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
    </div>
  );
}
