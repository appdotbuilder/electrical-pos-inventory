import { AuthProvider, useAuth } from '@/components/AuthContext';
import { LoginPage } from '@/components/LoginPage';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Package, Warehouse, ShoppingCart, TrendingUp, DollarSign, FileText, Users } from 'lucide-react';
import { useState } from 'react';

function AppContent() {
  const { isAuthenticated, isLoading, user, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

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
    return (
      <LoginPage onLogin={() => {
        // The AuthProvider will handle the state updates
      }} />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header />
      
      <div className="container mx-auto p-6">
        {/* Main Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-auto w-full bg-white shadow-sm border overflow-x-auto">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            
            {(hasRole(['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER']) || hasRole('WAREHOUSE')) && (
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Products
              </TabsTrigger>
            )}
            
            {(hasRole(['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER']) || hasRole('WAREHOUSE')) && (
              <TabsTrigger value="inventory" className="flex items-center gap-2">
                <Warehouse className="h-4 w-4" />
                Inventory
              </TabsTrigger>
            )}
            
            {(hasRole(['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER']) || hasRole('CASHIER')) && (
              <TabsTrigger value="sales" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Sales
              </TabsTrigger>
            )}
            
            {(hasRole(['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER']) || hasRole('WAREHOUSE')) && (
              <TabsTrigger value="transfers" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Transfers
              </TabsTrigger>
            )}
            
            {hasRole(['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER', 'WAREHOUSE']) && (
              <TabsTrigger value="packing" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Packing
              </TabsTrigger>
            )}
            
            {hasRole(['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER']) && (
              <TabsTrigger value="accounts" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Accounts
              </TabsTrigger>
            )}
            
            {hasRole(['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER']) && (
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Reports
              </TabsTrigger>
            )}
            
            {hasRole(['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER']) && (
              <TabsTrigger value="warehouses" className="flex items-center gap-2">
                <Warehouse className="h-4 w-4" />
                Warehouses
              </TabsTrigger>
            )}
            
            {hasRole(['SYSTEM_ADMIN', 'APP_ADMIN']) && (
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>

          {(hasRole(['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER']) || hasRole('WAREHOUSE')) && (
            <TabsContent value="products">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-semibold mb-2">Product Management</h3>
                <p className="text-gray-600">
                  Manage your electrical products, SKUs, pricing, and categories.
                </p>
                <Badge className="mt-4">Coming Soon</Badge>
              </div>
            </TabsContent>
          )}

          {(hasRole(['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER']) || hasRole('WAREHOUSE')) && (
            <TabsContent value="inventory">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏪</div>
                <h3 className="text-xl font-semibold mb-2">Inventory Management</h3>
                <p className="text-gray-600">
                  Track stock levels across warehouses and manage reorder points.
                </p>
                <Badge className="mt-4">Coming Soon</Badge>
              </div>
            </TabsContent>
          )}

          {(hasRole(['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER']) || hasRole('CASHIER')) && (
            <TabsContent value="sales">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💰</div>
                <h3 className="text-xl font-semibold mb-2">Sales Management</h3>
                <p className="text-gray-600">
                  Process retail, wholesale, and online sales with commission tracking.
                </p>
                {hasRole('CASHIER') && user?.commission_rate && (
                  <Badge className="mt-4 bg-green-100 text-green-800">
                    Your Commission: {user.commission_rate}%
                  </Badge>
                )}
                <Badge className="mt-4 ml-2">Coming Soon</Badge>
              </div>
            </TabsContent>
          )}

          {(hasRole(['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER']) || hasRole('WAREHOUSE')) && (
            <TabsContent value="transfers">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔄</div>
                <h3 className="text-xl font-semibold mb-2">Stock Transfers</h3>
                <p className="text-gray-600">
                  Manage inter-warehouse stock transfers and track shipments.
                </p>
                <Badge className="mt-4">Coming Soon</Badge>
              </div>
            </TabsContent>
          )}

          {hasRole(['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER', 'WAREHOUSE']) && (
            <TabsContent value="packing">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-semibold mb-2">Packing Management</h3>
                <p className="text-gray-600">
                  Track packing progress and manage shipments for online orders.
                </p>
                <Badge className="mt-4">Coming Soon</Badge>
              </div>
            </TabsContent>
          )}

          {hasRole(['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER']) && (
            <TabsContent value="accounts">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💸</div>
                <h3 className="text-xl font-semibold mb-2">Accounts Management</h3>
                <p className="text-gray-600">
                  Manage accounts receivable and payable, track payments.
                </p>
                <Badge className="mt-4">Coming Soon</Badge>
              </div>
            </TabsContent>
          )}

          {hasRole(['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER']) && (
            <TabsContent value="reports">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold mb-2">Reports & Analytics</h3>
                <p className="text-gray-600">
                  Generate sales reports, profit analysis, and business insights.
                </p>
                <Badge className="mt-4">Coming Soon</Badge>
              </div>
            </TabsContent>
          )}

          {hasRole(['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER']) && (
            <TabsContent value="warehouses">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏭</div>
                <h3 className="text-xl font-semibold mb-2">Warehouse Management</h3>
                <p className="text-gray-600">
                  Configure warehouses, assign managers, and set up locations.
                </p>
                <Badge className="mt-4">Coming Soon</Badge>
              </div>
            </TabsContent>
          )}

          {hasRole(['SYSTEM_ADMIN', 'APP_ADMIN']) && (
            <TabsContent value="users">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-xl font-semibold mb-2">User Management</h3>
                <p className="text-gray-600">
                  Manage user accounts, roles, and permissions.
                </p>
                <Badge className="mt-4">Coming Soon</Badge>
              </div>
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