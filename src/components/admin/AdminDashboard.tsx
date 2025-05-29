
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, Home, Wrench, DollarSign, Bell, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import HousesManagement from './HousesManagement';
import TenantsManagement from './TenantsManagement';
import MaintenanceManagement from './MaintenanceManagement';
import RentManagement from './RentManagement';
import AnnouncementsManagement from './AnnouncementsManagement';

interface AdminDashboardProps {
  user: any;
  onSignOut: () => void;
}

const AdminDashboard = ({ user, onSignOut }: AdminDashboardProps) => {
  const [stats, setStats] = useState({
    totalHouses: 0,
    occupiedHouses: 0,
    vacantHouses: 0,
    totalTenants: 0,
    pendingRequests: 0,
    totalRevenue: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get houses stats
      const { data: houses } = await supabase
        .from('houses')
        .select('id, is_vacant');
      
      // Get tenants count
      const { data: tenants } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'tenant');
      
      // Get pending maintenance requests
      const { data: requests } = await supabase
        .from('maintenance_requests')
        .select('id')
        .eq('status', 'pending');
      
      // Get this month's revenue
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: payments } = await supabase
        .from('rent_payments')
        .select('amount')
        .eq('month_year', currentMonth)
        .eq('status', 'paid');

      const totalRevenue = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
      const occupiedHouses = houses?.filter(h => !h.is_vacant).length || 0;

      setStats({
        totalHouses: houses?.length || 0,
        occupiedHouses,
        vacantHouses: (houses?.length || 0) - occupiedHouses,
        totalTenants: tenants?.length || 0,
        pendingRequests: requests?.length || 0,
        totalRevenue,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {user?.user_metadata?.full_name || user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Houses</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalHouses}</div>
              <div className="flex gap-2 mt-2">
                <Badge variant="default">{stats.occupiedHouses} Occupied</Badge>
                <Badge variant="secondary">{stats.vacantHouses} Vacant</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTenants}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingRequests}</div>
              {stats.pendingRequests > 0 && (
                <Badge variant="destructive" className="mt-2">Needs Attention</Badge>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="houses" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="houses">Houses</TabsTrigger>
            <TabsTrigger value="tenants">Tenants</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="rent">Rent</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
          </TabsList>

          <TabsContent value="houses">
            <HousesManagement onStatsUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="tenants">
            <TenantsManagement onStatsUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="maintenance">
            <MaintenanceManagement onStatsUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="rent">
            <RentManagement onStatsUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="announcements">
            <AnnouncementsManagement onStatsUpdate={fetchStats} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
