
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Calendar, FileText } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { AccountTransaction } from '../../../server/src/schema';

export function AccountsManagement() {
  const [transactions, setTransactions] = useState<AccountTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const loadTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const statusParam = statusFilter === 'all' ? undefined : statusFilter;
      const result = await trpc.getAccountTransactions.query({ 
        type: undefined, 
        status: statusParam 
      });
      setTransactions(result);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const receivables = transactions.filter((t: AccountTransaction) => t.type === 'RECEIVABLE');
  const payables = transactions.filter((t: AccountTransaction) => t.type === 'PAYABLE');
  
  const overdueReceivables = receivables.filter((t: AccountTransaction) => 
    t.status === 'OVERDUE' || (t.status === 'PENDING' && new Date(t.due_date) < new Date())
  );
  
  const overduePayables = payables.filter((t: AccountTransaction) => 
    t.status === 'OVERDUE' || (t.status === 'PENDING' && new Date(t.due_date) < new Date())
  );

  const totalReceivables = receivables.reduce((sum, t) => 
    t.status !== 'PAID' ? sum + t.amount : sum, 0
  );
  
  const totalPayables = payables.reduce((sum, t) => 
    t.status !== 'PAID' ? sum + t.amount : sum, 0
  );

  const getStatusColor = (status: string): 'default' | 'destructive' | 'outline' | 'secondary' => {
    switch (status) {
      case 'PENDING':
        return 'secondary';
      case 'PAID':
        return 'default';
      case 'OVERDUE':
        return 'destructive';
      case 'CANCELLED':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const isOverdue = (transaction: AccountTransaction) => {
    return transaction.status === 'OVERDUE' || 
           (transaction.status === 'PENDING' && new Date(transaction.due_date) < new Date());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-500" />
            Accounts Management
          </h2>
          <p className="text-gray-600">Track receivables and payables</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-100">Total Receivables</p>
                <p className="text-2xl font-bold">${totalReceivables.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-100">Total Payables</p>
                <p className="text-2xl font-bold">${totalPayables.toFixed(2)}</p>
              </div>
              <TrendingDown className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-100">Overdue Receivables</p>
                <p className="text-2xl font-bold">{overdueReceivables.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-100">Overdue Payables</p>
                <p className="text-2xl font-bold">{overduePayables.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Alerts */}
      {(overdueReceivables.length > 0 || overduePayables.length > 0) && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              ⚠️ Overdue Accounts Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {overdueReceivables.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-700 mb-3">
                    Overdue Receivables ({overdueReceivables.length})
                  </h4>
                  <div className="space-y-2">
                    {overdueReceivables.slice(0, 5).map((transaction: AccountTransaction) => (
                      <div key={transaction.id} className="bg-white p-3 rounded border flex justify-between">
                        <div>
                          <p className="font-medium">{transaction.customer_supplier}</p>
                          <p className="text-sm text-gray-600">{transaction.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600">${transaction.amount.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">
                            Due: {transaction.due_date.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {overduePayables.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-700 mb-3">
                    Overdue Payables ({overduePayables.length})
                  </h4>
                  <div className="space-y-2">
                    {overduePayables.slice(0, 5).map((transaction: AccountTransaction) => (
                      <div key={transaction.id} className="bg-white p-3 rounded border flex justify-between">
                        <div>
                          <p className="font-medium">{transaction.customer_supplier}</p>
                          <p className="text-sm text-gray-600">{transaction.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600">${transaction.amount.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">
                            Due: {transaction.due_date.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions by Type */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            All Accounts
          </TabsTrigger>
          <TabsTrigger value="receivables" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Receivables
          </TabsTrigger>
          <TabsTrigger value="payables" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Payables
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-4 mb-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                📊 All Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionTable 
                transactions={transactions} 
                isLoading={isLoading} 
                getStatusColor={getStatusColor}
                isOverdue={isOverdue}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receivables">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                💰 Accounts Receivable
              </CardTitle>
              <CardDescription>
                Money owed to your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionTable 
                transactions={receivables} 
                isLoading={isLoading} 
                getStatusColor={getStatusColor}
                isOverdue={isOverdue}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payables">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                💸 Accounts Payable
              </CardTitle>
              <CardDescription>
                Money your business owes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionTable 
                transactions={payables} 
                isLoading={isLoading} 
                getStatusColor={getStatusColor}
                isOverdue={isOverdue}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface TransactionTableProps {
  transactions: AccountTransaction[];
  isLoading: boolean;
  getStatusColor: (status: string) => 'default' | 'destructive' | 'outline' | 'secondary';
  isOverdue: (transaction: AccountTransaction) => boolean;
}

function TransactionTable({ transactions, isLoading, getStatusColor, isOverdue }: TransactionTableProps) {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading transactions...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No transactions found</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Transaction #</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Customer/Supplier</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Paid Date</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction: AccountTransaction) => (
          <TableRow key={transaction.id} className={isOverdue(transaction) ? 'bg-red-50' : ''}>
            <TableCell className="font-mono">{transaction.transaction_number}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {transaction.type === 'RECEIVABLE' ? 
                  <TrendingUp className="h-4 w-4 text-green-500" /> : 
                  <TrendingDown className="h-4 w-4 text-red-500" />
                }
                <Badge variant={transaction.type === 'RECEIVABLE' ? 'default' : 'secondary'}>
                  {transaction.type}
                </Badge>
              </div>
            </TableCell>
            <TableCell className="font-medium">{transaction.customer_supplier}</TableCell>
            <TableCell>{transaction.description}</TableCell>
            <TableCell className="font-bold">
              <span className={transaction.type === 'RECEIVABLE' ? 'text-green-600' : 'text-red-600'}>
                ${transaction.amount.toFixed(2)}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className={isOverdue(transaction) ? 'text-red-600 font-medium' : ''}>
                  {transaction.due_date.toLocaleDateString()}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {isOverdue(transaction) && <AlertTriangle className="h-4 w-4 text-red-500" />}
                <Badge variant={getStatusColor(transaction.status)}>
                  {isOverdue(transaction) && transaction.status === 'PENDING' ? 'OVERDUE' : transaction.status}
                </Badge>
              </div>
            </TableCell>
            <TableCell>
              {transaction.paid_date ? (
                transaction.paid_date.toLocaleDateString()
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                {transaction.status === 'PENDING' && (
                  <Button variant="outline" size="sm">
                    Mark Paid
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
  );
}
