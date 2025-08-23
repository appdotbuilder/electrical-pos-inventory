
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, FileText, TrendingUp, Download, DollarSign, Package } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { SalesReportInput, ProfitReportInput, Warehouse } from '../../../server/src/schema';
import type { SalesReportData } from '../../../server/src/handlers/generate_sales_report';
import type { ProfitReportData } from '../../../server/src/handlers/generate_profit_report';

export function ReportsManagement() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [salesReportData, setSalesReportData] = useState<SalesReportData | null>(null);
  const [profitReportData, setProfitReportData] = useState<ProfitReportData | null>(null);

  const [salesReportFilters, setSalesReportFilters] = useState<SalesReportInput>({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of current month
    end_date: new Date(), // Today
    warehouse_id: null,
    sale_type: null
  });

  const [profitReportFilters, setProfitReportFilters] = useState<ProfitReportInput>({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end_date: new Date(),
    warehouse_id: null,
    product_id: null
  });

  const loadWarehouses = useCallback(async () => {
    try {
      const result = await trpc.getWarehouses.query();
      setWarehouses(result);
    } catch (error) {
      console.error('Failed to load warehouses:', error);
    }
  }, []);

  useEffect(() => {
    loadWarehouses();
  }, [loadWarehouses]);

  const generateSalesReport = async () => {
    try {
      setIsLoading(true);
      const result = await trpc.generateSalesReport.query(salesReportFilters);
      setSalesReportData(result);
    } catch (error) {
      console.error('Failed to generate sales report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateProfitReport = async () => {
    try {
      setIsLoading(true);
      const result = await trpc.generateProfitReport.query(profitReportFilters);
      setProfitReportData(result);
    } catch (error) {
      console.error('Failed to generate profit report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart className="h-6 w-6 text-indigo-500" />
            Reports & Analytics
          </h2>
          <p className="text-gray-600">Generate sales, profit, and inventory reports</p>
        </div>
      </div>

      {/* Report Types */}
      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Sales Reports
          </TabsTrigger>
          <TabsTrigger value="profit" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Profit Reports
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Inventory Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Report Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  📊 Sales Report Generator
                </CardTitle>
                <CardDescription>
                  Generate detailed sales reports by date range and filters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sales_start_date">Start Date</Label>
                    <Input
                      id="sales_start_date"
                      type="date"
                      value={formatDate(salesReportFilters.start_date)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSalesReportFilters((prev: SalesReportInput) => ({
                          ...prev,
                          start_date: new Date(e.target.value)
                        }))
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="sales_end_date">End Date</Label>
                    <Input
                      id="sales_end_date"
                      type="date"
                      value={formatDate(salesReportFilters.end_date)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSalesReportFilters((prev: SalesReportInput) => ({
                          ...prev,
                          end_date: new Date(e.target.value)
                        }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="sales_warehouse">Warehouse (Optional)</Label>
                  <Select
                    value={salesReportFilters.warehouse_id?.toString() || 'all'}
                    onValueChange={(value: string) =>
                      setSalesReportFilters((prev: SalesReportInput) => ({
                        ...prev,
                        warehouse_id: value === 'all' ? null : parseInt(value)
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Warehouses</SelectItem>
                      {warehouses.map((warehouse: Warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                          {warehouse.name} ({warehouse.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sales_type">Sale Type (Optional)</Label>
                  <Select
                    value={salesReportFilters.sale_type || 'all'}
                    onValueChange={(value: string) =>
                      setSalesReportFilters((prev: SalesReportInput) => ({
                        ...prev,
                        sale_type: value === 'all' ? null : value as 'RETAIL' | 'WHOLESALE' | 'ONLINE'
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sale Types</SelectItem>
                      <SelectItem value="RETAIL">Retail</SelectItem>
                      <SelectItem value="WHOLESALE">Wholesale</SelectItem>
                      <SelectItem value="ONLINE">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={generateSalesReport} 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Generating...' : 'Generate Sales Report'}
                </Button>
              </CardContent>
            </Card>

            {/* Sales Report Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  Sales Report Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!salesReportData ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Generate a report to see results</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-600">Total Sales</p>
                        <p className="text-2xl font-bold text-blue-700">
                          {salesReportData.sales_count}
                        </p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-600">Total Revenue</p>
                        <p className="text-2xl font-bold text-green-700">
                          Rp {salesReportData.total_revenue.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-purple-600">Total Profit</p>
                        <p className="text-2xl font-bold text-purple-700">
                          Rp {salesReportData.total_profit.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <p className="text-sm text-orange-600">Average Sale</p>
                        <p className="text-2xl font-bold text-orange-700">
                          Rp {salesReportData.average_sale_value.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Report Period</h4>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                    </div>
                    
                    <p className="text-sm text-gray-600">
                      {salesReportFilters.start_date.toLocaleDateString()} to {salesReportFilters.end_date.toLocaleDateString()}
                    </p>

                    {/* Top Products */}
                    {salesReportData.top_products.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-medium mb-3">🏆 Top Selling Products</h4>
                        <div className="space-y-2">
                          {salesReportData.top_products.slice(0, 5).map((product, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium">{product.product_name}</p>
                                <p className="text-sm text-gray-600">{product.quantity_sold} units</p>
                              </div>
                              <p className="font-bold text-green-600">Rp {product.revenue.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profit">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profit Report Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  💰 Profit Report Generator
                </CardTitle>
                <CardDescription>
                  Analyze gross profit margins and profitability
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="profit_start_date">Start Date</Label>
                    <Input
                      id="profit_start_date"
                      type="date"
                      value={formatDate(profitReportFilters.start_date)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setProfitReportFilters((prev: ProfitReportInput) => ({
                          ...prev,
                          start_date: new Date(e.target.value)
                        }))
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="profit_end_date">End Date</Label>
                    <Input
                      id="profit_end_date"
                      type="date"
                      value={formatDate(profitReportFilters.end_date)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setProfitReportFilters((prev: ProfitReportInput) => ({
                          ...prev,
                          end_date: new Date(e.target.value)
                        }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="profit_warehouse">Warehouse (Optional)</Label>
                  <Select
                    value={profitReportFilters.warehouse_id?.toString() || 'all'}
                    onValueChange={(value: string) =>
                      setProfitReportFilters((prev: ProfitReportInput) => ({
                        ...prev,
                        warehouse_id: value === 'all' ? null : parseInt(value)
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Warehouses</SelectItem>
                      {warehouses.map((warehouse: Warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                          {warehouse.name} ({warehouse.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={generateProfitReport} 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Generating...' : 'Generate Profit Report'}
                </Button>
              </CardContent>
            </Card>

            {/* Profit Report Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Profit Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!profitReportData ? (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Generate a report to see profit analysis</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-600">Gross Profit</p>
                        <p className="text-2xl font-bold text-green-700">
                          Rp {profitReportData.gross_profit.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-600">Profit Margin</p>
                        <p className="text-2xl font-bold text-blue-700">
                          {(profitReportData.profit_margin * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-purple-600">Total Revenue</p>
                        <p className="text-2xl font-bold text-purple-700">
                          Rp {profitReportData.total_revenue.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-sm text-red-600">Total Cost</p>
                        <p className="text-2xl font-bold text-red-700">
                          Rp {profitReportData.total_cost.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Profitability Analysis</h4>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF
                      </Button>
                    </div>

                    {/* Product Breakdown */}
                    {profitReportData.product_breakdown.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-medium mb-3">📈 Most Profitable Products</h4>
                        <div className="space-y-2">
                          {profitReportData.product_breakdown
                            .sort((a, b) => b.profit - a.profit)
                            .slice(0, 5)
                            .map((product, index) => (
                              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <p className="font-medium">{product.product_name}</p>
                                  <p className="text-sm text-gray-600">
                                    {product.quantity_sold} units • {(product.margin * 100).toFixed(1)}% margin
                                  </p>
                                </div>
                                <p className="font-bold text-green-600">Rp {product.profit.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Warehouse Breakdown */}
                    {profitReportData.warehouse_breakdown.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-medium mb-3">🏪 Warehouse Performance</h4>
                        <div className="space-y-2">
                          {profitReportData.warehouse_breakdown.map((warehouse, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium">{warehouse.warehouse_name}</p>
                                <p className="text-sm text-gray-600">
                                  {(warehouse.margin * 100).toFixed(1)}% margin
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-green-600">Rp {warehouse.profit.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                <p className="text-sm text-gray-600">Rp {warehouse.revenue.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} revenue</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                📦 Inventory Reports
              </CardTitle>
              <CardDescription>
                Stock levels, movements, and valuation reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-blue-200">
                  <CardContent className="p-6 text-center">
                    <Package className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Stock Levels Report</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Current inventory levels across all warehouses
                    </p>
                    <Button variant="outline" className="w-full">
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-green-200">
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Stock Movement Report</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Track inventory movements and transfers
                    </p>
                    <Button variant="outline" className="w-full">
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-purple-200">
                  <CardContent className="p-6 text-center">
                    <DollarSign className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Inventory Valuation</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Calculate total inventory value by cost
                    </p>
                    <Button variant="outline" className="w-full">
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-8">
                <h4 className="font-medium mb-4">📋 Quick Inventory Insights</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-yellow-600">Low Stock Items</p>
                    <p className="text-2xl font-bold text-yellow-700">-</p>
                    <p className="text-xs text-gray-500">Items below minimum level</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600">Total SKUs</p>
                    <p className="text-2xl font-bold text-blue-700">-</p>
                    <p className="text-xs text-gray-500">Unique products</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600">Total Value</p>
                    <p className="text-2xl font-bold text-green-700">Rp -</p>
                    <p className="text-xs text-gray-500">At cost price</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-600">Avg. Turnover</p>
                    <p className="text-2xl font-bold text-purple-700">-x</p>
                    <p className="text-xs text-gray-500">Per month</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
