
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Package, Warehouse, ShoppingCart, TrendingUp, DollarSign, FileText } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { ProductManagement } from '@/components/ProductManagement';
import { InventoryManagement } from '@/components/InventoryManagement';
import { SalesManagement } from '@/components/SalesManagement';
import { StockTransfers } from '@/components/StockTransfers';
import { PackingManagement } from '@/components/PackingManagement';
import { AccountsManagement } from '@/components/AccountsManagement';
import { ReportsManagement } from '@/components/ReportsManagement';
import { WarehouseManagement } from '@/components/WarehouseManagement';
import type { DashboardSummary } from '../../server/src/handlers/get_dashboard_summary';

// Demo data for when backend is not available
const getDemoData = (): DashboardSummary => ({
  total_products: 1247,
  total_warehouses: 12,
  low_stock_alerts: 23,
  pending_transfers: 5,
  pending_packing: 8,
  today_sales_count: 47,
  today_sales_revenue: 15420.50,
  overdue_receivables: 3,
  overdue_payables: 1,
  recent_sales: [
    {
      id: 1,
      sale_number: 'SALE-2024-001',
      customer_name: 'ABC Electric Co.',
      total_amount: 450.00,
      sale_date: new Date(),
      status: 'COMPLETED'
    },
    {
      id: 2,
      sale_number: 'SALE-2024-002',
      customer_name: null,
      total_amount: 125.75,
      sale_date: new Date(),
      status: 'COMPLETED'
    },
    {
      id: 3,
      sale_number: 'SALE-2024-003',
      customer_name: 'City Power Solutions',
      total_amount: 890.25,
      sale_date: new Date(),
      status: 'PENDING'
    }
  ],
  top_selling_products: [
    {
      product_name: '12 AWG Copper Wire',
      quantity_sold: 85,
      revenue: 2840.00
    },
    {
      product_name: 'LED Bulb 60W Equivalent',
      quantity_sold: 234,
      revenue: 1872.00
    },
    {
      product_name: 'Circuit Breaker 20A',
      quantity_sold: 45,
      revenue: 1350.00
    }
  ]
});

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await trpc.getDashboardSummary.query();
      setDashboardData(data);
      setBackendAvailable(true);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setBackendAvailable(false);
      
      // Determine error type and set appropriate message
      const errorStr = error instanceof Error ? error.message : String(error);
      if (errorStr.includes('500') || errorStr.includes('Internal Server Error') || 
          errorStr.includes('Unexpected end of JSON input') || 
          errorStr.includes('string did not match the expected pattern')) {
        setErrorMessage('Backend server is not running or not properly configured');
      } else if (errorStr.includes('fetch') || errorStr.includes('connection')) {
        setErrorMessage('Cannot connect to backend server - please check if it\'s running');
      } else {
        setErrorMessage('Backend server error - please check server logs');
      }
      
      // Show demo data after a short delay to demonstrate the UI
      setTimeout(() => {
        setDashboardData(getDemoData());
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardData();
    }
  }, [activeTab, loadDashboardData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                ⚡ ElectroStore POS & Inventory
              </h1>
              <p className="text-gray-600">Complete management system for electrical store operations</p>
              {!backendAvailable && (
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                    🚀 Demo Mode - Showing sample data
                  </Badge>
                  {errorMessage && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      ⚠️ {errorMessage}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {dashboardData && (
                <div className="flex space-x-2">
                  {dashboardData.low_stock_alerts > 0 && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {dashboardData.low_stock_alerts} Low Stock
                    </Badge>
                  )}
                  {dashboardData.pending_transfers > 0 && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {dashboardData.pending_transfers} Pending
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-9 w-full bg-white shadow-sm border">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Warehouse className="h-4 w-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Sales
            </TabsTrigger>
            <TabsTrigger value="transfers" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Transfers
            </TabsTrigger>
            <TabsTrigger value="packing" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Packing
            </TabsTrigger>
            <TabsTrigger value="accounts" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Accounts
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="warehouses" className="flex items-center gap-2">
              <Warehouse className="h-4 w-4" />
              Warehouses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard 
              data={dashboardData} 
              isLoading={isLoading} 
              onRefresh={loadDashboardData}
              backendAvailable={backendAvailable}
              errorMessage={errorMessage}
            />
          </TabsContent>

          <TabsContent value="products">
            <ProductManagement />
          </TabsContent>

          <TabsContent value="inventory">
            <InventoryManagement />
          </TabsContent>

          <TabsContent value="sales">
            <SalesManagement />
          </TabsContent>

          <TabsContent value="transfers">
            <StockTransfers />
          </TabsContent>

          <TabsContent value="packing">
            <PackingManagement />
          </TabsContent>

          <TabsContent value="accounts">
            <AccountsManagement />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsManagement />
          </TabsContent>

          <TabsContent value="warehouses">
            <WarehouseManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
