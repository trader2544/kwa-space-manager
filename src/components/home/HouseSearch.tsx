
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Home, Search, Filter, MapPin, DollarSign, MessageSquare } from 'lucide-react';

interface House {
  id: string;
  room_name: string;
  room_type: string;
  floor: string;
  section: string;
  price: number;
  amenities: string[];
  description?: string;
  is_vacant: boolean;
}

const HouseSearch = () => {
  const [houses, setHouses] = useState<House[]>([]);
  const [filteredHouses, setFilteredHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const [roomTypeFilter, setRoomTypeFilter] = useState('');
  const [floorFilter, setFloorFilter] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchVacantHouses();
  }, []);

  useEffect(() => {
    filterHouses();
  }, [houses, searchTerm, priceFilter, roomTypeFilter, floorFilter]);

  const fetchVacantHouses = async () => {
    try {
      console.log('Fetching vacant houses...');
      
      const { data, error } = await supabase
        .from('houses')
        .select('*')
        .eq('is_vacant', true)
        .order('price', { ascending: true });

      if (error) {
        console.error('Error fetching houses:', error);
        throw error;
      }
      
      console.log('Fetched vacant houses:', data);
      // Ensure description field exists, even if null/empty
      const housesWithDescription = (data || []).map(house => ({
        ...house,
        description: house.description || ''
      }));
      setHouses(housesWithDescription);
    } catch (error: any) {
      console.error('Error in fetchVacantHouses:', error);
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

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(house => 
        house.room_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        house.room_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        house.section.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Price filter
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

    // Room type filter
    if (roomTypeFilter) {
      filtered = filtered.filter(house => house.room_type === roomTypeFilter);
    }

    // Floor filter
    if (floorFilter) {
      filtered = filtered.filter(house => house.floor === floorFilter);
    }

    setFilteredHouses(filtered);
  };

  const handleInquiry = (house: House) => {
    const message = `Hello! I'm interested in ${house.room_name} (${house.room_type}) on ${house.floor} floor, section ${house.section}. The monthly rent is KSh ${house.price.toLocaleString()}. Please provide more details.`;
    const whatsappUrl = `https://wa.me/254707947594?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setPriceFilter('');
    setRoomTypeFilter('');
    setFloorFilter('');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <Home className="h-12 w-12 text-gray-300 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">Loading available rooms...</p>
          </div>
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
            Search and filter through our available accommodations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by room name, type, or section..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0-5000">Under KSh 5,000</SelectItem>
                <SelectItem value="5000-10000">KSh 5,000 - 10,000</SelectItem>
                <SelectItem value="10000-15000">KSh 10,000 - 15,000</SelectItem>
                <SelectItem value="15000-20000">KSh 15,000 - 20,000</SelectItem>
                <SelectItem value="20000">Above KSh 20,000</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roomTypeFilter} onValueChange={setRoomTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Room Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Room</SelectItem>
                <SelectItem value="double">Double Room</SelectItem>
                <SelectItem value="bedsitter">Bedsitter</SelectItem>
                <SelectItem value="studio">Studio</SelectItem>
              </SelectContent>
            </Select>

            <Select value={floorFilter} onValueChange={setFloorFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Floor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ground">Ground Floor</SelectItem>
                <SelectItem value="1st">1st Floor</SelectItem>
                <SelectItem value="2nd">2nd Floor</SelectItem>
                <SelectItem value="3rd">3rd Floor</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={clearFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{filteredHouses.length} rooms available</span>
            {(searchTerm || priceFilter || roomTypeFilter || floorFilter) && (
              <span>Showing filtered results</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Houses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHouses.map((house) => (
          <Card key={house.id} className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Home className="h-5 w-5 text-green-600" />
                    {house.room_name}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{house.floor} Floor - {house.section}</span>
                  </div>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {house.room_type.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Monthly Rent:</span>
                <span className="text-lg font-bold text-green-600 flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  KSh {house.price.toLocaleString()}
                </span>
              </div>

              {house.description && (
                <p className="text-sm text-gray-600">{house.description}</p>
              )}

              {house.amenities && house.amenities.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Amenities:</p>
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
                onClick={() => handleInquiry(house)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Inquire Now
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredHouses.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <Home className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Rooms Found</h3>
              <p className="text-gray-600 mb-4">
                {houses.length === 0 
                  ? "No vacant rooms are currently available." 
                  : "No rooms match your search criteria. Try adjusting your filters."
                }
              </p>
              {(searchTerm || priceFilter || roomTypeFilter || floorFilter) && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HouseSearch;
