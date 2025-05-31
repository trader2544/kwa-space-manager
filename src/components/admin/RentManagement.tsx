import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Search, Calendar, User, Home, AlertCircle, Plus } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import MonthlyRentTracker from './MonthlyRentTracker';
import UnpaidTenantsTracker from './UnpaidTenantsTracker';

interface RentPayment {
  id: string;
  tenant_id: string;
  house_id: string;
  amount: number;
  payment_date: string;
  month_year: string;
  status: string;
  payment_method: string;
  payment_reference: string;
  tenant: {
    full_name: string;
    email: string;
  };
  house: {
    room_name: string;
    floor: string;
    section: string;
  };
}

interface MonthlyRentStats {
  expectedTotal: number;
  paidTotal: number;
  remaining: number;
  assignedTenants: number;
  paidTenants: number;
}

interface RentManagementProps {
  onStatsUpdate: () => void;
}

const RentManagement = ({ onStatsUpdate }: RentManagementProps) => {
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));
  const [isAdding, setIsAdding] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyRentStats>({
    expectedTotal: 0,
    paidTotal: 0,
    remaining: 0,
    assignedTenants: 0,
    paidTenants: 0,
  });
  const [newPayment, setNewPayment] = useState({
    tenant_id: '',
    amount: '',
    payment_method: 'mpesa',
    payment_reference: '',
  });
  const [tenants, setTenants] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchPayments();
    fetchTenants();
  }, [monthFilter]);

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('tenant_assignments')
        .select(`
          tenant_id,
          house_id,
          tenant:profiles!tenant_assignments_tenant_id_fkey(full_name, email),
          house:houses!tenant_assignments_house_id_fkey(room_name, price)
        `)
        .eq('is_active', true);

      if (error) throw error;
      setTenants(data || []);
    } catch (error: any) {
      console.error('Error fetching tenants:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      let query = supabase
        .from('rent_payments')
        .select(`
          *,
          tenant:profiles!rent_payments_tenant_id_fkey(full_name, email),
          house:houses!rent_payments_house_id_fkey(room_name, floor, section)
        `)
        .order('payment_date', { ascending: false });

      if (monthFilter) {
        query = query.eq('month_year', monthFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPayments(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch rent payments.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addPayment = async () => {
    if (!newPayment.tenant_id || !newPayment.amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAdding(true);
      
      const selectedTenant = tenants.find(t => t.tenant_id === newPayment.tenant_id);
      if (!selectedTenant) throw new Error('Tenant not found');

      const { error } = await supabase
        .from('rent_payments')
        .insert({
          tenant_id: newPayment.tenant_id,
          house_id: selectedTenant.house_id,
          amount: parseInt(newPayment.amount),
          payment_method: newPayment.payment_method,
          payment_reference: newPayment.payment_reference,
          month_year: monthFilter,
          status: 'paid',
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment added successfully!",
      });

      await fetchPayments();
      onStatsUpdate();
      setNewPayment({ tenant_id: '', amount: '', payment_method: 'mpesa', payment_reference: '' });
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error adding payment:', error);
      toast({
        title: "Error",
        description: "Failed to add payment.",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.tenant?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.house?.room_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.payment_reference?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading rent payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Monthly Rent Tracker */}
      <MonthlyRentTracker 
        monthFilter={monthFilter}
        onStatsChange={setMonthlyStats}
      />

      {/* Unpaid Tenants Tracker */}
      <UnpaidTenantsTracker 
        monthFilter={monthFilter}
        onPaymentAdded={() => {
          fetchPayments();
          onStatsUpdate();
        }}
      />

      {/* Mobile Header Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-purple-100">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-6 w-6 text-purple-600" />
              <div>
                <h2 className="font-bold text-purple-900">Rent Management</h2>
                <p className="text-sm text-purple-700">
                  {filteredPayments.length} payments this month
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent className="mx-4 max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Add Payment</DialogTitle>
                    <DialogDescription>
                      Record a new rent payment for {new Date(monthFilter + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-medium">Tenant</Label>
                      <Select value={newPayment.tenant_id} onValueChange={(value) => setNewPayment(prev => ({ ...prev, tenant_id: value }))}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Choose tenant" />
                        </SelectTrigger>
                        <SelectContent>
                          {tenants.map((tenant) => (
                            <SelectItem key={tenant.tenant_id} value={tenant.tenant_id}>
                              {tenant.tenant.full_name} - {tenant.house.room_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-xs font-medium">Amount (KSh)</Label>
                      <Input
                        type="number"
                        value={newPayment.amount}
                        onChange={(e) => setNewPayment(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="Enter amount"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs font-medium">Payment Method</Label>
                      <Select value={newPayment.payment_method} onValueChange={(value) => setNewPayment(prev => ({ ...prev, payment_method: value }))}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mpesa">M-Pesa</SelectItem>
                          <SelectItem value="bank">Bank Transfer</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-xs font-medium">Reference (Optional)</Label>
                      <Input
                        value={newPayment.payment_reference}
                        onChange={(e) => setNewPayment(prev => ({ ...prev, payment_reference: e.target.value }))}
                        placeholder="Payment reference"
                        className="mt-1"
                      />
                    </div>
                    
                    <Button 
                      onClick={addPayment} 
                      disabled={isAdding}
                      className="w-full"
                    >
                      {isAdding ? 'Adding...' : 'Add Payment'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Month Filter */}
          <div className="mb-3">
            <Input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="bg-white border-purple-200"
            />
          </div>

          {/* Search and Filters */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-purple-200"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-white border-purple-200">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Paid Only</SelectItem>
                <SelectItem value="pending">Pending Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Mobile-Native Payment Cards */}
      <div className="space-y-3">
        {filteredPayments.map((payment) => (
          <Card key={payment.id} className="border-0 shadow-md">
            <CardContent className="p-4">
              {/* Payment Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-purple-600" />
                    <h3 className="font-semibold text-gray-900 truncate">
                      {payment.tenant?.full_name || 'Unknown Tenant'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                    <Home className="h-3 w-3" />
                    <span>{payment.house?.room_name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(payment.payment_date).toLocaleDateString()}</span>
                  </div>
                </div>
                <Badge 
                  variant={payment.status === 'paid' ? "default" : "secondary"}
                  className={payment.status === 'paid' ? "bg-green-600 text-white" : "bg-orange-100 text-orange-800"}
                >
                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                </Badge>
              </div>

              {/* Payment Amount */}
              <div className="bg-green-50 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-green-700">Amount</p>
                    <p className="font-bold text-green-900 text-lg">
                      KSh {payment.amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-green-700">Period</p>
                    <p className="font-medium text-green-800">{payment.month_year}</p>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-2">
                {payment.payment_method && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Method:</span>
                    <Badge variant="outline" className="text-xs">{payment.payment_method}</Badge>
                  </div>
                )}
                
                {payment.payment_reference && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Reference:</span>
                    <span className="text-xs font-mono text-gray-800">{payment.payment_reference}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Location:</span>
                  <span className="text-xs text-gray-800">{payment.house?.floor} Floor, {payment.house?.section}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredPayments.length === 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-700 mb-2">No Payments Found</h3>
              <p className="text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'No payments recorded for this month'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RentManagement;
