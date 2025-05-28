
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Home, DollarSign, Bell, LogOut, Wrench, AlertCircle } from 'lucide-react';
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
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tenant Portal</h1>
              <p className="text-sm text-gray-600">Welcome back, {user?.user_metadata?.full_name || user?.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* House Assignment Card */}
        {stats.assignment ? (
          <Card className="mb-8 border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5 text-green-600" />
                Your Assigned House
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Room</p>
                  <p className="font-semibold">{stats.assignment.house.room_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-semibold">{stats.assignment.house.floor} Floor - {stats.assignment.house.section}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Monthly Rent</p>
                  <p className="font-semibold text-green-600">KSh {stats.assignment.house.price.toLocaleString()}</p>
                </div>
              </div>
              {stats.assignment.house.amenities && stats.assignment.house.amenities.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Amenities:</p>
                  <div className="flex flex-wrap gap-2">
                    {stats.assignment.house.amenities.map((amenity: string, index: number) => (
                      <Badge key={index} variant="outline">{amenity}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8 border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No House Assigned</h3>
                <p className="text-gray-600">Please contact the admin to get a house assigned to you.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pay Rent Card */}
        <div className="mb-8">
          <PayRent assignment={stats.assignment} />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingRequests}</div>
              {stats.pendingRequests > 0 && (
                <Badge variant="secondary" className="mt-2">Active Issues</Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month's Rent</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.thisMonthRent > 0 ? (
                  <span className="text-green-600">KSh {stats.thisMonthRent.toLocaleString()}</span>
                ) : (
                  <span className="text-red-600">Pending</span>
                )}
              </div>
              <Badge variant={stats.thisMonthRent > 0 ? "default" : "destructive"} className="mt-2">
                {stats.thisMonthRent > 0 ? "Paid" : "Not Paid"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Announcements</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.announcements}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="rent">Rent</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
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
