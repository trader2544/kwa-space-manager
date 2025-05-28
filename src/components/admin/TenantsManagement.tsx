
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
import { Users, Plus, Home, Mail, Phone } from 'lucide-react';

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

const TenantsManagement = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [selectedHouse, setSelectedHouse] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    fetchTenants();
    fetchVacantHouses();
  }, []);

  const fetchTenants = async () => {
    try {
      console.log('Fetching tenants...');
      
      // First get all tenants
      const { data: allTenants, error: tenantsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'tenant');

      if (tenantsError) {
        console.error('Error fetching tenants:', tenantsError);
        throw tenantsError;
      }

      console.log('All tenants:', allTenants);

      // Then get their assignments separately
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

      console.log('Tenants with assignments:', tenantsWithAssignments);
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

      if (error) {
        console.error('Error fetching houses:', error);
        throw error;
      }

      console.log('Vacant houses:', data);
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
      console.log('Assigning house:', selectedHouse, 'to tenant:', selectedTenant);

      // Create tenant assignment
      const { error: assignError } = await supabase
        .from('tenant_assignments')
        .insert({
          tenant_id: selectedTenant,
          house_id: selectedHouse,
        });

      if (assignError) {
        console.error('Error creating assignment:', assignError);
        throw assignError;
      }

      // Update house vacancy status
      const { error: houseError } = await supabase
        .from('houses')
        .update({ is_vacant: false })
        .eq('id', selectedHouse);

      if (houseError) {
        console.error('Error updating house status:', houseError);
        throw houseError;
      }

      toast({
        title: "Success",
        description: "House assigned successfully!",
      });

      // Refresh data
      await fetchTenants();
      await fetchVacantHouses();
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
      console.log('Unassigning house:', houseId, 'from tenant:', tenantId);

      // Deactivate assignment
      const { error: assignError } = await supabase
        .from('tenant_assignments')
        .update({ is_active: false })
        .eq('tenant_id', tenantId)
        .eq('house_id', houseId)
        .eq('is_active', true);

      if (assignError) {
        console.error('Error deactivating assignment:', assignError);
        throw assignError;
      }

      // Update house vacancy status
      const { error: houseError } = await supabase
        .from('houses')
        .update({ is_vacant: true })
        .eq('id', houseId);

      if (houseError) {
        console.error('Error updating house status:', houseError);
        throw houseError;
      }

      toast({
        title: "Success",
        description: "House unassigned successfully!",
      });

      await fetchTenants();
      await fetchVacantHouses();
    } catch (error: any) {
      console.error('Error in unassignHouse:', error);
      toast({
        title: "Error",
        description: "Failed to unassign house.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading tenants...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Tenants Management
              </CardTitle>
              <CardDescription>
                Manage tenant assignments and house allocations
              </CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Assign House
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign House to Tenant</DialogTitle>
                  <DialogDescription>
                    Select a tenant and a vacant house to create an assignment.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Select Tenant</Label>
                    <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a tenant" />
                      </SelectTrigger>
                      <SelectContent>
                        {tenants.filter(t => !t.assignment).map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.full_name} ({tenant.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Select House</Label>
                    <Select value={selectedHouse} onValueChange={setSelectedHouse}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a house" />
                      </SelectTrigger>
                      <SelectContent>
                        {houses.map((house) => (
                          <SelectItem key={house.id} value={house.id}>
                            {house.room_name} - {house.floor} Floor, {house.section} (KSh {house.price.toLocaleString()})
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
                    {isAssigning ? 'Assigning...' : 'Assign House'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Tenants List */}
      <div className="grid gap-4">
        {tenants.map((tenant) => (
          <Card key={tenant.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{tenant.full_name}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {tenant.email}
                    </div>
                    {tenant.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {tenant.phone}
                      </div>
                    )}
                  </div>
                </div>
                <Badge variant="outline">Tenant</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {tenant.assignment ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="font-medium">{tenant.assignment.house.room_name}</p>
                      <p className="text-sm text-gray-600">
                        {tenant.assignment.house.floor} Floor - {tenant.assignment.house.section}
                      </p>
                      <p className="text-sm text-green-600 font-medium">
                        KSh {tenant.assignment.house.price.toLocaleString()}/month
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => unassignHouse(tenant.id, tenant.assignment!.house_id)}
                  >
                    Unassign
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center py-4 text-gray-500">
                  <Home className="h-8 w-8 text-gray-300 mr-2" />
                  <span>No house assigned</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {tenants.length === 0 && (
          <Card>
            <CardContent className="p-8">
              <div className="text-center text-gray-500">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Tenants</h3>
                <p>No tenants have been registered yet.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TenantsManagement;
