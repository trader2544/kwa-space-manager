
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Home, Users, DollarSign } from 'lucide-react';

interface House {
  id: string;
  floor: string;
  section: string;
  room_name: string;
  room_type: string;
  price: number;
  is_vacant: boolean;
  amenities: string[];
}

interface HousesManagementProps {
  onStatsUpdate: () => void;
}

const HousesManagement = ({ onStatsUpdate }: HousesManagementProps) => {
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchHouses();
  }, []);

  const fetchHouses = async () => {
    try {
      const { data, error } = await supabase
        .from('houses')
        .select('*')
        .order('floor', { ascending: true });

      if (error) throw error;
      setHouses(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch houses data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleVacancy = async (houseId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('houses')
        .update({ is_vacant: !currentStatus })
        .eq('id', houseId);

      if (error) throw error;

      await fetchHouses();
      onStatsUpdate();
      
      toast({
        title: "Success",
        description: `House status updated successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update house status.",
        variant: "destructive",
      });
    }
  };

  const filteredHouses = houses.filter(house =>
    house.room_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    house.floor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    house.section.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedHouses = filteredHouses.reduce((acc, house) => {
    const key = `${house.floor} - ${house.section}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(house);
    return acc;
  }, {} as Record<string, House[]>);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading houses...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Houses Management</CardTitle>
          <CardDescription>
            Manage all houses in Kwa Kamande property
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search houses by name, floor, or section..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          {Object.entries(groupedHouses).map(([sectionKey, sectionHouses]) => (
            <div key={sectionKey} className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">{sectionKey}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sectionHouses.map((house) => (
                  <Card key={house.id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{house.room_name}</CardTitle>
                        <Badge variant={house.is_vacant ? "secondary" : "default"}>
                          {house.is_vacant ? "Vacant" : "Occupied"}
                        </Badge>
                      </div>
                      <CardDescription className="capitalize">
                        {house.room_type}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                          <span className="font-semibold">KSh {house.price.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      {house.amenities.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Amenities:</p>
                          <div className="flex flex-wrap gap-1">
                            {house.amenities.map((amenity, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {amenity}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button
                        variant={house.is_vacant ? "default" : "outline"}
                        size="sm"
                        className="w-full"
                        onClick={() => toggleVacancy(house.id, house.is_vacant)}
                      >
                        Mark as {house.is_vacant ? "Occupied" : "Vacant"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default HousesManagement;
