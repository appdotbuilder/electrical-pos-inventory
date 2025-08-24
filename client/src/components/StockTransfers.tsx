
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, ArrowRightLeft, Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { StockTransfer, CreateStockTransferInput, Product, Warehouse } from '../../../server/src/schema';

export function StockTransfers() {
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [formData, setFormData] = useState<CreateStockTransferInput>({
    from_warehouse_id: 0,
    to_warehouse_id: 0,
    notes: null,
    items: []
  });

  const [currentItem, setCurrentItem] = useState({
    product_id: 0,
    requested_quantity: 1
  });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const statusParam = statusFilter === 'all' ? undefined : statusFilter;
      
      const [transfersData, productsData, warehousesData] = await Promise.all([
        trpc.getStockTransfers.query({ status: statusParam }),
        trpc.getProducts.query({ is_active: true }),
        trpc.getWarehouses.query()
      ]);
      
      setTransfers(transfersData);
      setProducts(productsData);
      setWarehouses(warehousesData);
    } catch (error) {
      console.error('Failed to load transfer data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddItem = () => {
    if (currentItem.product_id === 0) return;
    
    setFormData((prev: CreateStockTransferInput) => ({
      ...prev,
      items: [...prev.items, currentItem]
    }));

    setCurrentItem({
      product_id: 0,
      requested_quantity: 1
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0 || formData.from_warehouse_id === formData.to_warehouse_id) return;

    try {
      // For this demo, we'll use a fixed user ID (1) as the requester
      const response = await trpc.createStockTransfer.mutate({
        ...formData,
        requestedBy: 1
      });
      setTransfers((prev: StockTransfer[]) => [...prev, response]);
      setFormData({
        from_warehouse_id: 0,
        to_warehouse_id: 0,
        notes: null,
        items: []
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create stock transfer:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'IN_TRANSIT':
        return <ArrowRightLeft className="h-4 w-4 text-blue-500" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string): 'default' | 'destructive' | 'secondary' => {
    switch (status) {
      case 'PENDING':
        return 'secondary';
      case 'IN_TRANSIT':
        return 'default';
      case 'COMPLETED':
        return 'default';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ArrowRightLeft className="h-6 w-6 text-blue-500" />
            Stock Transfers
          </h2>
          <p className="text-gray-600">Manage inter-warehouse stock movements</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Transfer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Stock Transfer</DialogTitle>
              <DialogDescription>
                Move inventory between warehouses
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="from_warehouse">From Warehouse *</Label>
                  <Select
                    value={formData.from_warehouse_id === 0 ? '' : formData.from_warehouse_id.toString()}
                    onValueChange={(value: string) =>
                      setFormData((prev: CreateStockTransferInput) => ({ 
                        ...prev, 
                        from_warehouse_id: parseInt(value) 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse: Warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                          {warehouse.name} ({warehouse.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="to_warehouse">To Warehouse *</Label>
                  <Select
                    value={formData.to_warehouse_id === 0 ? '' : formData.to_warehouse_id.toString()}
                    onValueChange={(value: string) =>
                      setFormData((prev: CreateStockTransferInput) => ({ 
                        ...prev, 
                        to_warehouse_id: parseInt(value) 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.filter((w: Warehouse) => w.id !== formData.from_warehouse_id).map((warehouse: Warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                          {warehouse.name} ({warehouse.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Transfer Notes</Label>
                <Input
                  id="notes"
                  placeholder="Reason for transfer, special instructions, etc."
                  value={formData.notes || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateStockTransferInput) => ({
                      ...prev,
                      notes: e.target.value || null
                    }))
                  }
                />
              </div>

              {/* Add Items Section */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-3">Add Items to Transfer</h4>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <Select
                    value={currentItem.product_id === 0 ? '' : currentItem.product_id.toString()}
                    onValueChange={(value: string) =>
                      setCurrentItem(prev => ({
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

                  <Input
                    type="number"
                    placeholder="Quantity"
                    value={currentItem.requested_quantity}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCurrentItem(prev => ({
                        ...prev,
                        requested_quantity: parseInt(e.target.value) || 1
                      }))
                    }
                    min="1"
                  />
                </div>

                <Button
                  type="button"
                  onClick={handleAddItem}
                  variant="outline"
                  className="w-full"
                  disabled={currentItem.product_id === 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {/* Current Items */}
              {formData.items.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Items to Transfer ({formData.items.length})</h4>
                  <div className="space-y-2">
                    {formData.items.map((item, index) => {
                      const product = products.find((p: Product) => p.id === item.product_id);
                      return (
                        <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                          <div>
                            <p className="font-medium">{product?.name}</p>
                            <p className="text-sm text-gray-500">Quantity: {item.requested_quantity}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setFormData((prev: CreateStockTransferInput) => ({
                                ...prev,
                                items: prev.items.filter((_, i) => i !== index)
                              }));
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <Button
                type="submit" 
                className="w-full"
                disabled={formData.items.length === 0 || formData.from_warehouse_id === formData.to_warehouse_id}
              >
                Create Transfer Request
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="status-filter">Filter by Status:</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transfers</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transfers</p>
                <p className="text-2xl font-bold">{transfers.length}</p>
              </div>
              <ArrowRightLeft className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {transfers.filter((t: StockTransfer) => t.status === 'PENDING').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Transit</p>
                <p className="text-2xl font-bold text-blue-600">
                  {transfers.filter((t: StockTransfer) => t.status === 'IN_TRANSIT').length}
                </p>
              </div>
              <ArrowRightLeft className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {transfers.filter((t: StockTransfer) => t.status === 'COMPLETED').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transfers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            📦 Stock Transfer History
          </CardTitle>
          <CardDescription>
            Track inter-warehouse inventory movements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading transfers...</p>
            </div>
          ) : transfers.length === 0 ? (
            <div className="text-center py-8">
              <ArrowRightLeft className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No stock transfers found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transfer #</TableHead>
                  <TableHead>From → To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Transfer Date</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map((transfer: StockTransfer) => {
                  const fromWarehouse = warehouses.find((w: Warehouse) => w.id === transfer.from_warehouse_id);
                  const toWarehouse = warehouses.find((w: Warehouse) => w.id === transfer.to_warehouse_id);

                  return (
                    <TableRow key={transfer.id}>
                      <TableCell className="font-mono">{transfer.transfer_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{fromWarehouse?.name}</span>
                          <ArrowRightLeft className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{toWarehouse?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(transfer.status)}
                          <Badge variant={getStatusColor(transfer.status)}>
                            {transfer.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {transfer.created_at.toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {transfer.transfer_date ? transfer.transfer_date.toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        {transfer.notes ? (
                          <span className="text-sm">{transfer.notes}</span>
                        ) : (
                          <span className="text-gray-400 text-sm">No notes</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                          {transfer.status === 'PENDING' && (
                            <Button variant="outline" size="sm">
                              Approve
                            </Button>
                          )}
                        </div>
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
