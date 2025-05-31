
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Target, TrendingUp, AlertCircle } from 'lucide-react';

interface MonthlyRentStats {
  expectedTotal: number;
  paidTotal: number;
  remaining: number;
  assignedTenants: number;
  paidTenants: number;
}

interface MonthlyRentTrackerProps {
  monthFilter: string;
  onStatsChange: (stats: MonthlyRentStats) => void;
}

const MonthlyRentTracker = ({ monthFilter, onStatsChange }: MonthlyRentTrackerProps) => {
  const [stats, setStats] = useState<MonthlyRentStats>({
    expectedTotal: 0,
    paidTotal: 0,
    remaining: 0,
    assignedTenants: 0,
    paidTenants: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (monthFilter) {
      fetchMonthlyStats();
    }
  }, [monthFilter]);

  const fetchMonthlyStats = async () => {
    try {
      setLoading(true);

      // Get all active tenant assignments with house prices
      const { data: assignments, error: assignmentsError } = await supabase
        .from('tenant_assignments')
        .select(`
          tenant_id,
          house:houses!tenant_assignments_house_id_fkey(price)
        `)
        .eq('is_active', true);

      if (assignmentsError) throw assignmentsError;

      // Calculate expected total from all assigned tenants
      const expectedTotal = assignments?.reduce((sum, assignment) => {
        return sum + (assignment.house?.price || 0);
      }, 0) || 0;

      const assignedTenants = assignments?.length || 0;

      // Get payments for the selected month
      const { data: payments, error: paymentsError } = await supabase
        .from('rent_payments')
        .select('amount, tenant_id')
        .eq('month_year', monthFilter)
        .eq('status', 'paid');

      if (paymentsError) throw paymentsError;

      // Calculate paid total and unique paying tenants
      const paidTotal = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
      const uniquePaidTenants = new Set(payments?.map(p => p.tenant_id) || []).size;

      const remaining = expectedTotal - paidTotal;

      const monthlyStats = {
        expectedTotal,
        paidTotal,
        remaining,
        assignedTenants,
        paidTenants: uniquePaidTenants,
      };

      setStats(monthlyStats);
      onStatsChange(monthlyStats);

    } catch (error) {
      console.error('Error fetching monthly stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    if (stats.remaining <= 0) return 'bg-green-500';
    if (stats.paidTenants >= stats.assignedTenants * 0.8) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusText = () => {
    if (stats.remaining <= 0) return 'Complete';
    if (stats.paidTenants >= stats.assignedTenants * 0.8) return 'Nearly Complete';
    return 'Pending';
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

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-blue-100">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
            <Target className="h-5 w-5" />
            Monthly Collection Target
          </CardTitle>
          <Badge className={`${getStatusColor()} text-white`}>
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {/* Progress Overview */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-xs text-gray-600">Expected</span>
            </div>
            <p className="font-bold text-green-900">
              KSh {stats.expectedTotal.toLocaleString()}
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-gray-600">Collected</span>
            </div>
            <p className="font-bold text-blue-900">
              KSh {stats.paidTotal.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Remaining Amount */}
        <div className={`rounded-lg p-3 mb-4 ${
          stats.remaining <= 0 ? 'bg-green-100' : 'bg-orange-100'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className={`h-4 w-4 ${
                  stats.remaining <= 0 ? 'text-green-600' : 'text-orange-600'
                }`} />
                <span className={`text-xs ${
                  stats.remaining <= 0 ? 'text-green-700' : 'text-orange-700'
                }`}>
                  {stats.remaining <= 0 ? 'All Collected!' : 'Remaining'}
                </span>
              </div>
              <p className={`font-bold text-lg ${
                stats.remaining <= 0 ? 'text-green-900' : 'text-orange-900'
              }`}>
                KSh {Math.max(0, stats.remaining).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-xs ${
                stats.remaining <= 0 ? 'text-green-700' : 'text-orange-700'
              }`}>
                Progress
              </p>
              <p className={`font-bold ${
                stats.remaining <= 0 ? 'text-green-900' : 'text-orange-900'
              }`}>
                {stats.paidTenants}/{stats.assignedTenants}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Collection Progress</span>
            <span>
              {stats.expectedTotal > 0 
                ? Math.round((stats.paidTotal / stats.expectedTotal) * 100)
                : 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                stats.remaining <= 0 ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ 
                width: `${stats.expectedTotal > 0 
                  ? Math.min(100, (stats.paidTotal / stats.expectedTotal) * 100)
                  : 0}%` 
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyRentTracker;
