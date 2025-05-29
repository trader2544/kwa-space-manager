
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Home, DollarSign, Bell, LogOut, Wrench, AlertCircle, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import TenantProfile from './TenantProfile';
import MaintenanceRequests from './MaintenanceRequests';
import RentPayments from './RentPayments';
import Announcements from './Announcements';
import PayRent from './PayRent';

interface TenantDashboardProps {
  user: any;
  onSignOut: () => void;
}

interface DashboardStats {
  assignment: any;
  pendingRequests: number;
  thisMonthRent: number;
  announcements: number;
}

const TenantDashboard = ({ user, onSignOut }: TenantDashboardProps) => {
  const [stats, setStats] = useState<DashboardStats>({
    assignment: null,
    pendingRequests: 0,
    thisMonthRent: 0,
    announcements: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      // Get tenant's house assignment
      const { data: assignment } = await supabase
        .from('tenant_assignments')
        .select(`
          *,
          house:houses(*)
        `)
        .eq('tenant_id', user.id)
        .eq('is_active', true)
        .single();

      // Get pending maintenance requests count
      const { data: requests } = await supabase
        .from('maintenance_requests')
        .select('id')
        .eq('tenant_id', user.id)
        .in('status', ['pending', 'in_progress']);

      // Get this month's rent payment
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: payment } = await supabase
        .from('rent_payments')
        .select('amount')
        .eq('tenant_id', user.id)
        .eq('month_year', currentMonth)
        .eq('status', 'paid')
        .maybeSingle();

      // Get active announcements count
      const { data: announcements } = await supabase
        .from('announcements')
        .select('id')
        .eq('is_active', true);

      setStats({
        assignment: assignment || null,
        pendingRequests: requests?.length || 0,
        thisMonthRent: payment?.amount || 0,
        announcements: announcements?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      onSignOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to sign out.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0 flex-1">
              <Users className="h-6 w-6 md:h-8 md:w-8 text-green-600 mr-2 md:mr-3 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-lg md:text-2xl font-bold text-gray-900 truncate">Tenant Portal</h1>
                <p className="text-xs md:text-sm text-gray-600 truncate">
                  {user?.user_metadata?.full_name || user?.email}
                </p>
              </div>
            </div>
            <div className="flex gap-1 md:gap-2 flex-shrink-0">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/'}
                className="px-2 md:px-4"
              >
                <Home className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Home</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSignOut}
                className="px-2 md:px-4"
              >
                <LogOut className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* House Assignment Card - Mobile Optimized */}
        {stats.assignment ? (
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Home className="h-5 w-5 text-green-600" />
                Your Room
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Room:</span>
                  <span className="font-semibold">{stats.assignment.house.room_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Location:</span>
                  <span className="font-semibold text-right">{stats.assignment.house.floor} Floor - {stats.assignment.house.section}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Monthly Rent:</span>
                  <span className="font-semibold text-green-600">KSh {stats.assignment.house.price.toLocaleString()}</span>
                </div>
              </div>
              {stats.assignment.house.amenities && stats.assignment.house.amenities.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Amenities:</p>
                  <div className="flex flex-wrap gap-1">
                    {stats.assignment.house.amenities.map((amenity: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">{amenity}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No House Assigned</h3>
                <p className="text-gray-600">Please contact the admin to get a house assigned to you.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pay Rent Card - Mobile Optimized */}
        <PayRent assignment={stats.assignment} />

        {/* Community WhatsApp Group */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Community Group
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4 text-sm">
              Join our WhatsApp community group to connect with other residents and stay updated.
            </p>
            <Button 
              onClick={() => window.open('https://chat.whatsapp.com/your-group-link', '_blank')}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Join Community Group
            </Button>
          </CardContent>
        </Card>

        {/* Quick Stats - Mobile Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Requests</span>
              </div>
              <div className="text-xl font-bold">{stats.pendingRequests}</div>
              {stats.pendingRequests > 0 && (
                <Badge variant="secondary" className="mt-1 text-xs">Active</Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">This Month</span>
              </div>
              <div className="text-lg font-bold">
                {stats.thisMonthRent > 0 ? (
                  <span className="text-green-600">Paid</span>
                ) : (
                  <span className="text-red-600">Pending</span>
                )}
              </div>
              <Badge variant={stats.thisMonthRent > 0 ? "default" : "destructive"} className="mt-1 text-xs">
                {stats.thisMonthRent > 0 ? "✓" : "⚠"}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Mobile-Optimized Tabs */}
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="profile" className="text-xs py-3">Profile</TabsTrigger>
            <TabsTrigger value="maintenance" className="text-xs py-3">Maintenance</TabsTrigger>
            <TabsTrigger value="rent" className="text-xs py-3">Rent</TabsTrigger>
            <TabsTrigger value="announcements" className="text-xs py-3">News</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <TenantProfile user={user} assignment={stats.assignment} onUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="maintenance">
            <MaintenanceRequests user={user} assignment={stats.assignment} onUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="rent">
            <RentPayments user={user} assignment={stats.assignment} />
          </TabsContent>

          <TabsContent value="announcements">
            <Announcements />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TenantDashboard;
