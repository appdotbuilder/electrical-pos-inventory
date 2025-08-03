
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Clock, User, Truck, CheckCircle, AlertCircle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Packing } from '../../../server/src/schema';

export function PackingManagement() {
  const [packingList, setPackingList] = useState<Packing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const loadPackingList = useCallback(async () => {
    try {
      setIsLoading(true);
      const statusParam = statusFilter === 'all' ? undefined : statusFilter;
      const result = await trpc.getPackingList.query({ status: statusParam });
      setPackingList(result);
    } catch (error) {
      console.error('Failed to load packing list:', error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadPackingList();
  }, [loadPackingList]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case  'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'IN_PROGRESS':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'PACKED':
        return <Package className="h-4 w-4 text-green-500" />;
      case 'SHIPPED':
        return <Truck className="h-4 w-4 text-purple-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string): 'default' | 'secondary' => {
    switch (status) {
      case 'PENDING':
        return 'secondary';
      case 'IN_PROGRESS':
        return 'default';
      case 'PACKED':
        return 'default';
      case 'SHIPPED':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const pendingCount = packingList.filter((p: Packing) => p.status === 'PENDING').length;
  const inProgressCount = packingList.filter((p: Packing) => p.status === 'IN_PROGRESS').length;
  const packedCount = packingList.filter((p: Packing) => p.status === 'PACKED').length;
  const shippedCount = packingList.filter((p: Packing) => p.status === 'SHIPPED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-6 w-6 text-orange-500" />
            Packing Management
          </h2>
          <p className="text-gray-600">Track and manage order packing process</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-100">Pending Packing</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-100">In Progress</p>
                <p className="text-2xl font-bold">{inProgressCount}</p>
              </div>
              <User className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-100">Packed</p>
                <p className="text-2xl font-bold">{packedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-100">Shipped</p>
                <p className="text-2xl font-bold">{shippedCount}</p>
              </div>
              <Truck className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <label htmlFor="status-filter" className="text-sm font-medium">Filter by Status:</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="PENDING">⏳ Pending</SelectItem>
                <SelectItem value="IN_PROGRESS">👤 In Progress</SelectItem>
                <SelectItem value="PACKED">📦 Packed</SelectItem>
                <SelectItem value="SHIPPED">🚚 Shipped</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Packing Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            📋 Packing Queue ({packingList.length})
          </CardTitle>
          <CardDescription>
            Orders requiring packing and shipping
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading packing queue...</p>
            </div>
          ) : packingList.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {statusFilter === 'all' ? 'No packing tasks found' : `No ${statusFilter.toLowerCase()} orders`}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sale ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Packer</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Packed Date</TableHead>
                  <TableHead>Shipped Date</TableHead>
                  <TableHead>Tracking Info</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packingList.map((packing: Packing) => (
                  <TableRow key={packing.id}>
                    <TableCell className="font-mono">#{packing.sale_id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(packing.status)}
                        <Badge variant={getStatusColor(packing.status)}>
                          {packing.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {packing.packer_id ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-500" />
                          <span>Packer #{packing.packer_id}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {packing.created_at.toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {packing.packed_date ? packing.packed_date.toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {packing.shipped_date ? packing.shipped_date.toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      {packing.tracking_info ? (
                        <Badge variant="outline" className="font-mono text-xs">
                          {packing.tracking_info}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {packing.notes ? (
                        <span className="text-sm">{packing.notes}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {packing.status === 'PENDING' && (
                          <Button variant="outline" size="sm">
                            Start Packing
                          </Button>
                        )}
                        {packing.status === 'IN_PROGRESS' && (
                          <Button variant="outline" size="sm">
                            Mark Packed
                          </Button>
                        )}
                        {packing.status === 'PACKED' && (
                          <Button variant="outline" size="sm">
                            Ship Order
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          View Details
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

      {/* Priority Orders */}
      {pendingCount > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <AlertCircle className="h-5 w-5" />
              🚨 Priority Packing Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {packingList
                .filter((p: Packing) => p.status === 'PENDING')
                .slice(0, 6)
                .map((packing: Packing) => (
                  <div key={packing.id} className="bg-white p-4 rounded-lg border">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-sm">Sale #{packing.sale_id}</span>
                      <Badge variant="secondary">PENDING</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Created: {packing.created_at.toLocaleDateString()}
                    </p>
                    <Button size="sm" className="w-full bg-yellow-600 hover:bg-yellow-700">
                      <User className="h-4 w-4 mr-2" />
                      Assign Packer
                    </Button>
                  </div>
                ))}
            </div>
            {pendingCount > 6 && (
              <div className="mt-4 text-center">
                <Button variant="outline">
                  View All {pendingCount} Pending Orders
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
