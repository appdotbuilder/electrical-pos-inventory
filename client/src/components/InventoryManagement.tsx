
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Package, Warehouse, Search } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Inventory, Product, Warehouse as WarehouseType, UpdateInventoryInput } from '../../../server/src/schema';

interface InventoryWithProduct extends Inventory {
  product?: Product;
  warehouse?: WarehouseType;
}

export function InventoryManagement() {
  const [inventory, setInventory] = useState<InventoryWithProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [updateForm, setUpdateForm] = useState<UpdateInventoryInput>({
    product_id: 0,
    warehouse_id: 0,
    quantity: 0
  });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const warehouseId = selectedWarehouse === 'all' ? undefined : parseInt(selectedWarehouse);
      
      const [inventoryData, productsData, warehousesData] = await Promise.all([
        trpc.getInventory.query({ warehouseId }),
        trpc.getProducts.query({ is_active: true }),
        trpc.getWarehouses.query()
      ]);
      
      // Enhance inventory with product and warehouse data
      const enhancedInventory = inventoryData.map((inv: Inventory) => ({
        ...inv,
        product: productsData.find((p: Product) => p.id === inv.product_id),
        warehouse: warehousesData.find((w: WarehouseType) => w.id === inv.warehouse_id)
      }));
      
      setInventory(enhancedInventory);
      setProducts(productsData);
      setWarehouses(warehousesData);
    } catch (error) {
      console.error('Failed to load inventory data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedWarehouse]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (updateForm.product_id === 0 || updateForm.warehouse_id === 0) return;

    try {
      await trpc.updateInventory.mutate(updateForm);
      loadData(); // Refresh inventory data
      setUpdateForm({
        product_id: 0,
        warehouse_id: 0,
        quantity: 0
      });
    } catch (error) {
      console.error('Failed to update inventory:', error);
    }
  };

  const filteredInventory = inventory.filter((item: InventoryWithProduct) => {
    const matchesSearch = item.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.product?.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const lowStockItems = filteredInventory.filter((item: InventoryWithProduct) => 
    item.product && item.quantity <= item.product.minimum_stock_level
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-500" />
            Inventory Management
          </h2>
          <p className="text-gray-600">Monitor stock levels across all warehouses</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">{filteredInventory.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock Alerts</p>
                <p className="text-2xl font-bold text-red-600">{lowStockItems.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold">
                  ${filteredInventory.reduce((total, item) => 
                    total + (item.quantity * (item.product?.cost_price || 0)), 0
                  ).toFixed(2)}
                </p>
              </div>
              <Package className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Reserved Stock</p>
                <p className="text-2xl font-bold">
                  {filteredInventory.reduce((total, item) => total + item.reserved_quantity, 0)}
                </p>
              </div>
              <Warehouse className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>📍 Filters & Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="warehouse-filter">Warehouse</Label>
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Warehouses</SelectItem>
                  {warehouses.map((warehouse: WarehouseType) => (
                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                      {warehouse.name} ({warehouse.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="search">Search Products</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search by name or SKU..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Update Inventory */}
        <Card>
          <CardHeader>
            <CardTitle>📦 Update Stock Levels</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateInventory} className="space-y-4">
              <div>
                <Label htmlFor="product">Product</Label>
                <Select
                  value={updateForm.product_id.toString()}
                  onValueChange={(value: string) =>
                    setUpdateForm((prev: UpdateInventoryInput) => ({ 
                      ...prev, 
                      product_id: parseInt(value) 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product: Product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name} ({product.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="warehouse">Warehouse</Label>
                <Select
                  value={updateForm.warehouse_id.toString()}
                  onValueChange={(value: string) =>
                    setUpdateForm((prev: UpdateInventoryInput) => ({ 
                      ...prev, 
                      warehouse_id: parseInt(value) 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse: WarehouseType) => (
                      <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity">New Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={updateForm.quantity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUpdateForm((prev: UpdateInventoryInput) => ({ 
                      ...prev, 
                      quantity: parseInt(e.target.value) || 0 
                    }))
                  }
                  min="0"
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                Update Inventory
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              ⚠️ Low Stock Alerts ({lowStockItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockItems.map((item: InventoryWithProduct) => (
                <div key={`${item.product_id}-${item.warehouse_id}`} className="bg-white p-3 rounded-lg border">
                  <p className="font-medium">{item.product?.name}</p>
                  <p className="text-sm text-gray-600">{item.warehouse?.name}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-red-600 font-bold">
                      {item.quantity} / {item.product?.minimum_stock_level}
                    </span>
                    <Badge variant="destructive">Low Stock</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            Inventory Levels ({filteredInventory.length} items)
          </CardTitle>
          <CardDescription>
            Current stock levels across all locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading inventory...</p>
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No inventory items found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Min Level</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item: InventoryWithProduct) => {
                  const isLowStock = item.product && item.quantity <= item.product.minimum_stock_level;
                  const value = item.quantity * (item.product?.cost_price || 0);

                  return (
                    <TableRow key={`${item.product_id}-${item.warehouse_id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.product?.name}</p>
                          <p className="text-sm text-gray-500">{item.product?.description}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{item.product?.sku}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.warehouse?.name}</p>
                          <Badge variant="outline" className="text-xs">
                            {item.warehouse?.type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-bold ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                          {item.quantity}
                        </span>
                      </TableCell>
                      <TableCell>{item.reserved_quantity}</TableCell>
                      <TableCell>{item.product?.minimum_stock_level}</TableCell>
                      <TableCell>${value.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={isLowStock ? 'destructive' : 'default'}>
                          {isLowStock ? 'Low Stock' : 'In Stock'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {item.last_updated.toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
