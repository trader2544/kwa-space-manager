
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Bell, Calendar } from 'lucide-react';

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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading announcements...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            Announcements
          </CardTitle>
          <CardDescription>
            Important updates and announcements from management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <Card key={announcement.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">{announcement.title}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                        {announcement.admin && (
                          <>
                            <span>•</span>
                            <span>By {announcement.admin.full_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize ml-2">
                      {announcement.target_audience.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{announcement.content}</p>
                </CardContent>
              </Card>
            ))}
            
            {announcements.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Announcements</h3>
                <p>There are no active announcements at the moment.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Announcements;
