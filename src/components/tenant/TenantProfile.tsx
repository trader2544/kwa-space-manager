
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, Phone, Mail, Home, MapPin, Calendar, DollarSign } from 'lucide-react';

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
    <div className="space-y-4">
      {/* Personal Information Card */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 p-2 rounded-full">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Personal Info</h3>
              <p className="text-sm text-gray-600">Your account details</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-gray-600" />
                <Label className="text-xs font-medium text-gray-700">Full Name</Label>
              </div>
              <p className="font-medium text-gray-900">{profile.full_name || 'Not set'}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="h-4 w-4 text-gray-600" />
                <Label className="text-xs font-medium text-gray-700">Email</Label>
              </div>
              <p className="font-medium text-gray-900">{profile.email}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Phone className="h-4 w-4 text-gray-600" />
                <Label className="text-xs font-medium text-gray-700">Phone</Label>
              </div>
              <p className="font-medium text-gray-900">{profile.phone || 'Not set'}</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-orange-50 rounded-lg">
            <p className="text-xs text-orange-700 text-center">
              Contact admin to update your personal information
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Room Information Card */}
      {assignment && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 p-2 rounded-full">
                <Home className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">My Room</h3>
                <p className="text-sm text-gray-600">Current assignment</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-green-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-green-900">
                      {assignment.house.room_name}
                    </span>
                  </div>
                  <Badge className="bg-green-600 text-white text-xs">
                    {assignment.house.room_type}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <MapPin className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-green-700">Location</span>
                    </div>
                    <p className="text-sm font-medium text-green-900">
                      {assignment.house.floor} Floor
                    </p>
                    <p className="text-xs text-green-800">{assignment.house.section}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <DollarSign className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-green-700">Monthly Rent</span>
                    </div>
                    <p className="text-sm font-bold text-green-900">
                      KSh {assignment.house.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <Label className="text-xs font-medium text-gray-700">Move-in Date</Label>
                </div>
                <p className="font-medium text-gray-900">
                  {new Date(assignment.assigned_at).toLocaleDateString()}
                </p>
              </div>

              {/* Amenities */}
              {assignment.house.amenities && assignment.house.amenities.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <Label className="text-xs font-medium text-blue-700 mb-2 block">Room Amenities</Label>
                  <div className="flex flex-wrap gap-1">
                    {assignment.house.amenities.map((amenity: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs bg-white border-blue-200 text-blue-700">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Status Card */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-100 p-2 rounded-full">
              <Badge className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Account Status</h3>
              <p className="text-sm text-gray-600">Your account standing</p>
            </div>
          </div>

          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
            <div>
              <p className="font-medium text-green-900">Active Tenant</p>
              <p className="text-xs text-green-700">Account in good standing</p>
            </div>
            <Badge className="bg-green-600 text-white">Verified</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantProfile;
