
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Home, Users, DollarSign, MapPin, Search, Building } from 'lucide-react';

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
        .order('floor', { ascending: true })
        .order('section')
        .order('room_name');

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
        description: `Room status updated successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update room status.",
        variant: "destructive",
      });
    }
  };

  const filteredHouses = houses.filter(house =>
    house.room_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    house.floor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    house.section.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: houses.length,
    vacant: houses.filter(h => h.is_vacant).length,
    occupied: houses.filter(h => !h.is_vacant).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading houses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile Header Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-blue-100">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Building className="h-6 w-6 text-blue-600" />
              <div>
                <h2 className="font-bold text-blue-900">Houses</h2>
                <p className="text-sm text-blue-700">{stats.total} total rooms</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge className="bg-green-600 text-white text-xs">{stats.vacant} Vacant</Badge>
              <Badge className="bg-red-500 text-white text-xs">{stats.occupied} Occupied</Badge>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search rooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-blue-200"
            />
          </div>
        </CardContent>
      </Card>

      {/* Mobile-Native House Cards */}
      <div className="space-y-3">
        {filteredHouses.map((house) => (
          <Card key={house.id} className="border-0 shadow-md">
            <CardContent className="p-4">
              {/* House Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Home className="h-4 w-4 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">{house.room_name}</h3>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <MapPin className="h-3 w-3" />
                    <span>{house.floor} Floor • {house.section}</span>
                  </div>
                  <Badge variant="outline" className="mt-2 text-xs capitalize">
                    {house.room_type}
                  </Badge>
                </div>
                <Badge 
                  variant={house.is_vacant ? "secondary" : "default"}
                  className={house.is_vacant ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                >
                  {house.is_vacant ? "Vacant" : "Occupied"}
                </Badge>
              </div>

              {/* Price */}
              <div className="bg-green-50 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-bold text-green-900">
                    KSh {house.price.toLocaleString()}/month
                  </span>
                </div>
              </div>

              {/* Amenities */}
              {house.amenities && house.amenities.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">Amenities:</p>
                  <div className="flex flex-wrap gap-1">
                    {house.amenities.slice(0, 3).map((amenity, index) => (
                      <Badge key={index} variant="outline" className="text-xs bg-gray-50">
                        {amenity}
                      </Badge>
                    ))}
                    {house.amenities.length > 3 && (
                      <Badge variant="outline" className="text-xs bg-gray-50">
                        +{house.amenities.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Action Button */}
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
        
        {filteredHouses.length === 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <Home className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-700 mb-2">No Houses Found</h3>
              <p className="text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search' : 'No houses available'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HousesManagement;
