
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, Home, Mail, Phone, MapPin } from 'lucide-react';

interface Tenant {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: string;
  created_at: string;
  assignment?: {
    house_id: string;
    assigned_at: string;
    house: {
      room_name: string;
      floor: string;
      section: string;
      price: number;
    };
  };
}

interface House {
  id: string;
  room_name: string;
  floor: string;
  section: string;
  price: number;
  is_vacant: boolean;
}

interface TenantsManagementProps {
  onStatsUpdate: () => void;
}

const TenantsManagement = ({ onStatsUpdate }: TenantsManagementProps) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [selectedHouse, setSelectedHouse] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchTenants();
    fetchVacantHouses();
  }, []);

  const fetchTenants = async () => {
    try {
      console.log('Fetching tenants...');
      
      const { data: allTenants, error: tenantsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'tenant')
        .is('deleted_at', null);

      if (tenantsError) {
        console.error('Error fetching tenants:', tenantsError);
        throw tenantsError;
      }

      const tenantsWithAssignments = await Promise.all(
        (allTenants || []).map(async (tenant) => {
          const { data: assignment, error: assignmentError } = await supabase
            .from('tenant_assignments')
            .select(`
              house_id,
              assigned_at,
              houses!inner(
                room_name,
                floor,
                section,
                price
              )
            `)
            .eq('tenant_id', tenant.id)
            .eq('is_active', true)
            .maybeSingle();

          if (assignmentError) {
            console.error('Error fetching assignment for tenant:', tenant.id, assignmentError);
          }

          return {
            ...tenant,
            assignment: assignment ? {
              house_id: assignment.house_id,
              assigned_at: assignment.assigned_at,
              house: assignment.houses
            } : undefined
          };
        })
      );

      setTenants(tenantsWithAssignments);
    } catch (error: any) {
      console.error('Error in fetchTenants:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tenants.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVacantHouses = async () => {
    try {
      console.log('Fetching vacant houses...');
      const { data, error } = await supabase
        .from('houses')
        .select('*')
        .eq('is_vacant', true)
        .order('floor')
        .order('section')
        .order('room_name');

      if (error) throw error;
      setHouses(data || []);
    } catch (error: any) {
      console.error('Error in fetchVacantHouses:', error);
      toast({
        title: "Error",
        description: "Failed to fetch houses.",
        variant: "destructive",
      });
    }
  };

  const assignHouse = async () => {
    if (!selectedTenant || !selectedHouse) return;

    try {
      setIsAssigning(true);

      const { error: assignError } = await supabase
        .from('tenant_assignments')
        .insert({
          tenant_id: selectedTenant,
          house_id: selectedHouse,
        });

      if (assignError) throw assignError;

      const { error: houseError } = await supabase
        .from('houses')
        .update({ is_vacant: false })
        .eq('id', selectedHouse);

      if (houseError) throw houseError;

      toast({
        title: "Success",
        description: "House assigned successfully!",
      });

      await fetchTenants();
      await fetchVacantHouses();
      onStatsUpdate();
      setSelectedTenant('');
      setSelectedHouse('');
    } catch (error: any) {
      console.error('Error in assignHouse:', error);
      toast({
        title: "Error",
        description: "Failed to assign house.",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const unassignHouse = async (tenantId: string, houseId: string) => {
    try {
      const { error: assignError } = await supabase
        .from('tenant_assignments')
        .update({ is_active: false })
        .eq('tenant_id', tenantId)
        .eq('house_id', houseId)
        .eq('is_active', true);

      if (assignError) throw assignError;

      const { error: houseError } = await supabase
        .from('houses')
        .update({ is_vacant: true })
        .eq('id', houseId);

      if (houseError) throw houseError;

      toast({
        title: "Success",
        description: "House unassigned successfully!",
      });

      await fetchTenants();
      await fetchVacantHouses();
      onStatsUpdate();
    } catch (error: any) {
      console.error('Error in unassignHouse:', error);
      toast({
        title: "Error",
        description: "Failed to unassign house.",
        variant: "destructive",
      });
    }
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.assignment?.house.room_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tenants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile Header Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-green-100">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-green-600" />
              <div>
                <h2 className="font-bold text-green-900">Tenants</h2>
                <p className="text-sm text-green-700">{filteredTenants.length} residents</p>
              </div>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-1" />
                  Assign
                </Button>
              </DialogTrigger>
              <DialogContent className="mx-4 max-w-sm">
                <DialogHeader>
                  <DialogTitle>Assign House</DialogTitle>
                  <DialogDescription>
                    Connect a tenant to an available room
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-medium">Tenant</Label>
                    <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Choose tenant" />
                      </SelectTrigger>
                      <SelectContent>
                        {tenants.filter(t => !t.assignment).map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-xs font-medium">Available Room</Label>
                    <Select value={selectedHouse} onValueChange={setSelectedHouse}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Choose room" />
                      </SelectTrigger>
                      <SelectContent>
                        {houses.map((house) => (
                          <SelectItem key={house.id} value={house.id}>
                            {house.room_name} - KSh {house.price.toLocaleString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    onClick={assignHouse} 
                    disabled={!selectedTenant || !selectedHouse || isAssigning}
                    className="w-full"
                  >
                    {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search Bar */}
          <Input
            placeholder="Search tenants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white border-green-200"
          />
        </CardContent>
      </Card>

      {/* Mobile-Native Tenant Cards */}
      <div className="space-y-3">
        {filteredTenants.map((tenant) => (
          <Card key={tenant.id} className="border-0 shadow-md">
            <CardContent className="p-4">
              {/* Tenant Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {tenant.full_name || 'No Name'}
                  </h3>
                  <div className="flex items-center gap-1 mt-1">
                    <Mail className="h-3 w-3 text-gray-400" />
                    <p className="text-xs text-gray-600 truncate">{tenant.email}</p>
                  </div>
                  {tenant.phone && (
                    <div className="flex items-center gap-1 mt-1">
                      <Phone className="h-3 w-3 text-gray-400" />
                      <p className="text-xs text-gray-600">{tenant.phone}</p>
                    </div>
                  )}
                </div>
                <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
                  Tenant
                </Badge>
              </div>

              {/* Assignment Status */}
              {tenant.assignment ? (
                <div className="bg-blue-50 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">{tenant.assignment.house.room_name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-blue-600" />
                      <span className="text-blue-800">{tenant.assignment.house.floor} Floor</span>
                    </div>
                    <div className="text-blue-800">{tenant.assignment.house.section}</div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-green-600">
                      KSh {tenant.assignment.house.price.toLocaleString()}/mo
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => unassignHouse(tenant.id, tenant.assignment!.house_id)}
                      className="text-xs px-2 py-1 h-7"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <Home className="h-6 w-6 text-orange-400 mx-auto mb-1" />
                  <p className="text-xs text-orange-700">No room assigned</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {filteredTenants.length === 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-700 mb-2">No Tenants Found</h3>
              <p className="text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search' : 'No tenants registered yet'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TenantsManagement;
