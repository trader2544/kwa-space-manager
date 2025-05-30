
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Home, DollarSign, MapPin, Wifi, Shield, Droplets, Search, Filter } from 'lucide-react';

interface House {
  id: string;
  room_name: string;
  floor: string;
  section: string;
  price: number;
  room_type: string;
  is_vacant: boolean;
  amenities: string[];
}

const HouseSearch = () => {
  const [houses, setHouses] = useState<House[]>([]);
  const [filteredHouses, setFilteredHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [floorFilter, setFloorFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchHouses();
  }, []);

  useEffect(() => {
    filterHouses();
  }, [houses, searchTerm, floorFilter, priceFilter]);

  const fetchHouses = async () => {
    try {
      const { data, error } = await supabase
        .from('houses')
        .select('*')
        .eq('is_vacant', true)
        .order('floor')
        .order('section')
        .order('room_name');

      if (error) throw error;
      setHouses(data || []);
    } catch (error) {
      console.error('Error fetching houses:', error);
      toast({
        title: "Error",
        description: "Failed to fetch available rooms.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterHouses = () => {
    let filtered = houses;

    if (searchTerm) {
      filtered = filtered.filter(house => 
        house.room_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        house.section.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (floorFilter !== 'all') {
      filtered = filtered.filter(house => house.floor === floorFilter);
    }

    if (priceFilter !== 'all') {
      filtered = filtered.filter(house => {
        const price = house.price;
        switch (priceFilter) {
          case 'under-5000': return price < 5000;
          case '5000-8000': return price >= 5000 && price <= 8000;
          case 'over-8000': return price > 8000;
          default: return true;
        }
      });
    }

    setFilteredHouses(filtered);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading available rooms...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Available Rooms
          </CardTitle>
          <CardDescription>
            Find the perfect room for your stay
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                placeholder="Search by room name or section..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div>
              <Select value={floorFilter} onValueChange={setFloorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by floor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Floors</SelectItem>
                  <SelectItem value="Ground">Ground Floor</SelectItem>
                  <SelectItem value="First">First Floor</SelectItem>
                  <SelectItem value="Second">Second Floor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="under-5000">Under KSh 5,000</SelectItem>
                  <SelectItem value="5000-8000">KSh 5,000 - 8,000</SelectItem>
                  <SelectItem value="over-8000">Over KSh 8,000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Rooms */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredHouses.map((house) => (
          <Card key={house.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{house.room_name}</CardTitle>
                <Badge variant="secondary">{house.room_type}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{house.floor} Floor - {house.section}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="text-2xl font-bold text-green-600">
                    KSh {house.price.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500">/month</span>
                </div>

                {house.amenities && house.amenities.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Amenities:</p>
                    <div className="flex flex-wrap gap-1">
                      {house.amenities.map((amenity, index) => {
                        const getAmenityIcon = (amenity: string) => {
                          if (amenity.toLowerCase().includes('wifi')) return <Wifi className="h-3 w-3" />;
                          if (amenity.toLowerCase().includes('security')) return <Shield className="h-3 w-3" />;
                          if (amenity.toLowerCase().includes('water')) return <Droplets className="h-3 w-3" />;
                          return null;
                        };

                        return (
                          <Badge key={index} variant="outline" className="text-xs flex items-center gap-1">
                            {getAmenityIcon(amenity)}
                            {amenity}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                <Button 
                  className="w-full" 
                  onClick={() => window.open('https://wa.me/254716722003?text=Hello! I am interested in ' + house.room_name + ' on ' + house.floor + ' floor in ' + house.section + '.', '_blank')}
                >
                  <Home className="h-4 w-4 mr-2" />
                  Inquire About This Room
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredHouses.length === 0 && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-gray-500">
              <Home className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Rooms Found</h3>
              <p>No rooms match your current filters. Try adjusting your search criteria.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HouseSearch;
