
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Bell, Calendar, User, AlertCircle } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  target_audience: string;
  target_filter: any;
  created_at: string;
  admin: {
    full_name: string;
  } | null;
}

const Announcements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      console.log('Fetching announcements...');
      
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          admin:profiles!announcements_admin_id_fkey(full_name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching announcements:', error);
        throw error;
      }
      
      console.log('Fetched announcements:', data);
      setAnnouncements(data || []);
    } catch (error: any) {
      console.error('Error in fetchAnnouncements:', error);
      toast({
        title: "Error",
        description: "Failed to fetch announcements.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading announcements...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile Header Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-blue-100">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-2 rounded-full">
              <Bell className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-blue-900">News & Updates</h2>
              <p className="text-sm text-blue-700">
                {announcements.length} announcement{announcements.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          {announcements.length > 0 && (
            <div className="bg-blue-200 rounded-lg p-2 text-center">
              <p className="text-xs text-blue-800">
                Latest: {getTimeAgo(announcements[0].created_at)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile-Native Announcement Cards */}
      <div className="space-y-3">
        {announcements.map((announcement) => (
          <Card key={announcement.id} className="border-0 shadow-md border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              {/* Announcement Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Bell className="h-4 w-4 text-blue-600" />
                    <h3 className="font-semibold text-gray-900 truncate">
                      {announcement.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                    <Calendar className="h-3 w-3" />
                    <span>{getTimeAgo(announcement.created_at)}</span>
                  </div>
                  {announcement.admin && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <User className="h-3 w-3" />
                      <span>By {announcement.admin.full_name}</span>
                    </div>
                  )}
                </div>
                <Badge 
                  variant="outline" 
                  className="text-xs capitalize bg-blue-50 border-blue-200 text-blue-700 ml-2"
                >
                  {announcement.target_audience.replace('_', ' ')}
                </Badge>
              </div>

              {/* Announcement Content */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {announcement.content}
                </p>
              </div>

              {/* Announcement Footer */}
              <div className="mt-3 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Posted {new Date(announcement.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xs text-blue-600 font-medium">New</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {announcements.length === 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-700 mb-2">No Announcements</h3>
              <p className="text-sm text-gray-500">
                There are no active announcements at the moment.
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Check back later for important updates from management.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Information Card */}
      <Card className="border-0 shadow-md bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <h3 className="font-medium text-yellow-900">Stay Informed</h3>
          </div>
          <p className="text-xs text-yellow-800">
            Important announcements about building maintenance, rent payments, 
            and community updates will appear here. Check regularly for the latest news.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Announcements;
