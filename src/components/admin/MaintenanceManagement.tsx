
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Wrench, AlertCircle, CheckCircle, Clock, User, Home } from 'lucide-react';

interface MaintenanceRequest {
  id: string;
  request_type: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  tenant: {
    full_name: string;
    email: string;
    phone: string;
  };
  house: {
    room_name: string;
    floor: string;
    section: string;
  };
}

interface MaintenanceManagementProps {
  onStatsUpdate: () => void;
}

const MaintenanceManagement = ({ onStatsUpdate }: MaintenanceManagementProps) => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingRequest, setUpdatingRequest] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          tenant:profiles!maintenance_requests_tenant_id_fkey(full_name, email, phone),
          house:houses!maintenance_requests_house_id_fkey(room_name, floor, section)
        `)
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

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      setUpdatingRequest(requestId);
      
      const { error } = await supabase
        .from('maintenance_requests')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (error) throw error;

      await fetchRequests();
      onStatsUpdate();
      
      toast({
        title: "Success",
        description: "Request status updated successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update request status.",
        variant: "destructive",
      });
    } finally {
      setUpdatingRequest(null);
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
        return <AlertCircle className="h-4 w-4 text-green-600" />;
      case 'network':
        return <AlertCircle className="h-4 w-4 text-purple-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

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
          <CardTitle>Maintenance Requests</CardTitle>
          <CardDescription>
            Manage and track all maintenance, waste, and network requests
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span>{request.tenant.full_name}</span>
                        <Home className="h-4 w-4 ml-2" />
                        <span>{request.house.room_name} - {request.house.floor} Floor</span>
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
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Request Type:</p>
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
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Created: {new Date(request.created_at).toLocaleDateString()}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Select
                        value={request.status}
                        onValueChange={(newStatus) => updateRequestStatus(request.id, newStatus)}
                        disabled={updatingRequest === request.id}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {updatingRequest === request.id && (
                        <div className="text-sm text-gray-500">Updating...</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {requests.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No maintenance requests found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaintenanceManagement;
