
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Warehouse, MapPin, Building, Globe } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Warehouse as WarehouseType, CreateWarehouseInput } from '../../../server/src/schema';

export function WarehouseManagement() {
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateWarehouseInput>({
    name: '',
    type: 'PHYSICAL',
    address: null,
    manager_id: null
  });

  const loadWarehouses = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getWarehouses.query();
      setWarehouses(result);
    } catch (error) {
      console.error('Failed to load warehouses:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWarehouses();
  }, [loadWarehouses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await trpc.createWarehouse.mutate(formData);
      setWarehouses((prev: WarehouseType[]) => [...prev, response]);
      setFormData({
        name: '',
        type: 'PHYSICAL',
        address: null,
        manager_id: null
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create warehouse:', error);
    }
  };

  const physicalWarehouses = warehouses.filter((w: WarehouseType) => w.type === 'PHYSICAL');
  const onlineWarehouses = warehouses.filter((w: WarehouseType) => w.type === 'ONLINE');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Warehouse className="h-6 w-6 text-purple-500" />
            Warehouse Management
          </h2>
          <p className="text-gray-600">Manage physical stores and online warehouses</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Warehouse
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Warehouse</DialogTitle>
              <DialogDescription>
                Create a new physical store or online warehouse
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Warehouse Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Main Store, Amazon Warehouse"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateWarehouseInput) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type || 'PHYSICAL'}
                  onValueChange={(value: 'PHYSICAL' | 'ONLINE') =>
                    setFormData((prev: CreateWarehouseInput) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PHYSICAL">🏪 Physical Store</SelectItem>
                    <SelectItem value="ONLINE">🌐 Online Warehouse</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="Physical address (optional)"
                  value={formData.address || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateWarehouseInput) => ({
                      ...prev,
                      address: e.target.value || null
                    }))
                  }
                />
              </div>

              <Button type="submit" className="w-full">
                Create Warehouse
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-100">Total Warehouses</p>
                <p className="text-2xl font-bold">{warehouses.length}</p>
              </div>
              <Warehouse className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-100">Physical Stores</p>
                <p className="text-2xl font-bold">{physicalWarehouses.length}</p>
              </div>
              <Building className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-100">Online Stores</p>
                <p className="text-2xl font-bold">{onlineWarehouses.length}</p>
              </div>
              <Globe className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Physical Stores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            🏪 Physical Stores ({physicalWarehouses.length})
          </CardTitle>
          <CardDescription>
            Brick-and-mortar locations for in-person sales
          </CardDescription>
        </CardHeader>
        <CardContent>
          {physicalWarehouses.length === 0 ? (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No physical stores configured</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {physicalWarehouses.map((warehouse: WarehouseType) => (
                <Card key={warehouse.id} className="border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-lg">{warehouse.name}</h3>
                      <Badge variant={warehouse.is_active ? 'default' : 'secondary'}>
                        {warehouse.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    {warehouse.address && (
                      <div className="flex items-start gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600">{warehouse.address}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mt-3">
                      <span>Created: {warehouse.created_at.toLocaleDateString()}</span>
                      <Building className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Online Warehouses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            🌐 Online Warehouses ({onlineWarehouses.length})
          </CardTitle>
          <CardDescription>
            Virtual warehouses for e-commerce platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          {onlineWarehouses.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No online warehouses configured</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {onlineWarehouses.map((warehouse: WarehouseType) => (
                <Card key={warehouse.id} className="border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-lg">{warehouse.name}</h3>
                      <Badge variant={warehouse.is_active ? 'default' : 'secondary'}>
                        {warehouse.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-600">E-commerce Platform</span>
                    </div>
                    
                    {warehouse.address && (
                      <div className="flex items-start gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600">{warehouse.address}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mt-3">
                      <span>Created: {warehouse.created_at.toLocaleDateString()}</span>
                      <Globe className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Warehouses Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            All Warehouses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading warehouses...</p>
            </div>
          ) : warehouses.length === 0 ? (
            <div className="text-center py-8">
              <Warehouse className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No warehouses configured yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouses.map((warehouse: WarehouseType) => (
                  <TableRow key={warehouse.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {warehouse.type === 'PHYSICAL' ? 
                          <Building className="h-4 w-4 text-blue-500" /> : 
                          <Globe className="h-4 w-4 text-green-500" />
                        }
                        <span className="font-medium">{warehouse.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={warehouse.type === 'PHYSICAL' ? 'default' : 'secondary'}>
                        {warehouse.type === 'PHYSICAL' ? '🏪 Physical' : '🌐 Online'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {warehouse.address ? (
                        <span className="text-sm">{warehouse.address}</span>
                      ) : (
                        <span className="text-gray-400 text-sm">No address</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={warehouse.is_active ? 'default' : 'secondary'}>
                        {warehouse.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {warehouse.created_at.toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {warehouse.updated_at.toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
