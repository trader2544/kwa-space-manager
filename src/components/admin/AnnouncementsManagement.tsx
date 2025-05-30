
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Bell, Plus, Eye, EyeOff, MessageSquare, Calendar, User } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  target_audience: string;
  target_filter: any;
  is_active: boolean;
  created_at: string;
  admin: {
    full_name: string;
    email: string;
  };
}

const AnnouncementsManagement = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    target_audience: 'all',
    target_filter: {},
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          admin:profiles!announcements_admin_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch announcements.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addAnnouncement = async () => {
    try {
      if (!newAnnouncement.title || !newAnnouncement.content) {
        toast({
          title: "Error",
          description: "Please fill in title and content.",
          variant: "destructive",
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('announcements')
        .insert({
          admin_id: user.id,
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          target_audience: newAnnouncement.target_audience,
          target_filter: newAnnouncement.target_filter,
          is_active: true,
        });

      if (error) throw error;

      setNewAnnouncement({
        title: '',
        content: '',
        target_audience: 'all',
        target_filter: {},
      });
      setShowAddForm(false);
      await fetchAnnouncements();
      
      toast({
        title: "Success",
        description: "Announcement created successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create announcement.",
        variant: "destructive",
      });
    }
  };

  const toggleAnnouncementStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      await fetchAnnouncements();
      
      toast({
        title: "Success",
        description: `Announcement ${!currentStatus ? 'activated' : 'deactivated'} successfully!`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update announcement status.",
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
                <h2 className="font-bold text-cyan-900">News & Updates</h2>
                <p className="text-sm text-cyan-700">{announcements.length} announcements</p>
              </div>
            </div>
            <Button 
              size="sm" 
              onClick={() => setShowAddForm(true)}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create New Announcement Form */}
      {showAddForm && (
        <Card className="border-0 shadow-md border-dashed border-cyan-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-cyan-600" />
              <h3 className="font-semibold text-cyan-900">Create Announcement</h3>
            </div>
            
            <div className="space-y-3">
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
                  placeholder="Your announcement message..."
                  rows={3}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label className="text-xs font-medium">Target Audience</Label>
                <Select 
                  value={newAnnouncement.target_audience} 
                  onValueChange={(value) => setNewAnnouncement(prev => ({ ...prev, target_audience: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tenants</SelectItem>
                    <SelectItem value="specific_floor">Specific Floor</SelectItem>
                    <SelectItem value="specific_section">Specific Section</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={addAnnouncement}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                >
                  Publish
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                    <h3 className="font-semibold text-gray-900 truncate">{announcement.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                    <User className="h-3 w-3" />
                    <span>{announcement.admin?.full_name || 'Admin'}</span>
                    <span>•</span>
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Badge 
                    variant={announcement.is_active ? "default" : "secondary"}
                    className={announcement.is_active ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700"}
                  >
                    {announcement.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize">
                    {announcement.target_audience.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              {/* Announcement Content */}
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <p className="text-sm text-gray-700 leading-relaxed">{announcement.content}</p>
              </div>
              
              {/* Action Button */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAnnouncementStatus(announcement.id, announcement.is_active)}
                  className="text-xs"
                >
                  {announcement.is_active ? (
                    <>
                      <EyeOff className="h-3 w-3 mr-1" />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3 mr-1" />
                      Show
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {announcements.length === 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-700 mb-2">No Announcements</h3>
              <p className="text-sm text-gray-500">Create your first announcement to get started</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsManagement;
