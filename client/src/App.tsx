import { AuthProvider, useAuth } from '@/components/AuthContext';
import { LoginPage } from '@/components/LoginPage';
import { RegisterPage } from '@/components/RegisterPage';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { ProductManagement } from '@/components/ProductManagement';
import { InventoryManagement } from '@/components/InventoryManagement';
import { SalesManagement } from '@/components/SalesManagement';
import { StockTransfers } from '@/components/StockTransfers';
import { PackingManagement } from '@/components/PackingManagement';
import { AccountsManagement } from '@/components/AccountsManagement';
import { WarehouseManagement } from '@/components/WarehouseManagement';
import { UserManagement } from '@/components/UserManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Package, Warehouse, ShoppingCart, TrendingUp, DollarSign, FileText, Users } from 'lucide-react';
import { useState } from 'react';

function AppContent() {
  const { isAuthenticated, isLoading, user, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showRegister, setShowRegister] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⚡</div>
          <p className="text-gray-600">Loading ElectroStore POS...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (showRegister) {
      return (
        <RegisterPage 
          onRegisterSuccess={() => {
            setShowRegister(false);
          }}
          onBackToLogin={() => {
            setShowRegister(false);
          }}
        />
      );
    }
    
    return (
      <LoginPage 
        onLogin={() => {
          // The AuthProvider will handle the state updates
        }}
        onSwitchToRegister={() => {
          setShowRegister(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header />
      
      <div className="container mx-auto p-6">
        {/* Main Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <TabsList className="flex items-center w-full bg-gray-50 p-3 space-x-2 overflow-x-auto rounded-lg border-b">
              <TabsTrigger 
                value="dashboard" 
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium whitespace-nowrap data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-blue-50 hover:shadow-sm border border-transparent data-[state=active]:border-blue-500"
              >
                <TrendingUp className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              
              {hasRole(['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER', 'WAREHOUSE']) && (
                <TabsTrigger 
                  value="products" 
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium whitespace-nowrap data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-blue-50 hover:shadow-sm border border-transparent data-[state=active]:border-blue-500"
                >
                  <Package className="h-4 w-4" />
                  Products
                </TabsTrigger>
              )}
              
              {hasRole(['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER', 'WAREHOUSE']) && (
                <TabsTrigger 
                  value="inventory" 
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium whitespace-nowrap data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-blue-50 hover:shadow-sm border border-transparent data-[state=active]:border-blue-500"
                >
                  <Warehouse className="h-4 w-4" />
                  Inventory
                </TabsTrigger>
              )}
              
              {hasRole(['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER', 'CASHIER']) && (
                <TabsTrigger 
                  value="sales" 
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium whitespace-nowrap data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-green-50 hover:shadow-sm border border-transparent data-[state=active]:border-green-500"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Sales
                </TabsTrigger>
              )}
              
              {hasRole(['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER', 'WAREHOUSE']) && (
                <TabsTrigger 
                  value="transfers" 
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium whitespace-nowrap data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-purple-50 hover:shadow-sm border border-transparent data-[state=active]:border-purple-500"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Transfers
                </TabsTrigger>
              )}
              
              {hasRole(['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER', 'WAREHOUSE']) && (
                <TabsTrigger 
                  value="packing" 
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium whitespace-nowrap data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-orange-50 hover:shadow-sm border border-transparent data-[state=active]:border-orange-500"
                >
                  <Package className="h-4 w-4" />
                  Packing
                </TabsTrigger>
              )}
              
              {hasRole(['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER']) && (
                <TabsTrigger 
                  value="accounts" 
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium whitespace-nowrap data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-emerald-50 hover:shadow-sm border border-transparent data-[state=active]:border-emerald-500"
                >
                  <DollarSign className="h-4 w-4" />
                  Accounts
                </TabsTrigger>
              )}
              
              {hasRole(['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER']) && (
                <TabsTrigger 
                  value="reports" 
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium whitespace-nowrap data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-indigo-50 hover:shadow-sm border border-transparent data-[state=active]:border-indigo-500"
                >
                  <FileText className="h-4 w-4" />
                  Reports
                </TabsTrigger>
              )}
              
              {hasRole(['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER']) && (
                <TabsTrigger 
                  value="warehouses" 
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium whitespace-nowrap data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-teal-50 hover:shadow-sm border border-transparent data-[state=active]:border-teal-500"
                >
                  <Warehouse className="h-4 w-4" />
                  Warehouses
                </TabsTrigger>
              )}
              
              {hasRole(['SYSTEM_ADMIN', 'APP_ADMIN']) && (
                <TabsTrigger 
                  value="users" 
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium whitespace-nowrap data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-red-50 hover:shadow-sm border border-transparent data-[state=active]:border-red-500"
                >
                  <Users className="h-4 w-4" />
                  Users
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>

          {hasRole(['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER', 'WAREHOUSE']) && (
            <TabsContent value="products">
              <ProductManagement />
            </TabsContent>
          )}

          {hasRole(['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER', 'WAREHOUSE']) && (
            <TabsContent value="inventory">
              <InventoryManagement />
            </TabsContent>
          )}

          {hasRole(['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER', 'CASHIER']) && (
            <TabsContent value="sales">
              <SalesManagement />
            </TabsContent>
          )}

          {hasRole(['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER', 'WAREHOUSE']) && (
            <TabsContent value="transfers">
              <StockTransfers />
            </TabsContent>
          )}

          {hasRole(['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER', 'WAREHOUSE']) && (
            <TabsContent value="packing">
              <PackingManagement />
            </TabsContent>
          )}

          {hasRole(['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER']) && (
            <TabsContent value="accounts">
              <AccountsManagement />
            </TabsContent>
          )}

          {hasRole(['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER']) && (
            <TabsContent value="reports">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <FileText className="h-6 w-6 text-indigo-500" />
                  <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
                </div>
                <p className="text-gray-600">Generate comprehensive business reports and insights</p>
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-xl font-semibold mb-2">Advanced Reporting Suite</h3>
                  <p className="text-gray-600">
                    Sales reports, profit analysis, inventory insights, and performance analytics.
                  </p>
                  <Badge className="mt-4 bg-indigo-100 text-indigo-700">Coming Soon</Badge>
                </div>
              </div>
            </TabsContent>
          )}

          {hasRole(['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER']) && (
            <TabsContent value="warehouses">
              <WarehouseManagement />
            </TabsContent>
          )}

          {hasRole(['SYSTEM_ADMIN', 'APP_ADMIN']) && (
            <TabsContent value="users">
              <UserManagement />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;