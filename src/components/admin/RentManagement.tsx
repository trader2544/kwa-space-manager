
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Calendar, User, Home, Plus } from 'lucide-react';

interface RentPayment {
  id: string;
  amount: number;
  payment_method: string;
  payment_reference: string;
  payment_date: string;
  month_year: string;
  status: string;
  tenant: {
    full_name: string;
    email: string;
  };
  house: {
    room_name: string;
    floor: string;
    section: string;
    price: number;
  };
}

interface TenantAssignment {
  tenant_id: string;
  house_id: string;
  tenant: {
    full_name: string;
    email: string;
  };
  house: {
    id: string;
    room_name: string;
    floor: string;
    section: string;
    price: number;
  };
}

const RentManagement = () => {
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [assignments, setAssignments] = useState<TenantAssignment[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPayment, setNewPayment] = useState({
    tenant_id: '',
    house_id: '',
    amount: '',
    payment_method: '',
    payment_reference: '',
    month_year: new Date().toISOString().slice(0, 7),
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    try {
      // Fetch payments for selected month
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('rent_payments')
        .select(`
          *,
          tenant:profiles!rent_payments_tenant_id_fkey(full_name, email),
          house:houses!rent_payments_house_id_fkey(room_name, floor, section, price)
        `)
        .eq('month_year', selectedMonth)
        .order('payment_date', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Fetch active tenant assignments for adding payments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('tenant_assignments')
        .select(`
          tenant_id,
          house_id,
          tenant:profiles!tenant_assignments_tenant_id_fkey(full_name, email),
          house:houses!tenant_assignments_house_id_fkey(id, room_name, floor, section, price)
        `)
        .eq('is_active', true);

      if (assignmentsError) throw assignmentsError;

      setPayments(paymentsData || []);
      setAssignments(assignmentsData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch rent data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addPayment = async () => {
    try {
      if (!newPayment.tenant_id || !newPayment.house_id || !newPayment.amount) {
        toast({
          title: "Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('rent_payments')
        .insert({
          tenant_id: newPayment.tenant_id,
          house_id: newPayment.house_id,
          amount: parseInt(newPayment.amount),
          payment_method: newPayment.payment_method || null,
          payment_reference: newPayment.payment_reference || null,
          month_year: newPayment.month_year,
          status: 'paid',
        });

      if (error) throw error;

      setNewPayment({
        tenant_id: '',
        house_id: '',
        amount: '',
        payment_method: '',
        payment_reference: '',
        month_year: new Date().toISOString().slice(0, 7),
      });
      setShowAddPayment(false);
      await fetchData();
      
      toast({
        title: "Success",
        description: "Rent payment recorded successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to record payment.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'partial':
        return 'secondary';
      case 'pending':
        return 'destructive';
      case 'overdue':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Calculate summary stats
  const totalExpected = assignments.reduce((sum, assignment) => sum + assignment.house.price, 0);
  const totalReceived = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const paymentsCount = payments.length;
  const expectedCount = assignments.length;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading rent data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expected</p>
                <p className="text-lg font-bold">KSh {totalExpected.toLocaleString()}</p>
              </div>
              <Calendar className="h-6 w-6 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Received</p>
                <p className="text-lg font-bold text-green-600">KSh {totalReceived.toLocaleString()}</p>
              </div>
              <DollarSign className="h-6 w-6 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Outstanding</p>
                <p className="text-lg font-bold text-red-600">KSh {(totalExpected - totalReceived).toLocaleString()}</p>
              </div>
              <DollarSign className="h-6 w-6 text-red-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Payments</p>
                <p className="text-lg font-bold">{paymentsCount}/{expectedCount}</p>
              </div>
              <User className="h-6 w-6 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Rent Management</CardTitle>
              <CardDescription>
                Track and manage rent payments for all tenants
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="month">Month:</Label>
                <Input
                  id="month"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-40"
                />
              </div>
              <Button onClick={() => setShowAddPayment(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Payment
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showAddPayment && (
            <Card className="mb-6 border-dashed">
              <CardHeader>
                <CardTitle className="text-lg">Record New Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Tenant & House</Label>
                    <Select value={`${newPayment.tenant_id}|${newPayment.house_id}`} onValueChange={(value) => {
                      const [tenantId, houseId] = value.split('|');
                      const assignment = assignments.find(a => a.tenant_id === tenantId && a.house_id === houseId);
                      setNewPayment(prev => ({
                        ...prev,
                        tenant_id: tenantId,
                        house_id: houseId,
                        amount: assignment?.house.price.toString() || '',
                      }));
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tenant and house" />
                      </SelectTrigger>
                      <SelectContent>
                        {assignments.map((assignment) => (
                          <SelectItem key={`${assignment.tenant_id}|${assignment.house_id}`} value={`${assignment.tenant_id}|${assignment.house_id}`}>
                            {assignment.tenant.full_name} - {assignment.house.room_name} (KSh {assignment.house.price.toLocaleString()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Amount (KSh)</Label>
                    <Input
                      type="number"
                      value={newPayment.amount}
                      onChange={(e) => setNewPayment(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="Amount paid"
                    />
                  </div>
                  
                  <div>
                    <Label>Payment Method</Label>
                    <Input
                      value={newPayment.payment_method}
                      onChange={(e) => setNewPayment(prev => ({ ...prev, payment_method: e.target.value }))}
                      placeholder="e.g., M-Pesa, Bank Transfer"
                    />
                  </div>
                  
                  <div>
                    <Label>Payment Reference</Label>
                    <Input
                      value={newPayment.payment_reference}
                      onChange={(e) => setNewPayment(prev => ({ ...prev, payment_reference: e.target.value }))}
                      placeholder="Transaction ID or reference"
                    />
                  </div>
                  
                  <div>
                    <Label>Month/Year</Label>
                    <Input
                      type="month"
                      value={newPayment.month_year}
                      onChange={(e) => setNewPayment(prev => ({ ...prev, month_year: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddPayment(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addPayment}>
                    Record Payment
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {payments.map((payment) => (
              <Card key={payment.id} className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{payment.tenant.full_name}</span>
                        <Home className="h-4 w-4 text-gray-500 ml-2" />
                        <span>{payment.house.room_name} - {payment.house.floor} Floor</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>KSh {payment.amount.toLocaleString()}</span>
                        </div>
                        {payment.payment_method && (
                          <span>via {payment.payment_method}</span>
                        )}
                        {payment.payment_reference && (
                          <span>Ref: {payment.payment_reference}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {payments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No rent payments recorded for {selectedMonth}.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RentManagement;
