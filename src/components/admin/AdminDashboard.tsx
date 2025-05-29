
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, Home, Wrench, DollarSign, Bell, LogOut, Menu } from 'lucide-react';
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
        .eq('role', 'tenant')
        .is('deleted_at', null);
      
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
      {/* Mobile-First Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0 flex-1">
              <Building2 className="h-6 w-6 md:h-8 md:w-8 text-blue-600 mr-2 md:mr-3 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-lg md:text-2xl font-bold text-gray-900 truncate">Admin Dashboard</h1>
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

      <div className="px-4 py-6">
        {/* Quick Stats - Mobile Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs md:text-sm font-medium">Houses</span>
              </div>
              <div className="text-xl md:text-2xl font-bold">{stats.totalHouses}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                <Badge variant="default" className="text-xs">{stats.occupiedHouses} Occupied</Badge>
                <Badge variant="secondary" className="text-xs">{stats.vacantHouses} Vacant</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs md:text-sm font-medium">Tenants</span>
              </div>
              <div className="text-xl md:text-2xl font-bold">{stats.totalTenants}</div>
            </CardContent>
          </Card>

          <Card className="col-span-2 md:col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs md:text-sm font-medium">Pending</span>
              </div>
              <div className="text-xl md:text-2xl font-bold">{stats.pendingRequests}</div>
              {stats.pendingRequests > 0 && (
                <Badge variant="destructive" className="mt-2 text-xs">Needs Attention</Badge>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Mobile-Optimized Management Tabs */}
        <Tabs defaultValue="houses" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 h-auto">
            <TabsTrigger value="houses" className="text-xs py-3">Houses</TabsTrigger>
            <TabsTrigger value="tenants" className="text-xs py-3">Tenants</TabsTrigger>
            <TabsTrigger value="maintenance" className="text-xs py-3">Maintenance</TabsTrigger>
            <TabsTrigger value="rent" className="text-xs py-3">Rent</TabsTrigger>
            <TabsTrigger value="announcements" className="text-xs py-3">News</TabsTrigger>
          </TabsList>

          <TabsContent value="houses">
            <HousesManagement />
          </TabsContent>

          <TabsContent value="tenants">
            <TenantsManagement />
          </TabsContent>

          <TabsContent value="maintenance">
            <MaintenanceManagement />
          </TabsContent>

          <TabsContent value="rent">
            <RentManagement />
          </TabsContent>

          <TabsContent value="announcements">
            <AnnouncementsManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
