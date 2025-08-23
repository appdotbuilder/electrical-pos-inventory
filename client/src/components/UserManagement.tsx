import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Users, Shield, UserCheck, Search } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { User, CreateUserInput } from '../../../server/src/schema';

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [formData, setFormData] = useState<CreateUserInput>({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'CASHIER',
    commission_rate: null
  });

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getUsers.query();
      setUsers(result);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await trpc.createUser.mutate(formData);
      setUsers((prev: User[]) => [...prev, response]);
      setFormData({
        username: '',
        email: '',
        password: '',
        full_name: '',
        role: 'CASHIER',
        commission_rate: null
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const filteredUsers = users.filter((user: User) => {
    const matchesSearch = 
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SYSTEM_ADMIN':
        return 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-red-300';
      case 'APP_ADMIN':
        return 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white border-orange-300';
      case 'MANAGER':
        return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-blue-300';
      case 'CASHIER':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-300';
      case 'WAREHOUSE':
        return 'bg-gradient-to-r from-purple-500 to-violet-500 text-white border-purple-300';
      default:
        return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white border-gray-300';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SYSTEM_ADMIN':
        return '🔧';
      case 'APP_ADMIN':
        return '⚙️';
      case 'MANAGER':
        return '👥';
      case 'CASHIER':
        return '💰';
      case 'WAREHOUSE':
        return '📦';
      default:
        return '👤';
    }
  };

  const roleCounts = {
    SYSTEM_ADMIN: users.filter(u => u.role === 'SYSTEM_ADMIN').length,
    APP_ADMIN: users.filter(u => u.role === 'APP_ADMIN').length,
    MANAGER: users.filter(u => u.role === 'MANAGER').length,
    CASHIER: users.filter(u => u.role === 'CASHIER').length,
    WAREHOUSE: users.filter(u => u.role === 'WAREHOUSE').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-500" />
            User Management
          </h2>
          <p className="text-gray-600">Manage user accounts, roles, and permissions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account with role-based access
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  placeholder="e.g., john.doe"
                  value={formData.username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateUserInput) => ({ ...prev, username: e.target.value }))
                  }
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g., john@company.com"
                  value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  placeholder="e.g., John Doe"
                  value={formData.full_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateUserInput) => ({ ...prev, full_name: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateUserInput) => ({ ...prev, password: e.target.value }))
                  }
                  required
                  minLength={6}
                />
              </div>

              <div>
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: 'SYSTEM_ADMIN' | 'APP_ADMIN' | 'MANAGER' | 'CASHIER' | 'WAREHOUSE') =>
                    setFormData((prev: CreateUserInput) => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SYSTEM_ADMIN">🔧 System Admin</SelectItem>
                    <SelectItem value="APP_ADMIN">⚙️ App Admin</SelectItem>
                    <SelectItem value="MANAGER">👥 Manager</SelectItem>
                    <SelectItem value="CASHIER">💰 Cashier</SelectItem>
                    <SelectItem value="WAREHOUSE">📦 Warehouse</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(formData.role === 'CASHIER' || formData.role === 'MANAGER') && (
                <div>
                  <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                  <Input
                    id="commission_rate"
                    type="number"
                    placeholder="e.g., 5.0"
                    value={formData.commission_rate || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateUserInput) => ({
                        ...prev,
                        commission_rate: parseFloat(e.target.value) || null
                      }))
                    }
                    step="0.1"
                    min="0"
                    max="100"
                  />
                </div>
              )}

              <Button type="submit" className="w-full">
                Create User Account
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Role Distribution Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-r from-red-500 to-pink-500 text-white">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl mb-1">🔧</div>
              <p className="text-xs font-medium text-red-100">System Admin</p>
              <p className="text-2xl font-bold">{roleCounts.SYSTEM_ADMIN}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl mb-1">⚙️</div>
              <p className="text-xs font-medium text-orange-100">App Admin</p>
              <p className="text-2xl font-bold">{roleCounts.APP_ADMIN}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl mb-1">👥</div>
              <p className="text-xs font-medium text-blue-100">Manager</p>
              <p className="text-2xl font-bold">{roleCounts.MANAGER}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl mb-1">💰</div>
              <p className="text-xs font-medium text-green-100">Cashier</p>
              <p className="text-2xl font-bold">{roleCounts.CASHIER}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-violet-500 text-white">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl mb-1">📦</div>
              <p className="text-xs font-medium text-purple-100">Warehouse</p>
              <p className="text-2xl font-bold">{roleCounts.WAREHOUSE}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, username, or email..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="SYSTEM_ADMIN">System Admin</SelectItem>
                <SelectItem value="APP_ADMIN">App Admin</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="CASHIER">Cashier</SelectItem>
                <SelectItem value="WAREHOUSE">Warehouse</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            👥 User Accounts ({filteredUsers.length})
          </CardTitle>
          <CardDescription>
            Manage system users and their access levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm || roleFilter !== 'all' ? 'No users match your filters' : 'No users found'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user: User) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{user.username}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getRoleBadgeColor(user.role)} font-medium px-2 py-1`}>
                          <span className="mr-1">{getRoleIcon(user.role)}</span>
                          {user.role.replace('_', ' ')}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.commission_rate ? (
                        <Badge className="bg-green-100 text-green-700">
                          {user.commission_rate}%
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {user.created_at.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
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