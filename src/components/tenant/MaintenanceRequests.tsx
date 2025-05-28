
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
import { Wrench, Plus, AlertCircle, CheckCircle, Clock, Wifi, Trash2 } from 'lucide-react';

interface MaintenanceRequest {
  id: string;
  request_type: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

interface MaintenanceRequestsProps {
  user: any;
  assignment: any;
  onUpdate: () => void;
}

const MaintenanceRequests = ({ user, assignment, onUpdate }: MaintenanceRequestsProps) => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRequest, setNewRequest] = useState({
    request_type: 'maintenance',
    title: '',
    description: '',
    priority: 'medium',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (assignment) {
      fetchRequests();
    }
  }, [assignment]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('tenant_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch maintenance requests.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitRequest = async () => {
    try {
      if (!assignment) {
        toast({
          title: "Error",
          description: "You need to be assigned a house first.",
          variant: "destructive",
        });
        return;
      }

      if (!newRequest.title.trim()) {
        toast({
          title: "Error",
          description: "Please provide a title for your request.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('maintenance_requests')
        .insert({
          tenant_id: user.id,
          house_id: assignment.house_id,
          request_type: newRequest.request_type,
          title: newRequest.title,
          description: newRequest.description,
          priority: newRequest.priority,
          status: 'pending',
        });

      if (error) throw error;

      setNewRequest({
        request_type: 'maintenance',
        title: '',
        description: '',
        priority: 'medium',
      });
      setShowAddForm(false);
      await fetchRequests();
      onUpdate();
      
      toast({
        title: "Success",
        description: "Maintenance request submitted successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to submit request.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'in_progress':
        return <AlertCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'in_progress':
        return 'default';
      case 'completed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'maintenance':
        return <Wrench className="h-4 w-4 text-blue-600" />;
      case 'waste':
        return <Trash2 className="h-4 w-4 text-green-600" />;
      case 'network':
        return <Wifi className="h-4 w-4 text-purple-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  if (!assignment) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No House Assigned</h3>
            <p className="text-gray-600">You need to be assigned a house before you can submit maintenance requests.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading maintenance requests...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Maintenance Requests</CardTitle>
              <CardDescription>
                Submit and track maintenance, waste, and network issues
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAddForm && (
            <Card className="mb-6 border-dashed">
              <CardHeader>
                <CardTitle className="text-lg">Submit New Request</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Request Type</Label>
                    <Select value={newRequest.request_type} onValueChange={(value) => 
                      setNewRequest(prev => ({ ...prev, request_type: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="waste">Waste Management</SelectItem>
                        <SelectItem value="network">Network Issues</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Priority</Label>
                    <Select value={newRequest.priority} onValueChange={(value) => 
                      setNewRequest(prev => ({ ...prev, priority: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label>Title</Label>
                  <Input
                    value={newRequest.title}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Brief description of the issue"
                  />
                </div>
                
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newRequest.description}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed description of the issue"
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={submitRequest}>
                    Submit Request
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id} className="border-l-4 border-l-orange-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getRequestTypeIcon(request.request_type)}
                        <CardTitle className="text-lg">{request.title}</CardTitle>
                      </div>
                      <div className="text-sm text-gray-600">
                        Submitted: {new Date(request.created_at).toLocaleDateString()}
                        {request.updated_at !== request.created_at && (
                          <span> • Updated: {new Date(request.updated_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge variant={getStatusColor(request.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(request.status)}
                          {request.status.replace('_', ' ')}
                        </div>
                      </Badge>
                      <Badge variant={getPriorityColor(request.priority)}>
                        {request.priority} priority
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Badge variant="outline" className="capitalize">
                      {request.request_type}
                    </Badge>
                  </div>
                  
                  {request.description && (
                    <div>
                      <p className="text-sm font-medium mb-1">Description:</p>
                      <p className="text-sm text-gray-600">{request.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {requests.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No maintenance requests submitted yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaintenanceRequests;
