
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Copy, CheckCircle } from 'lucide-react';

interface PayRentProps {
  assignment: any;
}

const PayRent = ({ assignment }: PayRentProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText('0728159403');
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Account number copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy account number",
        variant: "destructive",
      });
    }
  };

  if (!assignment) {
    return null;
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-blue-600" />
          Pay Your Rent
        </CardTitle>
        <CardDescription>
          Use the details below to pay your monthly rent via M-Pesa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-700">Monthly Rent Amount</p>
            <p className="text-2xl font-bold text-blue-600">KSh {assignment.houses.price.toLocaleString()}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Paybill Number</p>
              <p className="text-lg font-semibold">274247</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700">Account Number</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold">0728159403</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyAccountNumber}
                  className="h-8 px-2"
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-700">Account Name</p>
            <p className="text-lg font-semibold">Anthony Mutuku Mutiso</p>
          </div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">Payment Instructions:</h4>
          <ol className="text-sm text-yellow-700 space-y-1">
            <li>1. Go to M-Pesa on your phone</li>
            <li>2. Select "Lipa na M-Pesa"</li>
            <li>3. Select "Pay Bill"</li>
            <li>4. Enter Business Number: <strong>274247</strong></li>
            <li>5. Enter Account Number: <strong>0728159403</strong></li>
            <li>6. Enter Amount: <strong>KSh {assignment.houses.price.toLocaleString()}</strong></li>
            <li>7. Enter your M-Pesa PIN and confirm</li>
          </ol>
        </div>
        
        <div className="text-xs text-gray-500">
          <p>• Always keep your M-Pesa confirmation message as proof of payment</p>
          <p>• Payments are usually reflected within 24 hours</p>
          <p>• Contact management if you experience any payment issues</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PayRent;
