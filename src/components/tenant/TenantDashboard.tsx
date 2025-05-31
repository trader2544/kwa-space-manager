
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, Wrench, Bell, LogOut, User, Calendar, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import TenantProfile from './TenantProfile';
import MaintenanceRequests from './MaintenanceRequests';
import RentPayments from './RentPayments';
import PayRent from './PayRent';
import Announcements from './Announcements';

interface TenantDashboardProps {
  user: any;
  onSignOut: () => void;
}

const TenantDashboard = ({ user, onSignOut }: TenantDashboardProps) => {
  const [stats, setStats] = useState({
    pendingRequests: 0,
    totalRequests: 0,
    unreadAnnouncements: 0,
    currentAssignment: null as any,
  });
  const isMobile = useIsMobile();
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, [user?.id]);

  const fetchStats = async () => {
    try {
      console.log('Fetching tenant dashboard stats for user:', user?.id);
      
      // Get tenant's maintenance requests
      const { data: requests } = await supabase
        .from('maintenance_requests')
        .select('id, status')
        .eq('tenant_id', user?.id);
      
      // Get unread announcements (all active announcements for now)
      const { data: announcements } = await supabase
        .from('announcements')
        .select('id')
        .eq('is_active', true);
      
      // Get tenant's current room assignment with full details
      const { data: assignment, error: assignmentError } = await supabase
        .from('tenant_assignments')
        .select(`
          id,
          assigned_at,
          house_id,
          houses!inner(
            id,
            room_name,
            floor,
            section,
            price,
            room_type,
            amenities
          )
        `)
        .eq('tenant_id', user?.id)
        .eq('is_active', true)
        .maybeSingle();

      if (assignmentError) {
        console.error('Error fetching assignment:', assignmentError);
      }

      console.log('Assignment data:', assignment);

      const pendingRequests = requests?.filter(r => r.status === 'pending').length || 0;

      setStats({
        pendingRequests,
        totalRequests: requests?.length || 0,
        unreadAnnouncements: announcements?.length || 0,
        currentAssignment: assignment || null,
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
              <Building2 className="h-8 w-8 text-green-600 mr-3 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-gray-900 truncate">Tenant Portal</h1>
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
        {/* Current Room Info */}
        {stats.currentAssignment?.houses ? (
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-blue-100">
            <CardContent className={isMobile ? "p-3" : "p-4"}>
              <div className="flex items-center gap-3">
                <Home className={`text-blue-600 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
                <div className="flex-1">
                  <h3 className={`font-bold text-blue-900 ${isMobile ? 'text-sm' : 'text-lg'}`}>
                    {stats.currentAssignment.houses.room_name}
                  </h3>
                  <p className={`text-blue-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    {stats.currentAssignment.houses.floor} Floor, {stats.currentAssignment.houses.section}
                  </p>
                  <p className={`text-blue-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    {stats.currentAssignment.houses.room_type} | KSh {stats.currentAssignment.houses.price?.toLocaleString()}/month
                  </p>
                  {stats.currentAssignment.houses.amenities && stats.currentAssignment.houses.amenities.length > 0 && (
                    <div className="mt-2">
                      <p className={`text-blue-600 font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>Amenities:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {stats.currentAssignment.houses.amenities.map((amenity: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 to-orange-100">
            <CardContent className={isMobile ? "p-3" : "p-4"}>
              <div className="flex items-center gap-3">
                <Home className={`text-orange-600 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
                <div className="flex-1">
                  <h3 className={`font-bold text-orange-900 ${isMobile ? 'text-sm' : 'text-lg'}`}>
                    No Room Assigned
                  </h3>
                  <p className={`text-orange-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    Please contact management for room assignment
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mobile-Native Stats Cards - Reduced size */}
        <div className={`grid grid-cols-3 ${isMobile ? 'gap-2' : 'gap-3'}`}>
          <Card className={`border-0 shadow-sm bg-gradient-to-r from-orange-50 to-orange-100 ${isMobile ? 'min-h-0' : ''}`}>
            <CardContent className={isMobile ? "p-2" : "p-4"}>
              <div className="text-center">
                <Wrench className={`text-orange-600 mx-auto mb-1 ${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} />
                <p className={`font-bold text-orange-900 ${isMobile ? 'text-sm' : 'text-2xl'}`}>{stats.pendingRequests}</p>
                <p className={`text-xs text-orange-700 ${isMobile ? 'leading-tight text-[10px]' : ''}`}>Requests</p>
              </div>
            </CardContent>
          </Card>

          <Card className={`border-0 shadow-sm bg-gradient-to-r from-cyan-50 to-cyan-100 ${isMobile ? 'min-h-0' : ''}`}>
            <CardContent className={isMobile ? "p-2" : "p-4"}>
              <div className="text-center">
                <Bell className={`text-cyan-600 mx-auto mb-1 ${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} />
                <p className={`font-bold text-cyan-900 ${isMobile ? 'text-sm' : 'text-2xl'}`}>{stats.unreadAnnouncements}</p>
                <p className={`text-xs text-cyan-700 ${isMobile ? 'leading-tight text-[10px]' : ''}`}>News</p>
              </div>
            </CardContent>
          </Card>

          <Card className={`border-0 shadow-sm bg-gradient-to-r from-green-50 to-green-100 ${isMobile ? 'min-h-0' : ''}`}>
            <CardContent className={isMobile ? "p-2" : "p-4"}>
              <div className="text-center">
                <Calendar className={`text-green-600 mx-auto mb-1 ${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} />
                <p className={`font-bold text-green-900 ${isMobile ? 'text-sm' : 'text-2xl'}`}>
                  {new Date().getDate()}
                </p>
                <p className={`text-xs text-green-700 ${isMobile ? 'leading-tight text-[10px]' : ''}`}>Today</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile-Native Tabs */}
        <Tabs defaultValue="rent" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 h-12 bg-white shadow-sm">
            <TabsTrigger value="rent" className="text-xs py-3 data-[state=active]:bg-green-100 data-[state=active]:text-green-900">Rent</TabsTrigger>
            <TabsTrigger value="pay" className="text-xs py-3 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900">Pay</TabsTrigger>
            <TabsTrigger value="maintenance" className="text-xs py-3 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-900">Repair</TabsTrigger>
            <TabsTrigger value="announcements" className="text-xs py-3 data-[state=active]:bg-cyan-100 data-[state=active]:text-cyan-900">News</TabsTrigger>
            <TabsTrigger value="profile" className="text-xs py-3 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="rent" className="mt-6">
            <RentPayments user={user} assignment={stats.currentAssignment} />
          </TabsContent>

          <TabsContent value="pay" className="mt-6">
            <PayRent assignment={stats.currentAssignment} />
          </TabsContent>

          <TabsContent value="maintenance" className="mt-6">
            <MaintenanceRequests user={user} />
          </TabsContent>

          <TabsContent value="announcements" className="mt-6">
            <Announcements user={user} />
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <TenantProfile user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TenantDashboard;
