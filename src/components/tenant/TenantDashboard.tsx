
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Users, Home, DollarSign, Bell, LogOut, Wrench, AlertCircle, MessageSquare, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
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
  const [roomOpen, setRoomOpen] = useState(true);
  const [payRentOpen, setPayRentOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
    requestNotificationPermission();
  }, [user]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast({
          title: "Notifications enabled",
          description: "You'll receive rent reminders on the 1st and 5th of each month.",
        });
      }
    }
  };

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

  const currentDate = new Date().getDate();
  const isRentDue = currentDate >= 1 && currentDate <= 5;

  return (
    <div className="min-h-screen bg-gray-50 pb-safe">
      {/* Mobile-Native Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50 safe-top">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1 min-w-0">
              <Users className="h-8 w-8 text-green-600 mr-3 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-gray-900 truncate">My Space</h1>
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

      <div className="px-4 py-6 space-y-4">
        {/* Rent Due Alert - Mobile Native */}
        {isRentDue && stats.thisMonthRent === 0 && (
          <Card className="border-0 shadow-lg bg-gradient-to-r from-red-500 to-red-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Bell className="h-6 w-6 animate-pulse" />
                <div className="flex-1">
                  <h3 className="font-semibold">Rent Due!</h3>
                  <p className="text-sm opacity-90">Pay your rent by the 5th to avoid late fees</p>
                </div>
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={() => setPayRentOpen(true)}
                  className="bg-white text-red-600 hover:bg-red-50"
                >
                  Pay Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Room Assignment Card - Mobile Native */}
        {stats.assignment ? (
          <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-green-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Your Room</h3>
                </div>
                <Badge className="bg-green-600 text-white">{stats.assignment.house.room_name}</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-green-700">Location</p>
                  <p className="font-medium text-green-900">{stats.assignment.house.floor} Floor</p>
                  <p className="text-sm text-green-800">{stats.assignment.house.section}</p>
                </div>
                <div>
                  <p className="text-xs text-green-700">Monthly Rent</p>
                  <p className="font-bold text-green-900">KSh {stats.assignment.house.price.toLocaleString()}</p>
                </div>
              </div>

              {stats.assignment.house.amenities && stats.assignment.house.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {stats.assignment.house.amenities.slice(0, 3).map((amenity: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs bg-white border-green-300 text-green-700">
                      {amenity}
                    </Badge>
                  ))}
                  {stats.assignment.house.amenities.length > 3 && (
                    <Badge variant="outline" className="text-xs bg-white border-green-300 text-green-700">
                      +{stats.assignment.house.amenities.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-sm bg-gradient-to-r from-orange-50 to-orange-100">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-3" />
              <h3 className="font-semibold text-orange-900 mb-2">No Room Assigned</h3>
              <p className="text-sm text-orange-700">Contact admin to get a room assigned</p>
            </CardContent>
          </Card>
        )}

        {/* Quick Pay Rent Section */}
        <Collapsible open={payRentOpen} onOpenChange={setPayRentOpen}>
          <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-blue-100">
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-3 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">Pay Rent</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {stats.thisMonthRent > 0 ? (
                      <Badge className="bg-green-600 text-white">Paid</Badge>
                    ) : (
                      <Badge className="bg-red-500 text-white">Pending</Badge>
                    )}
                    {payRentOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <PayRent assignment={stats.assignment} />
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Quick Stats - Mobile Native */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <Wrench className="h-6 w-6 text-orange-500 mx-auto mb-2" />
              <p className="text-lg font-bold">{stats.pendingRequests}</p>
              <p className="text-xs text-gray-600">Requests</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <Bell className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <p className="text-lg font-bold">{stats.announcements}</p>
              <p className="text-xs text-gray-600">News</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <Calendar className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <p className="text-lg font-bold">{new Date().getDate()}</p>
              <p className="text-xs text-gray-600">Today</p>
            </CardContent>
          </Card>
        </div>

        {/* Community WhatsApp Group - Mobile Native */}
        <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-6 w-6 text-green-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900">Community Group</h3>
                <p className="text-sm text-green-700">Connect with residents</p>
              </div>
              <Button 
                onClick={() => window.open('https://chat.whatsapp.com/your-group-link', '_blank')}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Join
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mobile-Native Tabs */}
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 h-12 bg-white shadow-sm">
            <TabsTrigger value="profile" className="text-xs py-3 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900">Profile</TabsTrigger>
            <TabsTrigger value="maintenance" className="text-xs py-3 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-900">Repair</TabsTrigger>
            <TabsTrigger value="rent" className="text-xs py-3 data-[state=active]:bg-green-100 data-[state=active]:text-green-900">Rent</TabsTrigger>
            <TabsTrigger value="announcements" className="text-xs py-3 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900">News</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <TenantProfile user={user} assignment={stats.assignment} onUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="maintenance" className="mt-6">
            <MaintenanceRequests user={user} assignment={stats.assignment} onUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="rent" className="mt-6">
            <RentPayments user={user} assignment={stats.assignment} />
          </TabsContent>

          <TabsContent value="announcements" className="mt-6">
            <Announcements />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TenantDashboard;
