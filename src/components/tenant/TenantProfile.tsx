
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, Phone, Mail, Save } from 'lucide-react';

interface TenantProfileProps {
  user: any;
  assignment: any;
  onUpdate: () => void;
}

const TenantProfile = ({ user, assignment, onUpdate }: TenantProfileProps) => {
  const [profile, setProfile] = useState({
    full_name: user?.user_metadata?.full_name || '',
    phone: user?.user_metadata?.phone || '',
    email: user?.email || '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const updateProfile = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
        })
        .eq('id', user.id);

      if (error) throw error;

      onUpdate();
      
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Your personal information (read-only)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={profile.full_name}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">Contact admin to change</p>
            </div>
            
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={profile.phone}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">Contact admin to change</p>
            </div>
            
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                value={profile.email}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">Contact admin to change</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {assignment && (
        <Card>
          <CardHeader>
            <CardTitle>House Information</CardTitle>
            <CardDescription>
              Details about your assigned house
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Room Name</Label>
                <p className="font-medium">{assignment.house.room_name}</p>
              </div>
              
              <div>
                <Label>Room Type</Label>
                <p className="font-medium capitalize">{assignment.house.room_type}</p>
              </div>
              
              <div>
                <Label>Floor</Label>
                <p className="font-medium">{assignment.house.floor}</p>
              </div>
              
              <div>
                <Label>Section</Label>
                <p className="font-medium">{assignment.house.section}</p>
              </div>
              
              <div>
                <Label>Monthly Rent</Label>
                <p className="font-medium text-green-600">KSh {assignment.house.price.toLocaleString()}</p>
              </div>
              
              <div>
                <Label>Assigned Date</Label>
                <p className="font-medium">{new Date(assignment.assigned_at).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TenantProfile;
