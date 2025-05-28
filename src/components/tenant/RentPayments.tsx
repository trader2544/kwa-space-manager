
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Calendar, AlertCircle } from 'lucide-react';

interface RentPayment {
  id: string;
  amount: number;
  payment_method: string;
  payment_reference: string;
  payment_date: string;
  month_year: string;
  status: string;
}

interface RentPaymentsProps {
  user: any;
  assignment: any;
}

const RentPayments = ({ user, assignment }: RentPaymentsProps) => {
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (assignment) {
      fetchPayments();
    }
  }, [assignment, selectedYear]);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('rent_payments')
        .select('*')
        .eq('tenant_id', user.id)
        .like('month_year', `${selectedYear}%`)
        .order('month_year', { ascending: false });

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

  const generateMonthsForYear = (year: string) => {
    const months = [];
    for (let i = 1; i <= 12; i++) {
      const monthYear = `${year}-${i.toString().padStart(2, '0')}`;
      months.push({
        monthYear,
        monthName: new Date(parseInt(year), i - 1).toLocaleDateString('en-US', { month: 'long' }),
        payment: payments.find(p => p.month_year === monthYear),
      });
    }
    return months;
  };

  const monthsData = generateMonthsForYear(selectedYear);
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const expectedTotal = assignment ? assignment.house.price * 12 : 0;

  if (!assignment) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No House Assigned</h3>
            <p className="text-gray-600">You need to be assigned a house to view rent payments.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading rent payments...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Rent Payment Summary ({selectedYear})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Monthly Rent</Label>
              <p className="text-lg font-semibold text-green-600">
                KSh {assignment.house.price.toLocaleString()}
              </p>
            </div>
            <div>
              <Label>Total Paid ({selectedYear})</Label>
              <p className="text-lg font-semibold">
                KSh {totalPaid.toLocaleString()}
              </p>
            </div>
            <div>
              <Label>Expected Annual</Label>
              <p className="text-lg font-semibold text-gray-600">
                KSh {expectedTotal.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Year Selector and Payments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                View your rent payment history by year
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label>Year:</Label>
              <Input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-24"
                min="2020"
                max="2030"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {monthsData.map(({ monthYear, monthName, payment }) => (
              <Card key={monthYear} className={`border-l-4 ${
                payment ? 'border-l-green-500' : 'border-l-gray-300'
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{monthName} {selectedYear}</CardTitle>
                    <Badge variant={payment ? getStatusColor(payment.status) : 'outline'}>
                      {payment ? payment.status : 'not paid'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Amount:</span>
                    <span className="font-medium">
                      {payment ? `KSh ${payment.amount.toLocaleString()}` : `KSh ${assignment.house.price.toLocaleString()}`}
                    </span>
                  </div>
                  
                  {payment && (
                    <>
                      {payment.payment_method && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Method:</span>
                          <span className="text-sm">{payment.payment_method}</span>
                        </div>
                      )}
                      
                      {payment.payment_reference && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Reference:</span>
                          <span className="text-sm font-mono">{payment.payment_reference}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Date:</span>
                        <span className="text-sm">{new Date(payment.payment_date).toLocaleDateString()}</span>
                      </div>
                    </>
                  )}
                  
                  {!payment && (
                    <div className="text-center py-2">
                      <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No payment recorded</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RentPayments;
