
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
      {/* Year Selector and Payments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                Your rent payment history from assignment date
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
            {monthsData.map(({ monthYear, monthName, payment, statusInfo }) => (
              <Card key={monthYear} className={`border-l-4 ${
                payment ? 'border-l-green-500' : 'border-l-gray-300'
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{monthName} {selectedYear}</CardTitle>
                    <Badge variant={statusInfo.color}>
                      {statusInfo.status}
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
                  
                  {statusInfo.penalty > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-red-600">Penalty:</span>
                      <span className="text-sm font-medium text-red-600">KSh {statusInfo.penalty}</span>
                    </div>
                  )}
                  
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
          
          {monthsData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Payment History</h3>
              <p>No payment months available for the selected year.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Guidelines */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="text-lg">Payment Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="default">Good Payment</Badge>
              <span>Pay between 1st - 5th of the month (No penalty)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive">Late Payment</Badge>
              <span>Pay between 6th - 9th of the month (KSh 200 penalty)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive">Overdue</Badge>
              <span>Payment after 9th or missed payment (KSh 200 penalty)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RentPayments;
