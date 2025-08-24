import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Edit, Users, DollarSign, Calendar, Phone, Mail, UserCheck, Pencil, Trash2 } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Customer, CreateCustomerInput, UpdateCustomerInput } from '../../../server/src/schema';

export function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form state for create
  const [createFormData, setCreateFormData] = useState<CreateCustomerInput>({
    name: '',
    contact_person: null,
    email: null,
    phone: null,
    address: null,
    term_time: null,
    receivable_limit: null,
    special_discount: null,
    is_active: true
  });

  // Form state for edit
  const [editFormData, setEditFormData] = useState<UpdateCustomerInput>({
    id: 0, // This will be set when a customer is selected for editing
    name: '',
    contact_person: null,
    email: null,
    phone: null,
    address: null,
    term_time: null,
    receivable_limit: null,
    special_discount: null,
    is_active: true
  });

  const loadCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getCustomers.query({
        is_active: activeFilter,
        search_query: searchQuery || undefined
      });
      setCustomers(result);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, searchQuery]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newCustomer = await trpc.createCustomer.mutate(createFormData);
      setCustomers((prev: Customer[]) => [...prev, newCustomer]);
      setCreateFormData({
        name: '',
        contact_person: null,
        email: null,
        phone: null,
        address: null,
        term_time: null,
        receivable_limit: null,
        special_discount: null,
        is_active: true
      });
      setCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create customer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    
    setIsLoading(true);
    try {
      const updatedCustomer = await trpc.updateCustomer.mutate(editFormData);
      setCustomers((prev: Customer[]) => 
        prev.map(customer => customer.id === updatedCustomer.id ? updatedCustomer : customer)
      );
      setEditDialogOpen(false);
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Failed to update customer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (customer: Customer) => {
    setIsLoading(true);
    try {
      await trpc.deleteCustomer.mutate({ id: customer.id });
      setCustomers((prev: Customer[]) => prev.filter(c => c.id !== customer.id));
    } catch (error) {
      console.error('Failed to delete customer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditFormData({
      id: customer.id,
      name: customer.name,
      contact_person: customer.contact_person,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      term_time: customer.term_time,
      receivable_limit: customer.receivable_limit,
      special_discount: customer.special_discount,
      is_active: customer.is_active
    });
    setEditDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">⚡ POS & Inventory System</h1>
          <p className="text-xl text-gray-600">Customer Management</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{customers.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Customers</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {customers.filter(c => c.is_active).length}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Credit Customers</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {customers.filter(c => c.receivable_limit && c.receivable_limit > 0).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">Customer Management</CardTitle>
                <CardDescription className="text-gray-600">
                  Manage your customer database with ease
                </CardDescription>
              </div>
              
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Customer
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Customer</DialogTitle>
                    <DialogDescription>
                      Add a new customer to your database
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleCreateSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Customer Name *</Label>
                      <Input
                        id="name"
                        value={createFormData.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateFormData((prev: CreateCustomerInput) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder="Enter customer name"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contact_person">Contact Person</Label>
                      <Input
                        id="contact_person"
                        value={createFormData.contact_person || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateFormData((prev: CreateCustomerInput) => ({
                            ...prev,
                            contact_person: e.target.value || null
                          }))
                        }
                        placeholder="Enter contact person name"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={createFormData.email || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setCreateFormData((prev: CreateCustomerInput) => ({
                              ...prev,
                              email: e.target.value || null
                            }))
                          }
                          placeholder="email@example.com"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={createFormData.phone || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setCreateFormData((prev: CreateCustomerInput) => ({
                              ...prev,
                              phone: e.target.value || null
                            }))
                          }
                          placeholder="Phone number"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={createFormData.address || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateFormData((prev: CreateCustomerInput) => ({
                            ...prev,
                            address: e.target.value || null
                          }))
                        }
                        placeholder="Customer address"
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="term_time">Term (Days)</Label>
                        <Input
                          id="term_time"
                          type="number"
                          min="0"
                          value={createFormData.term_time || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setCreateFormData((prev: CreateCustomerInput) => ({
                              ...prev,
                              term_time: e.target.value ? parseInt(e.target.value) : null
                            }))
                          }
                          placeholder="30"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="receivable_limit">Credit Limit</Label>
                        <Input
                          id="receivable_limit"
                          type="number"
                          min="0"
                          step="0.01"
                          value={createFormData.receivable_limit || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setCreateFormData((prev: CreateCustomerInput) => ({
                              ...prev,
                              receivable_limit: e.target.value ? parseFloat(e.target.value) : null
                            }))
                          }
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="special_discount">Discount %</Label>
                        <Input
                          id="special_discount"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={createFormData.special_discount || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setCreateFormData((prev: CreateCustomerInput) => ({
                              ...prev,
                              special_discount: e.target.value ? parseFloat(e.target.value) : null
                            }))
                          }
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCreateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Creating...' : 'Create Customer'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Tabs value={activeFilter === undefined ? 'all' : activeFilter ? 'active' : 'inactive'} 
                    onValueChange={(value: string) => 
                      setActiveFilter(value === 'all' ? undefined : value === 'active')
                    }>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="inactive">Inactive</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <Separator className="mb-6" />
            
            {/* Customer List */}
            {customers.length === 0 && !isLoading ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg">No customers found</p>
                <p className="text-gray-400">Add your first customer to get started</p>
              </div>
            ) : isLoading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading customers...</p>
                </div>
            ) : (
              <div className="grid gap-4">
                {customers.map((customer: Customer) => (
                  <Card key={customer.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                            <Badge variant={customer.is_active ? "default" : "secondary"}>
                              {customer.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                            {customer.contact_person && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Users className="w-4 h-4" />
                                <span>{customer.contact_person}</span>
                              </div>
                            )}
                            
                            {customer.email && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail className="w-4 h-4" />
                                <span>{customer.email}</span>
                              </div>
                            )}
                            
                            {customer.phone && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="w-4 h-4" />
                                <span>{customer.phone}</span>
                              </div>
                            )}
                            
                            {customer.receivable_limit && customer.receivable_limit > 0 && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <DollarSign className="w-4 h-4" />
                                <span>Credit: Rp {customer.receivable_limit.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                            )}
                          </div>
                          
                          {customer.address && (
                            <p className="text-sm text-gray-500 mt-2">{customer.address}</p>
                          )}
                          
                          <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                            {customer.term_time && (
                              <span>Term: {customer.term_time} days</span>
                            )}
                            {customer.special_discount && customer.special_discount > 0 && (
                              <span>Discount: {customer.special_discount}%</span>
                            )}
                            <span>Created: {customer.created_at.toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(customer)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the customer
                                  "{customer.name}" and remove their data from the server.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(customer)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
              <DialogDescription>
                Update customer information
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit_name">Customer Name *</Label>
                <Input
                  id="edit_name"
                  value={editFormData.name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: UpdateCustomerInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter customer name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_contact_person">Contact Person</Label>
                <Input
                  id="edit_contact_person"
                  value={editFormData.contact_person || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: UpdateCustomerInput) => ({
                      ...prev,
                      contact_person: e.target.value || null
                    }))
                  }
                  placeholder="Enter contact person name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_email">Email</Label>
                  <Input
                    id="edit_email"
                    type="email"
                    value={editFormData.email || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: UpdateCustomerInput) => ({
                        ...prev,
                        email: e.target.value || null
                      }))
                    }
                    placeholder="email@example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_phone">Phone</Label>
                  <Input
                    id="edit_phone"
                    value={editFormData.phone || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: UpdateCustomerInput) => ({
                        ...prev,
                        phone: e.target.value || null
                      }))
                    }
                    placeholder="Phone number"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_address">Address</Label>
                <Input
                  id="edit_address"
                  value={editFormData.address || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: UpdateCustomerInput) => ({
                      ...prev,
                      address: e.target.value || null
                    }))
                  }
                  placeholder="Customer address"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_term_time">Term (Days)</Label>
                  <Input
                    id="edit_term_time"
                    type="number"
                    min="0"
                    value={editFormData.term_time || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: UpdateCustomerInput) => ({
                        ...prev,
                        term_time: e.target.value ? parseInt(e.target.value) : null
                      }))
                    }
                    placeholder="30"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_receivable_limit">Credit Limit</Label>
                  <Input
                    id="edit_receivable_limit"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editFormData.receivable_limit || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: UpdateCustomerInput) => ({
                        ...prev,
                        receivable_limit: e.target.value ? parseFloat(e.target.value) : null
                      }))
                    }
                    placeholder="0.00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_special_discount">Discount %</Label>
                  <Input
                    id="edit_special_discount"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={editFormData.special_discount || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: UpdateCustomerInput) => ({
                        ...prev,
                        special_discount: e.target.value ? parseFloat(e.target.value) : null
                      }))
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit_is_active"
                  checked={editFormData.is_active || false}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: UpdateCustomerInput) => ({
                      ...prev,
                      is_active: e.target.checked
                    }))
                  }
                  className="rounded"
                />
                <Label htmlFor="edit_is_active">Active Customer</Label>
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Customer'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}