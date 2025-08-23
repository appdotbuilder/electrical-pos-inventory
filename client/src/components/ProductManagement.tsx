
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Edit, Package, Zap, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Product, CreateProductInput, UpdateProductInput } from '../../../server/src/schema';

export function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<CreateProductInput>({
    sku: '',
    name: '',
    description: null,
    category_id: null,
    base_unit: 'pcs',
    cost_price: 0,
    retail_price: 0,
    wholesale_price: 0,
    minimum_stock_level: 0,
    is_active: true
  });
  const [editFormData, setEditFormData] = useState<UpdateProductInput>({
    id: 0,
    sku: '',
    name: '',
    description: null,
    category_id: null,
    base_unit: 'pcs',
    cost_price: 0,
    retail_price: 0,
    wholesale_price: 0,
    minimum_stock_level: 0,
    is_active: true
  });

  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getProducts.query();
      setProducts(result);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await trpc.createProduct.mutate(formData);
      setProducts((prev: Product[]) => [...prev, response]);
      setFormData({
        sku: '',
        name: '',
        description: null,
        category_id: null,
        base_unit: 'pcs',
        cost_price: 0,
        retail_price: 0,
        wholesale_price: 0,
        minimum_stock_level: 0,
        is_active: true
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create product:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setEditFormData({
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description,
      category_id: product.category_id,
      base_unit: product.base_unit,
      cost_price: product.cost_price,
      retail_price: product.retail_price,
      wholesale_price: product.wholesale_price,
      minimum_stock_level: product.minimum_stock_level,
      is_active: product.is_active
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await trpc.updateProduct.mutate(editFormData);
      setProducts((prev: Product[]) => 
        prev.map((p: Product) => p.id === response.id ? response : p)
      );
      setIsEditDialogOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Failed to update product:', error);
    }
  };

  const handleDelete = async (productId: number) => {
    try {
      await trpc.deleteProduct.mutate({ id: productId });
      setProducts((prev: Product[]) => 
        prev.filter((p: Product) => p.id !== productId)
      );
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const filteredProducts = products.filter((product: Product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const electricalUnits = ['pcs', 'meters', 'rolls', 'boxes', 'sets', 'pairs', 'kg', 'liters'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-500" />
            Product Management
          </h2>
          <p className="text-gray-600">Manage electrical products and inventory items</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Create a new electrical product for your inventory
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  placeholder="e.g., WIRE-12AWG-100M"
                  value={formData.sku}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateProductInput) => ({ ...prev, sku: e.target.value }))
                  }
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., 12 AWG Copper Wire"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateProductInput) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Product description (optional)"
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateProductInput) => ({
                      ...prev,
                      description: e.target.value || null
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="base_unit">Base Unit *</Label>
                <Select
                  value={formData.base_unit || 'pcs'}
                  onValueChange={(value: string) =>
                    setFormData((prev: CreateProductInput) => ({ ...prev, base_unit: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {electricalUnits.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="cost_price">Cost Price *</Label>
                  <Input
                    id="cost_price"
                    type="number"
                    placeholder="0.00"
                    value={formData.cost_price}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateProductInput) => ({ 
                        ...prev, 
                        cost_price: parseFloat(e.target.value) || 0 
                      }))
                    }
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="retail_price">Retail Price *</Label>
                  <Input
                    id="retail_price"
                    type="number"
                    placeholder="0.00"
                    value={formData.retail_price}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateProductInput) => ({ 
                        ...prev, 
                        retail_price: parseFloat(e.target.value) || 0 
                      }))
                    }
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="wholesale_price">Wholesale *</Label>
                  <Input
                    id="wholesale_price"
                    type="number"
                    placeholder="0.00"
                    value={formData.wholesale_price}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateProductInput) => ({ 
                        ...prev, 
                        wholesale_price: parseFloat(e.target.value) || 0 
                      }))
                    }
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="minimum_stock_level">Minimum Stock Level *</Label>
                <Input
                  id="minimum_stock_level"
                  type="number"
                  placeholder="0"
                  value={formData.minimum_stock_level}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateProductInput) => ({ 
                      ...prev, 
                      minimum_stock_level: parseInt(e.target.value) || 0 
                    }))
                  }
                  min="0"
                  required
                />
              </div>

              <div>
                <Label htmlFor="is_active">Status *</Label>
                <Select
                  value={formData.is_active !== undefined ? (formData.is_active ? 'true' : 'false') : 'true'}
                  onValueChange={(value: string) =>
                    setFormData((prev: CreateProductInput) => ({ 
                      ...prev, 
                      is_active: value === 'true' 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full">
                Create Product
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Product Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>
                Update product information
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <Label htmlFor="edit_sku">SKU *</Label>
                <Input
                  id="edit_sku"
                  placeholder="e.g., WIRE-12AWG-100M"
                  value={editFormData.sku}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: UpdateProductInput) => ({ ...prev, sku: e.target.value }))
                  }
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="edit_name">Product Name *</Label>
                <Input
                  id="edit_name"
                  placeholder="e.g., 12 AWG Copper Wire"
                  value={editFormData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: UpdateProductInput) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit_description">Description</Label>
                <Input
                  id="edit_description"
                  placeholder="Product description (optional)"
                  value={editFormData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: UpdateProductInput) => ({
                      ...prev,
                      description: e.target.value || null
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="edit_base_unit">Base Unit *</Label>
                <Select
                  value={editFormData.base_unit || 'pcs'}
                  onValueChange={(value: string) =>
                    setEditFormData((prev: UpdateProductInput) => ({ ...prev, base_unit: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {electricalUnits.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="edit_cost_price">Cost Price *</Label>
                  <Input
                    id="edit_cost_price"
                    type="number"
                    placeholder="0.00"
                    value={editFormData.cost_price}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: UpdateProductInput) => ({ 
                        ...prev, 
                        cost_price: parseFloat(e.target.value) || 0 
                      }))
                    }
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="edit_retail_price">Retail Price *</Label>
                  <Input
                    id="edit_retail_price"
                    type="number"
                    placeholder="0.00"
                    value={editFormData.retail_price}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: UpdateProductInput) => ({ 
                        ...prev, 
                        retail_price: parseFloat(e.target.value) || 0 
                      }))
                    }
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="edit_wholesale_price">Wholesale *</Label>
                  <Input
                    id="edit_wholesale_price"
                    type="number"
                    placeholder="0.00"
                    value={editFormData.wholesale_price}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: UpdateProductInput) => ({ 
                        ...prev, 
                        wholesale_price: parseFloat(e.target.value) || 0 
                      }))
                    }
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit_minimum_stock_level">Minimum Stock Level *</Label>
                <Input
                  id="edit_minimum_stock_level"
                  type="number"
                  placeholder="0"
                  value={editFormData.minimum_stock_level}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: UpdateProductInput) => ({ 
                      ...prev, 
                      minimum_stock_level: parseInt(e.target.value) || 0 
                    }))
                  }
                  min="0"
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit_is_active">Status *</Label>
                <Select
                  value={editFormData.is_active ? 'true' : 'false'}
                  onValueChange={(value: string) =>
                    setEditFormData((prev: UpdateProductInput) => ({ 
                      ...prev, 
                      is_active: value === 'true' 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full">
                Update Product
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search products by name or SKU..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Products ({filteredProducts.length})
          </CardTitle>
          <CardDescription>
            Manage your electrical product catalog
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm ? 'No products match your search' : 'No products yet. Create one above!'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Cost Price</TableHead>
                  <TableHead>Retail Price</TableHead>
                  <TableHead>Wholesale Price</TableHead>
                  <TableHead>Min Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product: Product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.description && (
                          <p className="text-sm text-gray-500">{product.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{product.base_unit}</TableCell>
                    <TableCell>Rp {product.cost_price.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell className="font-medium text-green-600">
                      Rp {product.retail_price.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="font-medium text-blue-600">
                      Rp {product.wholesale_price.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{product.minimum_stock_level}</TableCell>
                    <TableCell>
                      <Badge variant={product.is_active ? 'default' : 'secondary'}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Product</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{product.name}"? This action cannot be undone and will also remove associated inventory records.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(product.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
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
