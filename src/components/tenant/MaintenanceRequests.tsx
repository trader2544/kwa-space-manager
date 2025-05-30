
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Wrench, Plus, Calendar, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface MaintenanceRequest {
  id: string;
  tenant_id: string;
  house_id: string;
  title: string;
  description: string;
  request_type: string;
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

const statusColors: Record<string, string> = {
  pending: 'bg-orange-500 text-white',
  in_progress: 'bg-blue-500 text-white',
  completed: 'bg-green-600 text-white',
  cancelled: 'bg-gray-500 text-white',
};

const priorityIcons: Record<string, JSX.Element> = {
  high: <AlertTriangle className="h-4 w-4 text-red-600" />,
  medium: <Clock className="h-4 w-4 text-orange-600" />,
  low: <Clock className="h-4 w-4 text-blue-600" />,
};

const MaintenanceRequests = ({ user, assignment, onUpdate }: MaintenanceRequestsProps) => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    request_type: '',
    priority: 'medium',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    try {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('tenant_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      console.error('Error fetching maintenance requests:', error);
      toast({
        title: "Error",
        description: "Failed to load maintenance requests.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createRequest = async () => {
    try {
      if (!assignment) {
        toast({
          title: "Error",
          description: "You don't have a room assigned.",
          variant: "destructive",
        });
        return;
      }

      if (!newRequest.title || !newRequest.request_type) {
        toast({
          title: "Error",
          description: "Please fill all required fields.",
          variant: "destructive",
        });
        return;
      }

      setIsSubmitting(true);
      const { error } = await supabase
        .from('maintenance_requests')
        .insert({
          tenant_id: user.id,
          house_id: assignment.house_id,
          title: newRequest.title,
          description: newRequest.description,
          request_type: newRequest.request_type,
          priority: newRequest.priority,
          status: 'pending',
        });

      if (error) throw error;

      setNewRequest({
        title: '',
        description: '',
        request_type: '',
        priority: 'medium',
      });
      setShowDialog(false);
      toast({
        title: "Success",
        description: "Maintenance request submitted successfully!",
      });
      
      await fetchRequests();
      onUpdate();
    } catch (error: any) {
      console.error('Error creating maintenance request:', error);
      toast({
        title: "Error",
        description: "Failed to submit maintenance request.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('maintenance_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Request cancelled successfully!",
      });
      
      await fetchRequests();
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to cancel request.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeClass = (status: string) => {
    return statusColors[status] || 'bg-gray-500 text-white';
  };

  const getPriorityIcon = (priority: string) => {
    return priorityIcons[priority] || <Clock className="h-4 w-4 text-gray-600" />;
  };

  const getRequestTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
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

  if (!assignment) {
    return (
      <Card className="border-0 shadow-lg bg-orange-50">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-orange-600 mx-auto mb-3" />
          <h3 className="font-semibold text-orange-900 mb-2">No Room Assigned</h3>
          <p className="text-sm text-orange-800 mb-4">
            You need to be assigned a room before you can submit maintenance requests.
          </p>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
            className="border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            Contact Admin
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 to-orange-100">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Wrench className="h-6 w-6 text-orange-600" />
              <div>
                <h2 className="font-bold text-orange-900">Repair Requests</h2>
                <p className="text-sm text-orange-700">Report maintenance issues</p>
              </div>
            </div>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Button>
              </DialogTrigger>
              <DialogContent className="mx-4 max-w-sm">
                <DialogHeader>
                  <DialogTitle>New Repair Request</DialogTitle>
                  <DialogDescription>
                    Submit a maintenance request for your room
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <Label htmlFor="request-type">Request Type*</Label>
                    <Select 
                      value={newRequest.request_type} 
                      onValueChange={(value) => setNewRequest({...newRequest, request_type: value})}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select type of repair" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="plumbing">Plumbing</SelectItem>
                        <SelectItem value="electrical">Electrical</SelectItem>
                        <SelectItem value="appliance">Appliance</SelectItem>
                        <SelectItem value="pest_control">Pest Control</SelectItem>
                        <SelectItem value="structural">Structural</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="title">Title*</Label>
                    <Input
                      id="title"
                      value={newRequest.title}
                      onChange={(e) => setNewRequest({...newRequest, title: e.target.value})}
                      placeholder="Brief description of issue"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Details</Label>
                    <Textarea
                      id="description"
                      value={newRequest.description}
                      onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
                      placeholder="Explain the issue in detail"
                      rows={3}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select 
                      value={newRequest.priority} 
                      onValueChange={(value) => setNewRequest({...newRequest, priority: value})}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low - Can Wait</SelectItem>
                        <SelectItem value="medium">Medium - Needs Attention</SelectItem>
                        <SelectItem value="high">High - Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    className="w-full mt-2 bg-orange-600 hover:bg-orange-700" 
                    onClick={createRequest}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Request"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {request.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs capitalize bg-gray-50">
                      {getRequestTypeLabel(request.request_type)}
                    </Badge>
                    <span className="text-xs text-gray-500">•</span>
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(request.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <Badge className={getStatusBadgeClass(request.status)}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </Badge>
              </div>

              {/* Request Description */}
              {request.description && (
                <div className="bg-gray-50 rounded-lg p-3 mb-3 text-sm text-gray-700">
                  {request.description}
                </div>
              )}

              {/* Request Details */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  {getPriorityIcon(request.priority)}
                  <span className="text-xs font-medium capitalize">
                    {request.priority} Priority
                  </span>
                </div>
                
                {request.status === 'pending' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => cancelRequest(request.id)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                )}
                
                {request.status === 'completed' && (
                  <div className="flex items-center gap-1.5 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">Resolved</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {requests.length === 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <Wrench className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-700 mb-2">No Requests Yet</h3>
              <p className="text-sm text-gray-500 mb-4">
                Need something fixed? Submit a new repair request!
              </p>
              <Button 
                onClick={() => setShowDialog(true)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                New Request
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MaintenanceRequests;
