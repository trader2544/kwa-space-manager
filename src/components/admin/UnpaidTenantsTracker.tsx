
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, DollarSign, User, Home } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface UnpaidTenant {
  tenant_id: string;
  tenant_name: string;
  tenant_email: string;
  house_id: string;
  room_name: string;
  expected_amount: number;
  paid_amount: number;
  outstanding: number;
}

interface UnpaidTenantsTrackerProps {
  monthFilter: string;
  onPaymentAdded: () => void;
}

const UnpaidTenantsTracker = ({ monthFilter, onPaymentAdded }: UnpaidTenantsTrackerProps) => {
  const [unpaidTenants, setUnpaidTenants] = useState<UnpaidTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<UnpaidTenant | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (monthFilter) {
      fetchUnpaidTenants();
    }
  }, [monthFilter]);

  const fetchUnpaidTenants = async () => {
    try {
      setLoading(true);

      // Get all active tenant assignments with house details
      const { data: assignments, error: assignmentsError } = await supabase
        .from('tenant_assignments')
        .select(`
          tenant_id,
          house_id,
          tenant:profiles!tenant_assignments_tenant_id_fkey(full_name, email),
          house:houses!tenant_assignments_house_id_fkey(room_name, price)
        `)
        .eq('is_active', true);

      if (assignmentsError) throw assignmentsError;

      // Get payments for the selected month
      const { data: payments, error: paymentsError } = await supabase
        .from('rent_payments')
        .select('tenant_id, amount')
        .eq('month_year', monthFilter)
        .eq('status', 'paid');

      if (paymentsError) throw paymentsError;

      // Calculate unpaid tenants
      const paymentMap = new Map();
      payments?.forEach(payment => {
        const existing = paymentMap.get(payment.tenant_id) || 0;
        paymentMap.set(payment.tenant_id, existing + payment.amount);
      });

      const unpaid = assignments?.filter(assignment => {
        const paidAmount = paymentMap.get(assignment.tenant_id) || 0;
        const expectedAmount = assignment.house?.price || 0;
        return paidAmount < expectedAmount;
      }).map(assignment => {
        const paidAmount = paymentMap.get(assignment.tenant_id) || 0;
        const expectedAmount = assignment.house?.price || 0;
        return {
          tenant_id: assignment.tenant_id,
          tenant_name: assignment.tenant?.full_name || 'Unknown',
          tenant_email: assignment.tenant?.email || '',
          house_id: assignment.house_id,
          room_name: assignment.house?.room_name || 'Unknown',
          expected_amount: expectedAmount,
          paid_amount: paidAmount,
          outstanding: expectedAmount - paidAmount,
        };
      }) || [];

      setUnpaidTenants(unpaid);
    } catch (error) {
      console.error('Error fetching unpaid tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPayment = async (tenant: UnpaidTenant) => {
    try {
      setIsAddingPayment(true);

      const { error } = await supabase
        .from('rent_payments')
        .insert({
          tenant_id: tenant.tenant_id,
          house_id: tenant.house_id,
          amount: tenant.outstanding,
          month_year: monthFilter,
          status: 'paid',
          payment_method: 'manual',
          payment_reference: `Manual entry for ${tenant.tenant_name}`,
        });

      if (error) throw error;

      toast({
        title: "Payment Added",
        description: `Payment of KSh ${tenant.outstanding.toLocaleString()} added for ${tenant.tenant_name}`,
      });

      await fetchUnpaidTenants();
      onPaymentAdded();
    } catch (error) {
      console.error('Error adding payment:', error);
      toast({
        title: "Error",
        description: "Failed to add payment.",
        variant: "destructive",
      });
    } finally {
      setIsAddingPayment(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (unpaidTenants.length === 0) {
    return (
      <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-green-100">
        <CardContent className="p-4 text-center">
          <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <h3 className="font-semibold text-green-900 mb-1">All Paid Up!</h3>
          <p className="text-sm text-green-700">No outstanding payments this month</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 to-red-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-red-900 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Unpaid Tenants ({unpaidTenants.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {unpaidTenants.map((tenant) => (
            <div key={tenant.tenant_id} className="bg-white rounded-lg p-3 border-l-4 border-red-400">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-gray-600" />
                    <span className="font-medium text-gray-900 truncate">{tenant.tenant_name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Home className="h-3 w-3" />
                    <span>{tenant.room_name}</span>
                  </div>
                </div>
                <Badge variant="destructive" className="text-xs">
                  KSh {tenant.outstanding.toLocaleString()}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="text-xs">
                  <span className="text-gray-600">Expected:</span>
                  <span className="font-medium ml-1">KSh {tenant.expected_amount.toLocaleString()}</span>
                </div>
                <div className="text-xs">
                  <span className="text-gray-600">Paid:</span>
                  <span className="font-medium ml-1">KSh {tenant.paid_amount.toLocaleString()}</span>
                </div>
              </div>

              <Button
                onClick={() => addPayment(tenant)}
                disabled={isAddingPayment}
                size="sm"
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {isAddingPayment ? 'Adding...' : `Add Payment (KSh ${tenant.outstanding.toLocaleString()})`}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UnpaidTenantsTracker;
