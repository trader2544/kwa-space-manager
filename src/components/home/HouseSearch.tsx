
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Home, MapPin, DollarSign, MessageSquare, Search, Filter } from 'lucide-react';

interface House {
  id: string;
  room_name: string;
  room_type: string;
  floor: string;
  section: string;
  price: number;
  amenities: string[];
  is_vacant: boolean;
}

const HouseSearch = () => {
  const [houses, setHouses] = useState<House[]>([]);
  const [filteredHouses, setFilteredHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const [floorFilter, setFloorFilter] = useState('');
  const [roomTypeFilter, setRoomTypeFilter] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchVacantHouses();
  }, []);

  useEffect(() => {
    filterHouses();
  }, [houses, searchTerm, priceFilter, floorFilter, roomTypeFilter]);

  const fetchVacantHouses = async () => {
    try {
      console.log('Fetching vacant houses...');
      const { data, error } = await supabase
        .from('houses')
        .select('*')
        .eq('is_vacant', true)
        .order('price');

      if (error) {
        console.error('Error fetching houses:', error);
        throw error;
      }

      console.log('Fetched houses:', data);
      setHouses(data || []);
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

    if (searchTerm) {
      filtered = filtered.filter(house => 
        house.room_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        house.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
        house.amenities.some(amenity => 
          amenity.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
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

    if (floorFilter) {
      filtered = filtered.filter(house => house.floor === floorFilter);
    }

    if (roomTypeFilter) {
      filtered = filtered.filter(house => house.room_type === roomTypeFilter);
    }

    setFilteredHouses(filtered);
  };

  const handleInquiry = (house: House) => {
    const message = `Hello! I'm interested in room ${house.room_name} (${house.room_type}) on ${house.floor} floor in ${house.section} section. The monthly rent is KSh ${house.price.toLocaleString()}. Can you provide more information?`;
    const whatsappUrl = `https://wa.me/254707947594?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Home className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading available rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Your Perfect Room
          </CardTitle>
          <CardDescription>
            Search and filter available rooms at Kwa Kamande
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Search rooms, sections, amenities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Prices</SelectItem>
                <SelectItem value="0-5000">Under KSh 5,000</SelectItem>
                <SelectItem value="5000-8000">KSh 5,000 - 8,000</SelectItem>
                <SelectItem value="8000-12000">KSh 8,000 - 12,000</SelectItem>
                <SelectItem value="12000">Above KSh 12,000</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={floorFilter} onValueChange={setFloorFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Floor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Floors</SelectItem>
                <SelectItem value="Ground">Ground Floor</SelectItem>
                <SelectItem value="First">First Floor</SelectItem>
                <SelectItem value="Second">Second Floor</SelectItem>
                <SelectItem value="Third">Third Floor</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={roomTypeFilter} onValueChange={setRoomTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Room Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="single">Single Room</SelectItem>
                <SelectItem value="shared">Shared Room</SelectItem>
                <SelectItem value="bedsitter">Bedsitter</SelectItem>
                <SelectItem value="studio">Studio</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {(searchTerm || priceFilter || floorFilter || roomTypeFilter) && (
            <div className="mt-4 flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setPriceFilter('');
                  setFloorFilter('');
                  setRoomTypeFilter('');
                }}
              >
                Clear Filters
              </Button>
              <span className="text-sm text-gray-600 flex items-center">
                {filteredHouses.length} room{filteredHouses.length !== 1 ? 's' : ''} found
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHouses.map((house) => (
          <Card key={house.id} className="border-2 hover:border-green-300 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{house.room_name}</CardTitle>
                  <CardDescription className="capitalize">{house.room_type}</CardDescription>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Available
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{house.floor} Floor - {house.section} Section</span>
              </div>
              
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-xl font-bold text-green-600">
                  KSh {house.price.toLocaleString()}
                </span>
                <span className="text-sm text-gray-600">/month</span>
              </div>
              
              {house.amenities && house.amenities.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Amenities:</p>
                  <div className="flex flex-wrap gap-1">
                    {house.amenities.slice(0, 3).map((amenity, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                    {house.amenities.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{house.amenities.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              
              <Button 
                onClick={() => handleInquiry(house)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Inquire About This Room
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredHouses.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <Home className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Rooms Found</h3>
              <p className="text-gray-600 mb-4">
                {houses.length === 0 
                  ? "All rooms are currently occupied. Please check back later or contact us for updates."
                  : "No rooms match your search criteria. Try adjusting your filters."
                }
              </p>
              <Button 
                onClick={() => window.open('https://wa.me/254707947594?text=Hello! I\'m looking for accommodation at Kwa Kamande. Are there any rooms available?', '_blank')}
                variant="outline"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Contact Us for Updates
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HouseSearch;
