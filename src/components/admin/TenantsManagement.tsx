
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Users, Home, Phone, Mail } from 'lucide-react';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [assigningTenant, setAssigningTenant] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch tenants with their assignments
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('profiles')
        .select(`
          *,
          tenant_assignments!tenant_assignments_tenant_id_fkey(
            house_id,
            assigned_at,
            is_active,
            houses(room_name, floor, section, price)
          )
        `)
        .eq('role', 'tenant');

      if (tenantsError) throw tenantsError;

      // Transform the data to include only active assignments
      const transformedTenants = tenantsData?.map(tenant => ({
        ...tenant,
        assignment: tenant.tenant_assignments?.find(assignment => assignment.is_active) || null
      })) || [];

      // Fetch vacant houses
      const { data: housesData, error: housesError } = await supabase
        .from('houses')
        .select('*')
        .eq('is_vacant', true)
        .order('floor', { ascending: true });

      if (housesError) throw housesError;

      setTenants(transformedTenants);
      setHouses(housesData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const assignHouse = async (tenantId: string, houseId: string) => {
    try {
      setAssigningTenant(tenantId);

      // Get current user (admin)
      const { data: { user } } = await supabase.auth.getUser();
      
      // First, deactivate any existing assignments for this tenant
      await supabase
        .from('tenant_assignments')
        .update({ is_active: false })
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      // Create new assignment
      const { error: assignError } = await supabase
        .from('tenant_assignments')
        .insert({
          tenant_id: tenantId,
          house_id: houseId,
          assigned_by: user?.id,
          is_active: true
        });

      if (assignError) throw assignError;

      // Update house vacancy status
      const { error: houseError } = await supabase
        .from('houses')
        .update({ is_vacant: false })
        .eq('id', houseId);

      if (houseError) throw houseError;

      await fetchData();
      onStatsUpdate();
      
      toast({
        title: "Success",
        description: "House assigned successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to assign house.",
        variant: "destructive",
      });
    } finally {
      setAssigningTenant(null);
    }
  };

  const unassignHouse = async (tenantId: string) => {
    try {
      // Get the current assignment
      const currentAssignment = tenants.find(t => t.id === tenantId)?.assignment;
      if (!currentAssignment) return;

      // Deactivate the assignment
      const { error: assignError } = await supabase
        .from('tenant_assignments')
        .update({ is_active: false })
        .eq('tenant_id', tenantId)
        .eq('house_id', currentAssignment.house_id)
        .eq('is_active', true);

      if (assignError) throw assignError;

      // Update house vacancy status
      const { error: houseError } = await supabase
        .from('houses')
        .update({ is_vacant: true })
        .eq('id', currentAssignment.house_id);

      if (houseError) throw houseError;

      await fetchData();
      onStatsUpdate();
      
      toast({
        title: "Success",
        description: "House unassigned successfully!",
      });
    } catch (error: any) {
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
    tenant.phone?.includes(searchTerm)
  );

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
      <Card>
        <CardHeader>
          <CardTitle>Tenants Management</CardTitle>
          <CardDescription>
            Manage tenant assignments and view tenant information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Input
              placeholder="Search tenants by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTenants.map((tenant) => (
              <Card key={tenant.id} className="border-l-4 border-l-green-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{tenant.full_name || 'No Name'}</CardTitle>
                    <Badge variant={tenant.assignment ? "default" : "secondary"}>
                      {tenant.assignment ? "Assigned" : "Unassigned"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="truncate">{tenant.email}</span>
                    </div>
                    {tenant.phone && (
                      <div className="flex items-center text-sm">
                        <Phone className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{tenant.phone}</span>
                      </div>
                    )}
                  </div>

                  {tenant.assignment ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 rounded-lg border">
                        <div className="flex items-center mb-2">
                          <Home className="h-4 w-4 mr-2 text-green-600" />
                          <span className="font-medium">{tenant.assignment.house.room_name}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>{tenant.assignment.house.floor} Floor - {tenant.assignment.house.section}</p>
                          <p className="font-medium">Rent: KSh {tenant.assignment.house.price.toLocaleString()}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => unassignHouse(tenant.id)}
                      >
                        Unassign House
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Select onValueChange={(houseId) => assignHouse(tenant.id, houseId)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Assign a house" />
                        </SelectTrigger>
                        <SelectContent>
                          {houses.map((house) => (
                            <SelectItem key={house.id} value={house.id}>
                              {house.room_name} - {house.floor} ({house.section}) - KSh {house.price.toLocaleString()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {assigningTenant === tenant.id && (
                        <div className="text-sm text-gray-500">Assigning house...</div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTenants.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No tenants found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantsManagement;
