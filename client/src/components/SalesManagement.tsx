
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, ShoppingCart, Calendar, Truck } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Sale, CreateSaleInput, Product, Warehouse, User } from '../../../server/src/schema';

export function SalesManagement() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pos');
  const [selectedCashierId, setSelectedCashierId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<CreateSaleInput>({
    warehouse_id: 0,
    customer_name: null,
    customer_contact: null,
    sale_type: 'RETAIL',
    tracking_number: null,
    notes: null,
    items: []
  });

  const [currentItem, setCurrentItem] = useState({
    product_id: 0,
    quantity: 1,
    unit_price: 0,
    discount_amount: 0
  });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [salesData, productsData, warehousesData, usersData] = await Promise.all([
        trpc.getSales.query({}),
        // Fetch only active products for sales
        trpc.getProducts.query({ is_active: true }),
        trpc.getWarehouses.query(),
        trpc.getUsers.query()
      ]);
      setSales(salesData);
      setProducts(productsData);
      setWarehouses(warehousesData);
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddItem = () => {
    if (currentItem.product_id === 0) return;
    
    const product = products.find((p: Product) => p.id === currentItem.product_id);
    if (!product) return;

    const price = formData.sale_type === 'WHOLESALE' ? product.wholesale_price : product.retail_price;
    
    setFormData((prev: CreateSaleInput) => ({
      ...prev,
      items: [...prev.items, {
        ...currentItem,
        unit_price: currentItem.unit_price || price
      }]
    }));

    setCurrentItem({
      product_id: 0,
      quantity: 1,
      unit_price: 0,
      discount_amount: 0
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) return;

    try {
      const saleData = selectedCashierId ? { ...formData, cashierId: selectedCashierId } : formData;
      const response = await trpc.createSale.mutate(saleData);
      setSales((prev: Sale[]) => [...prev, response]);
      setFormData({
        warehouse_id: 0,
        customer_name: null,
        customer_contact: null,
        sale_type: 'RETAIL',
        tracking_number: null,
        notes: null,
        items: []
      });
      setSelectedCashierId(null);
    } catch (error) {
      console.error('Failed to create sale:', error);
    }
  };

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => {
      return total + (item.quantity * item.unit_price - item.discount_amount);
    }, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-green-500" />
            Sales Management
          </h2>
          <p className="text-gray-600">Process sales for physical store and online channels</p>
        </div>
      </div>

      {/* Sales Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pos" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            POS System
          </TabsTrigger>
          <TabsTrigger value="online" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Online Orders
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Sales History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pos">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* POS Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  🏪 Physical Store POS
                </CardTitle>
                <CardDescription>
                  Process in-store retail and wholesale sales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="warehouse">Warehouse/Store *</Label>
                      <Select
                        value={formData.warehouse_id === 0 ? '' : formData.warehouse_id.toString()}
                        onValueChange={(value: string) =>
                          setFormData((prev: CreateSaleInput) => ({ 
                            ...prev, 
                            warehouse_id: parseInt(value) 
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select warehouse" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.filter((w: Warehouse) => w.type === 'PHYSICAL').map((warehouse: Warehouse) => (
                            <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                              {warehouse.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="sale_type">Sale Type *</Label>
                      <Select
                        value={formData.sale_type}
                        onValueChange={(value: 'RETAIL' | 'WHOLESALE' | 'ONLINE') =>
                          setFormData((prev: CreateSaleInput) => ({ ...prev, sale_type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RETAIL">🛒 Retail</SelectItem>
                          <SelectItem value="WHOLESALE">📦 Wholesale</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="salesperson">Salesperson *</Label>
                      <Select
                        value={selectedCashierId === null ? '' : selectedCashierId.toString()}
                        onValueChange={(value: string) =>
                          setSelectedCashierId(parseInt(value))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a salesperson" />
                        </SelectTrigger>
                        <SelectContent>
                          {users
                            .filter((user: User) => 
                              ['CASHIER', 'MANAGER', 'APP_ADMIN'].includes(user.role)
                            )
                            .map((user: User) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.full_name} ({user.role})
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                    </div>

                    <div></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customer_name">Customer Name</Label>
                      <Input
                        id="customer_name"
                        placeholder="Optional"
                        value={formData.customer_name || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateSaleInput) => ({
                            ...prev,
                            customer_name: e.target.value || null
                          }))
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="customer_contact">Contact</Label>
                      <Input
                        id="customer_contact"
                        placeholder="Phone/Email"
                        value={formData.customer_contact || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateSaleInput) => ({
                            ...prev,
                            customer_contact: e.target.value || null
                          }))
                        }
                      />
                    </div>
                  </div>

                  {/* Add Item Section */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium mb-3">Add Items</h4>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <Label htmlFor="product">Product *</Label>
                        <Select
                          value={currentItem.product_id === 0 ? '' : currentItem.product_id.toString()}
                          onValueChange={(value: string) => {
                            const productId = parseInt(value);
                            const product = products.find((p: Product) => p.id === productId);
                            const price = formData.sale_type === 'WHOLESALE' 
                              ? product?.wholesale_price || 0
                              : product?.retail_price || 0;
                            
                            setCurrentItem(prev => ({
                              ...prev,
                              product_id: productId,
                              unit_price: price
                            }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product: Product) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.name} - Rp {(formData.sale_type === 'WHOLESALE' ? product.wholesale_price : product.retail_price).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          placeholder="1"
                          value={currentItem.quantity}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setCurrentItem(prev => ({
                              ...prev,
                              quantity: parseInt(e.target.value) || 1
                            }))
                          }
                          min="1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <Label htmlFor="unit_price">Unit Price (Rp)</Label>
                        <Input
                          id="unit_price"
                          type="number"
                          placeholder="0.00"
                          value={currentItem.unit_price}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setCurrentItem(prev => ({
                              ...prev,
                              unit_price: parseFloat(e.target.value) || 0
                            }))
                          }
                          step="0.01"
                          min="0"
                        />
                      </div>

                      <div>
                        <Label htmlFor="discount">Item Discount (Rp)</Label>
                        <Input
                          id="discount"
                          type="number"
                          placeholder="0.00"
                          value={currentItem.discount_amount}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setCurrentItem(prev => ({
                              ...prev,
                              discount_amount: parseFloat(e.target.value) || 0
                            }))
                          }
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={handleAddItem}
                      variant="outline"
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={formData.items.length === 0 || formData.warehouse_id === 0 || selectedCashierId === null}
                  >
                    Complete Sale - Rp {calculateTotal().toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Current Sale Items */}
            <Card>
              <CardHeader>
                <CardTitle>🛒 Current Sale</CardTitle>
              </CardHeader>
              <CardContent>
                {formData.items.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No items added yet</p>
                ) : (
                  <div className="space-y-3">
                    {formData.items.map((item, index) => {
                      const product = products.find((p: Product) => p.id === item.product_id);
                      const lineTotal = item.quantity * item.unit_price - item.discount_amount;
                      
                      return (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{product?.name}</p>
                            <p className="text-sm text-gray-600">
                              {item.quantity} × Rp {item.unit_price.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              {item.discount_amount > 0 && ` - Rp ${item.discount_amount.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">Rp {lineTotal.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setFormData((prev: CreateSaleInput) => ({
                                  ...prev,
                                  items: prev.items.filter((_, i) => i !== index)
                                }));
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        <p className="text-lg font-bold">Total:</p>
                        <p className="text-xl font-bold text-green-600">
                          Rp {calculateTotal().toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      {formData.sale_type === 'WHOLESALE' && (
                        <p className="text-sm text-blue-600">
                          💰 Commission: Rp {(calculateTotal() * 0.05).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (5%)
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="online">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                🌐 Online Order Entry
              </CardTitle>
              <CardDescription>
                Manually enter orders from e-commerce platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="online_warehouse">Online Warehouse *</Label>
                    <Select
                      value={formData.warehouse_id === 0 ? '' : formData.warehouse_id.toString()}
                      onValueChange={(value: string) =>
                        setFormData((prev: CreateSaleInput) => ({ 
                          ...prev, 
                          warehouse_id: parseInt(value) 
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.filter((w: Warehouse) => w.type === 'ONLINE').map((warehouse: Warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                            {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="tracking_number">Tracking Number *</Label>
                    <Input
                      id="tracking_number"
                      placeholder="e.g., AMZ123456789"
                      value={formData.tracking_number || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateSaleInput) => ({
                          ...prev,
                          tracking_number: e.target.value || null,
                          sale_type: 'ONLINE'
                        }))
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="online_customer">Customer Name *</Label>
                    <Input
                      id="online_customer"
                      placeholder="Customer name"
                      value={formData.customer_name || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateSaleInput) => ({
                          ...prev,
                          customer_name: e.target.value || null
                        }))
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="customer_contact_online">Customer Contact</Label>
                  <Input
                    id="customer_contact_online"
                    placeholder="Email or phone"
                    value={formData.customer_contact || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateSaleInput) => ({
                        ...prev,
                        customer_contact: e.target.value || null
                      }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Order Notes</Label>
                  <Input
                    id="notes"
                    placeholder="Platform, special instructions, etc."
                    value={formData.notes || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateSaleInput) => ({
                        ...prev,
                        notes: e.target.value || null
                      }))
                    }
                  />
                </div>

                <p className="text-sm text-gray-600">
                  💡 Use the same item addition process as POS system above. Online orders will be automatically queued for packing.
                </p>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={formData.items.length === 0 || formData.warehouse_id === 0 || !formData.tracking_number || !formData.customer_name}
                >
                  Create Online Order - Rp {calculateTotal().toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Sales History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading sales...</p>
                </div>
              ) : sales.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No sales recorded yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sale #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Tracking</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale: Sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-mono">{sale.sale_number}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {sale.customer_name || 'Walk-in Customer'}
                            </p>
                            {sale.customer_contact && (
                              <p className="text-sm text-gray-500">{sale.customer_contact}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={sale.sale_type === 'RETAIL' ? 'default' : 
                                   sale.sale_type === 'WHOLESALE' ? 'secondary' : 'outline'}
                          >
                            {sale.sale_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={sale.status === 'COMPLETED' ? 'default' : 'secondary'}>
                            {sale.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-green-600">
                          Rp {sale.total_amount.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>{sale.sale_date.toLocaleDateString()}</TableCell>
                        <TableCell>
                          {sale.tracking_number && (
                            <Badge variant="outline" className="font-mono">
                              {sale.tracking_number}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
