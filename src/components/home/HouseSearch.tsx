
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Home, MapPin, Wifi, MessageCircle } from 'lucide-react';

interface House {
  id: string;
  room_name: string;
  floor: string;
  section: string;
  room_type: string;
  price: number;
  amenities: string[];
}

const HouseSearch = () => {
  const [houses, setHouses] = useState<House[]>([]);
  const [filteredHouses, setFilteredHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [floorFilter, setFloorFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchVacantHouses();
  }, []);

  useEffect(() => {
    filterHouses();
  }, [houses, searchTerm, floorFilter, priceFilter]);

  const fetchVacantHouses = async () => {
    try {
      const { data, error } = await supabase
        .from('houses')
        .select('*')
        .eq('is_vacant', true)
        .order('price');

      if (error) throw error;
      setHouses(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch available houses.",
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
        house.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
        house.room_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (floorFilter) {
      filtered = filtered.filter(house => house.floor === floorFilter);
    }

    if (priceFilter) {
      const [min, max] = priceFilter.split('-').map(Number);
      filtered = filtered.filter(house => {
        if (max) {
          return house.price >= min && house.price <= max;
        } else {
          return house.price >= min;
        }
      });
    }

    setFilteredHouses(filtered);
  };

  const getPriceRangeLabel = (price: number) => {
    if (price <= 2500) return 'Budget Friendly';
    if (price <= 3500) return 'Affordable';
    if (price <= 4500) return 'Premium';
    return 'Luxury';
  };

  const handleInquire = (house: House) => {
    // Placeholder for WhatsApp link functionality
    toast({
      title: "Inquiry",
      description: `Inquiring about ${house.room_name}. WhatsApp link will be added soon.`,
    });
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
            <Search className="h-5 w-5 text-blue-600" />
            Find Your Perfect Room
          </CardTitle>
          <CardDescription>
            Search through our available student accommodations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Search rooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div>
              <Select value={floorFilter} onValueChange={setFloorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Floor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Floors</SelectItem>
                  <SelectItem value="Ground">Ground Floor</SelectItem>
                  <SelectItem value="First">First Floor</SelectItem>
                  <SelectItem value="Second">Second Floor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Prices</SelectItem>
                  <SelectItem value="0-2500">Under KSh 2,500</SelectItem>
                  <SelectItem value="2500-3500">KSh 2,500 - 3,500</SelectItem>
                  <SelectItem value="3500-4500">KSh 3,500 - 4,500</SelectItem>
                  <SelectItem value="4500">Above KSh 4,500</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setFloorFilter('');
                  setPriceFilter('');
                }}
                variant="outline"
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHouses.map((house) => (
          <Card key={house.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{house.room_name}</CardTitle>
                  <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                    <MapPin className="h-3 w-3" />
                    {house.floor} Floor - {house.section}
                  </div>
                </div>
                <Badge variant="outline" className="capitalize">
                  {house.room_type}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-green-600">
                  KSh {house.price.toLocaleString()}
                </span>
                <Badge variant="secondary">
                  {getPriceRangeLabel(house.price)}
                </Badge>
              </div>
              
              {house.amenities && house.amenities.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Amenities:</p>
                  <div className="flex flex-wrap gap-1">
                    {house.amenities.slice(0, 4).map((amenity, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                    {house.amenities.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{house.amenities.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Wifi className="h-4 w-4" />
                <span>Free WiFi Available</span>
              </div>
              
              <Button 
                onClick={() => handleInquire(house)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Inquire Now
              </Button>
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
              <p>Try adjusting your search criteria to find available rooms.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HouseSearch;
