
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Bell, Plus, Calendar, User, AlertCircle } from 'lucide-react';

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

interface AnnouncementsManagementProps {
  onStatsUpdate: () => void;
}

const AnnouncementsManagement = ({ onStatsUpdate }: AnnouncementsManagementProps) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    target_audience: 'all',
  });
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

  const createAnnouncement = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('announcements')
        .insert({
          title: newAnnouncement.title.trim(),
          content: newAnnouncement.content.trim(),
          target_audience: newAnnouncement.target_audience,
          admin_id: user.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Announcement created successfully!",
      });

      await fetchAnnouncements();
      onStatsUpdate();
      setNewAnnouncement({ title: '', content: '', target_audience: 'all' });
    } catch (error: any) {
      console.error('Error creating announcement:', error);
      toast({
        title: "Error",
        description: "Failed to create announcement.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const deactivateAnnouncement = async (id: string) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Announcement removed successfully!",
      });

      await fetchAnnouncements();
      onStatsUpdate();
    } catch (error: any) {
      console.error('Error deactivating announcement:', error);
      toast({
        title: "Error",
        description: "Failed to remove announcement.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile Header Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-cyan-50 to-cyan-100">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6 text-cyan-600" />
              <div>
                <h2 className="font-bold text-cyan-900">Announcements</h2>
                <p className="text-sm text-cyan-700">{announcements.length} active</p>
              </div>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700">
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Button>
              </DialogTrigger>
              <DialogContent className="mx-4 max-w-sm">
                <DialogHeader>
                  <DialogTitle>Create Announcement</DialogTitle>
                  <DialogDescription>
                    Share important updates with residents
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-medium">Title</Label>
                    <Input
                      value={newAnnouncement.title}
                      onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Announcement title"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs font-medium">Message</Label>
                    <Textarea
                      value={newAnnouncement.content}
                      onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Write your message..."
                      className="mt-1"
                      rows={4}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs font-medium">Audience</Label>
                    <Select 
                      value={newAnnouncement.target_audience} 
                      onValueChange={(value) => setNewAnnouncement(prev => ({ ...prev, target_audience: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Residents</SelectItem>
                        <SelectItem value="tenants">Tenants Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    onClick={createAnnouncement} 
                    disabled={isCreating}
                    className="w-full"
                  >
                    {isCreating ? 'Creating...' : 'Create Announcement'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Mobile-Native Announcement Cards */}
      <div className="space-y-3">
        {announcements.map((announcement) => (
          <Card key={announcement.id} className="border-0 shadow-md">
            <CardContent className="p-4">
              {/* Announcement Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Bell className="h-4 w-4 text-cyan-600" />
                    <h3 className="font-semibold text-gray-900 truncate">
                      {announcement.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                  </div>
                  {announcement.admin && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <User className="h-3 w-3" />
                      <span>By {announcement.admin.full_name}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <Badge variant="outline" className="text-xs capitalize">
                    {announcement.target_audience.replace('_', ' ')}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deactivateAnnouncement(announcement.id)}
                    className="text-xs px-2 py-1 h-7 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                </div>
              </div>

              {/* Announcement Content */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {announcement.content}
                </p>
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
                Create your first announcement to notify residents
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsManagement;
