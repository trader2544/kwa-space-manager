import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, Home, Wrench, DollarSign, Bell, LogOut, Menu } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
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
  const isMobile = useIsMobile();
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      console.log('Fetching admin dashboard stats...');
      
      // Get houses stats
      const { data: houses } = await supabase
        .from('houses')
        .select('id, is_vacant');
      
      // Get tenants count - get all profiles with tenant role and no deleted_at
      const { data: tenants, error: tenantsError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('role', 'tenant');
      
      if (tenantsError) {
        console.error('Error fetching tenants:', tenantsError);
      }
      
      console.log('Active tenants found:', tenants?.length);
      
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
    <div className="min-h-screen bg-gray-50 pb-safe">
      {/* Mobile-Native Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50 safe-top">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1 min-w-0">
              <Building2 className="h-8 w-8 text-blue-600 mr-3 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-gray-900 truncate">Admin</h1>
                <p className="text-sm text-gray-600 truncate">
                  {user?.user_metadata?.full_name || user?.email}
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/'}
                className="px-3"
              >
                <Home className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSignOut}
                className="px-3"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Mobile-Native Stats Cards - Reduced size */}
        <div className={`grid grid-cols-2 ${isMobile ? 'gap-2' : 'gap-3'}`}>
          <Card className={`border-0 shadow-sm bg-gradient-to-r from-blue-50 to-blue-100 ${isMobile ? 'min-h-0' : ''}`}>
            <CardContent className={isMobile ? "p-3" : "p-4"}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs font-medium text-blue-900 ${isMobile ? 'mb-1' : ''}`}>Houses</p>
                  <p className={`font-bold text-blue-900 ${isMobile ? 'text-lg' : 'text-2xl'}`}>{stats.totalHouses}</p>
                </div>
                <Home className={`text-blue-600 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
              </div>
              <div className={`flex gap-1 ${isMobile ? 'mt-2' : 'mt-3'}`}>
                <Badge variant="default" className={`text-xs px-1 py-0 ${isMobile ? 'text-[10px]' : ''}`}>{stats.occupiedHouses} Occupied</Badge>
                <Badge variant="secondary" className={`text-xs px-1 py-0 ${isMobile ? 'text-[10px]' : ''}`}>{stats.vacantHouses} Vacant</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className={`border-0 shadow-sm bg-gradient-to-r from-green-50 to-green-100 ${isMobile ? 'min-h-0' : ''}`}>
            <CardContent className={isMobile ? "p-3" : "p-4"}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs font-medium text-green-900 ${isMobile ? 'mb-1' : ''}`}>Tenants</p>
                  <p className={`font-bold text-green-900 ${isMobile ? 'text-lg' : 'text-2xl'}`}>{stats.totalTenants}</p>
                </div>
                <Users className={`text-green-600 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
              </div>
              <div className={isMobile ? 'mt-2' : 'mt-3'}>
                <Badge variant="outline" className={`text-xs ${isMobile ? 'text-[10px] px-1 py-0' : ''}`}>Active Users</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className={`border-0 shadow-sm bg-gradient-to-r from-orange-50 to-orange-100 ${isMobile ? 'min-h-0' : ''}`}>
            <CardContent className={isMobile ? "p-3" : "p-4"}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs font-medium text-orange-900 ${isMobile ? 'mb-1' : ''}`}>Pending</p>
                  <p className={`font-bold text-orange-900 ${isMobile ? 'text-lg' : 'text-2xl'}`}>{stats.pendingRequests}</p>
                </div>
                <Wrench className={`text-orange-600 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
              </div>
              <div className={isMobile ? 'mt-2' : 'mt-3'}>
                {stats.pendingRequests > 0 && (
                  <Badge variant="destructive" className={`text-xs ${isMobile ? 'text-[10px] px-1 py-0' : ''}`}>Needs Attention</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className={`border-0 shadow-sm bg-gradient-to-r from-purple-50 to-purple-100 ${isMobile ? 'min-h-0' : ''}`}>
            <CardContent className={isMobile ? "p-3" : "p-4"}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs font-medium text-purple-900 ${isMobile ? 'mb-1' : ''}`}>Revenue</p>
                  <p className={`font-bold text-purple-900 ${isMobile ? 'text-sm' : 'text-lg'}`}>KSh {stats.totalRevenue.toLocaleString()}</p>
                </div>
                <DollarSign className={`text-purple-600 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
              </div>
              <div className={isMobile ? 'mt-2' : 'mt-3'}>
                <Badge variant="outline" className={`text-xs ${isMobile ? 'text-[10px] px-1 py-0' : ''}`}>This Month</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile-Native Tabs */}
        <Tabs defaultValue="houses" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 h-12 bg-white shadow-sm">
            <TabsTrigger value="houses" className="text-xs py-3 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900">Houses</TabsTrigger>
            <TabsTrigger value="tenants" className="text-xs py-3 data-[state=active]:bg-green-100 data-[state=active]:text-green-900">Tenants</TabsTrigger>
            <TabsTrigger value="maintenance" className="text-xs py-3 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-900">Repair</TabsTrigger>
            <TabsTrigger value="rent" className="text-xs py-3 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900">Rent</TabsTrigger>
            <TabsTrigger value="announcements" className="text-xs py-3 data-[state=active]:bg-cyan-100 data-[state=active]:text-cyan-900">News</TabsTrigger>
          </TabsList>

          <TabsContent value="houses" className="mt-6">
            <HousesManagement onStatsUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="tenants" className="mt-6">
            <TenantsManagement onStatsUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="maintenance" className="mt-6">
            <MaintenanceManagement onStatsUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="rent" className="mt-6">
            <RentManagement onStatsUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="announcements" className="mt-6">
            <AnnouncementsManagement onStatsUpdate={fetchStats} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
