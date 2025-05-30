
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Calendar, AlertCircle, CreditCard, Clock } from 'lucide-react';

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
      console.log('Fetching rent payments for user:', user.id, 'year:', selectedYear);
      
      const { data, error } = await supabase
        .from('rent_payments')
        .select('*')
        .eq('tenant_id', user.id)
        .like('month_year', `${selectedYear}%`)
        .order('month_year', { ascending: false });

      if (error) {
        console.error('Error fetching payments:', error);
        throw error;
      }
      
      console.log('Fetched payments:', data);
      setPayments(data || []);
    } catch (error: any) {
      console.error('Error in fetchPayments:', error);
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
      case 'late':
        return 'destructive';
      case 'overdue':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getPaymentStatus = (monthYear: string, paymentDate?: string) => {
    const currentDate = new Date();
    const [year, month] = monthYear.split('-');
    const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    
    // Only show status for current month and past months
    if (monthDate > currentDate) {
      return null; // Don't show future months
    }

    // Check if payment exists
    if (paymentDate) {
      const paymentDay = new Date(paymentDate).getDate();
      if (paymentDay >= 1 && paymentDay <= 5) {
        return { status: 'paid', color: 'default', penalty: 0 };
      } else if (paymentDay >= 6 && paymentDay <= 9) {
        return { status: 'late', color: 'destructive', penalty: 200 };
      } else {
        return { status: 'paid', color: 'default', penalty: 0 };
      }
    }

    // No payment found - check if it's overdue
    const isCurrentMonth = monthDate.getMonth() === currentDate.getMonth() && 
                          monthDate.getFullYear() === currentDate.getFullYear();
    
    if (isCurrentMonth) {
      const currentDay = currentDate.getDate();
      if (currentDay > 9) {
        return { status: 'overdue', color: 'destructive', penalty: 200 };
      } else if (currentDay > 5) {
        return { status: 'pending (late)', color: 'destructive', penalty: 200 };
      } else {
        return { status: 'pending', color: 'secondary', penalty: 0 };
      }
    } else if (monthDate < currentDate) {
      // Past month with no payment
      return { status: 'overdue', color: 'destructive', penalty: 200 };
    }

    return { status: 'pending', color: 'secondary', penalty: 0 };
  };

  const generateMonthsFromAssignment = (year: string) => {
    if (!assignment?.assigned_at) return [];
    
    const assignedDate = new Date(assignment.assigned_at);
    const assignedYear = assignedDate.getFullYear();
    const assignedMonth = assignedDate.getMonth() + 1;
    
    const months = [];
    const targetYear = parseInt(year);
    const currentDate = new Date();
    
    // If selected year is before assignment year, return empty
    if (targetYear < assignedYear) return [];
    
    // Start from assignment month if it's the assignment year, otherwise from January
    const startMonth = targetYear === assignedYear ? assignedMonth : 1;
    
    // End at current month if it's current year, otherwise December
    const endMonth = targetYear === currentDate.getFullYear() ? currentDate.getMonth() + 1 : 12;
    
    for (let i = startMonth; i <= endMonth; i++) {
      const monthYear = `${year}-${i.toString().padStart(2, '0')}`;
      const payment = payments.find(p => p.month_year === monthYear);
      const statusInfo = getPaymentStatus(monthYear, payment?.payment_date);
      
      // Only add if status info exists (not future months)
      if (statusInfo) {
        months.push({
          monthYear,
          monthName: new Date(parseInt(year), i - 1).toLocaleDateString('en-US', { month: 'long' }),
          payment,
          statusInfo,
        });
      }
    }
    return months.reverse(); // Show most recent first
  };

  const monthsData = generateMonthsFromAssignment(selectedYear);
  const paidPayments = payments.filter(p => p.status === 'paid');
  const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);

  if (!assignment) {
    return (
      <div className="space-y-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No House Assigned</h3>
              <p className="text-gray-600">You need to be assigned a house to view rent payments.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading payment history...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile Header Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-purple-100">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-100 p-2 rounded-full">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-purple-900">Payment History</h2>
              <p className="text-sm text-purple-700">
                KSh {totalPaid.toLocaleString()} paid this year
              </p>
            </div>
          </div>

          {/* Year Selector */}
          <div className="mb-4">
            <Label className="text-xs font-medium text-purple-800 mb-2 block">Select Year</Label>
            <Input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-white border-purple-200"
              min="2020"
              max="2030"
            />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-100 rounded-lg p-3 text-center">
              <p className="text-xs text-green-700">Paid</p>
              <p className="font-bold text-green-900">{paidPayments.length}</p>
            </div>
            <div className="bg-orange-100 rounded-lg p-3 text-center">
              <p className="text-xs text-orange-700">Total Due</p>
              <p className="font-bold text-orange-900">{monthsData.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile-Native Payment Cards */}
      <div className="space-y-3">
        {monthsData.map(({ monthYear, monthName, payment, statusInfo }) => (
          <Card key={monthYear} className={`border-0 shadow-md ${
            payment ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-gray-300'
          }`}>
            <CardContent className="p-4">
              {/* Month Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">
                    {monthName} {selectedYear}
                  </h3>
                </div>
                <Badge variant={statusInfo.color}>
                  {statusInfo.status}
                </Badge>
              </div>

              {/* Payment Amount */}
              <div className={`rounded-lg p-3 mb-3 ${
                payment ? 'bg-green-50' : 'bg-gray-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Amount</p>
                    <p className={`font-bold text-lg ${
                      payment ? 'text-green-900' : 'text-gray-700'
                    }`}>
                      KSh {payment ? payment.amount.toLocaleString() : assignment.house.price.toLocaleString()}
                    </p>
                  </div>
                  {payment && (
                    <div className="text-center">
                      <CreditCard className="h-6 w-6 text-green-600 mx-auto mb-1" />
                      <p className="text-xs text-green-700">Paid</p>
                    </div>
                  )}
                  {!payment && (
                    <div className="text-center">
                      <Clock className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">Pending</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Details */}
              {payment && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Method:</span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {payment.payment_method}
                    </Badge>
                  </div>
                  
                  {payment.payment_reference && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Reference:</span>
                      <span className="text-xs font-mono text-gray-800">
                        {payment.payment_reference}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Date:</span>
                    <span className="text-xs text-gray-800">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Penalty Warning */}
              {statusInfo.penalty > 0 && (
                <div className="mt-3 p-2 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-xs text-red-700 font-medium">
                      Late fee: KSh {statusInfo.penalty}
                    </span>
                  </div>
                </div>
              )}

              {/* No Payment State */}
              {!payment && (
                <div className="text-center py-2">
                  <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No payment recorded</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {monthsData.length === 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-700 mb-2">No Payment History</h3>
              <p className="text-sm text-gray-500">
                No payment months available for the selected year.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Payment Guidelines */}
      <Card className="border-0 shadow-md bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Payment Guidelines</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-xs">On Time</Badge>
              <span className="text-xs text-blue-800">Pay between 1st - 5th (No penalty)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-xs">Late</Badge>
              <span className="text-xs text-blue-800">Pay between 6th - 9th (KSh 200 penalty)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-xs">Overdue</Badge>
              <span className="text-xs text-blue-800">After 9th or missed (KSh 200 penalty)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RentPayments;
