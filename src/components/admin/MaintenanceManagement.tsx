
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Wrench, AlertCircle, CheckCircle, Clock, User, Home, Phone, Calendar } from 'lucide-react';

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
        return <Clock className="h-3 w-3" />;
      case 'in_progress':
        return <AlertCircle className="h-3 w-3" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      case 'low':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
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

  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    inProgress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile Header Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 to-orange-100">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Wrench className="h-6 w-6 text-orange-600" />
              <div>
                <h2 className="font-bold text-orange-900">Maintenance</h2>
                <p className="text-sm text-orange-700">{requests.length} total requests</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-orange-200 rounded-lg p-2 text-center">
              <p className="text-xs font-medium text-orange-900">Pending</p>
              <p className="text-lg font-bold text-orange-900">{stats.pending}</p>
            </div>
            <div className="bg-blue-200 rounded-lg p-2 text-center">
              <p className="text-xs font-medium text-blue-900">In Progress</p>
              <p className="text-lg font-bold text-blue-900">{stats.inProgress}</p>
            </div>
            <div className="bg-green-200 rounded-lg p-2 text-center">
              <p className="text-xs font-medium text-green-900">Completed</p>
              <p className="text-lg font-bold text-green-900">{stats.completed}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile-Native Request Cards */}
      <div className="space-y-3">
        {requests.map((request) => (
          <Card key={request.id} className="border-0 shadow-md">
            <CardContent className="p-4">
              {/* Request Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getRequestTypeIcon(request.request_type)}
                  <h3 className="font-semibold text-gray-900 truncate">{request.title}</h3>
                </div>
                <div className="flex flex-col gap-1">
                  <Badge className={`text-xs ${getPriorityColor(request.priority)}`}>
                    {request.priority}
                  </Badge>
                  <Badge className={`text-xs ${getStatusColor(request.status)}`}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(request.status)}
                      {request.status.replace('_', ' ')}
                    </div>
                  </Badge>
                </div>
              </div>

              {/* Tenant & Room Info */}
              <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-gray-600" />
                  <span className="text-sm text-gray-900">{request.tenant.full_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Home className="h-3 w-3 text-gray-600" />
                  <span className="text-sm text-gray-700">
                    {request.house.room_name} - {request.house.floor} Floor
                  </span>
                </div>
                {request.tenant.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-gray-600" />
                    <span className="text-sm text-gray-700">{request.tenant.phone}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {request.description && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">Description:</p>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded p-2">{request.description}</p>
                </div>
              )}

              {/* Date & Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(request.created_at).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Select
                    value={request.status}
                    onValueChange={(newStatus) => updateRequestStatus(request.id, newStatus)}
                    disabled={updatingRequest === request.id}
                  >
                    <SelectTrigger className="w-32 h-8 text-xs">
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
                    <div className="text-xs text-gray-500">Updating...</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {requests.length === 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <Wrench className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-700 mb-2">No Requests</h3>
              <p className="text-sm text-gray-500">No maintenance requests found.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MaintenanceManagement;
