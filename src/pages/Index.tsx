
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, Settings, Bell, Home, Wrench, Trash2, Wifi } from 'lucide-react';

const Index = () => {
  const [userType, setUserType] = useState<'admin' | 'tenant' | null>(null);

  if (!userType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <Building2 className="h-12 w-12 text-blue-600 mr-3" />
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                Kwa Kamande
              </h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Modern property management system for seamless tenant and admin experience
            </p>
          </div>

          {/* User Type Selection */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-center mb-8 text-gray-800">
              Choose Your Portal
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Admin Portal */}
              <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-500 cursor-pointer transform hover:-translate-y-1">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-4 bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Settings className="h-10 w-10 text-blue-600" />
                  </div>
                  <CardTitle className="text-2xl text-blue-600">Admin Portal</CardTitle>
                  <CardDescription className="text-gray-600">
                    Manage properties, tenants, and operations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2 text-blue-500" />
                      Tenant Management
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Home className="h-4 w-4 mr-2 text-blue-500" />
                      House Assignments
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Bell className="h-4 w-4 mr-2 text-blue-500" />
                      Rent Tracking & Reminders
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Wrench className="h-4 w-4 mr-2 text-blue-500" />
                      Maintenance Oversight
                    </div>
                  </div>
                  <Button 
                    onClick={() => setUserType('admin')} 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Access Admin Portal
                  </Button>
                </CardContent>
              </Card>

              {/* Tenant Portal */}
              <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-green-500 cursor-pointer transform hover:-translate-y-1">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-4 bg-green-100 rounded-full w-20 h-20 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <Users className="h-10 w-10 text-green-600" />
                  </div>
                  <CardTitle className="text-2xl text-green-600">Tenant Portal</CardTitle>
                  <CardDescription className="text-gray-600">
                    Your personal dashboard and services
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <Home className="h-4 w-4 mr-2 text-green-500" />
                      Rent Payments
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Wrench className="h-4 w-4 mr-2 text-green-500" />
                      Maintenance Requests
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Trash2 className="h-4 w-4 mr-2 text-green-500" />
                      Waste Management
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Wifi className="h-4 w-4 mr-2 text-green-500" />
                      Network Support
                    </div>
                  </div>
                  <Button 
                    onClick={() => setUserType('tenant')} 
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Access Tenant Portal
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Features Overview */}
          <div className="mt-20 max-w-6xl mx-auto">
            <h3 className="text-3xl font-bold text-center mb-12 text-gray-800">
              Platform Features
            </h3>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="mx-auto mb-4 p-4 bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center">
                  <Bell className="h-8 w-8 text-purple-600" />
                </div>
                <h4 className="text-xl font-semibold mb-2 text-gray-800">Smart Notifications</h4>
                <p className="text-gray-600">Automated rent reminders and instant updates via SMS and app notifications</p>
              </div>
              
              <div className="text-center">
                <div className="mx-auto mb-4 p-4 bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center">
                  <Wrench className="h-8 w-8 text-orange-600" />
                </div>
                <h4 className="text-xl font-semibold mb-2 text-gray-800">Maintenance Hub</h4>
                <p className="text-gray-600">Streamlined request tracking for maintenance, waste, and network issues</p>
              </div>
              
              <div className="text-center">
                <div className="mx-auto mb-4 p-4 bg-teal-100 rounded-full w-16 h-16 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-teal-600" />
                </div>
                <h4 className="text-xl font-semibold mb-2 text-gray-800">Property Management</h4>
                <p className="text-gray-600">Complete oversight of houses, assignments, and tenant relationships</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render appropriate dashboard based on user type
  if (userType === 'admin') {
    return <AdminDashboard onBack={() => setUserType(null)} />;
  } else {
    return <TenantDashboard onBack={() => setUserType(null)} />;
  }
};

// Placeholder components - will be implemented next
const AdminDashboard = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <Button variant="outline" onClick={onBack}>
            Switch Portal
          </Button>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome, Admin!</h2>
          <p className="text-gray-600 mb-8">Please connect to Supabase to enable full functionality</p>
          
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-blue-600">Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                To enable tenant management, rent tracking, and all admin features, 
                please connect your project to Supabase using the green button in the top right.
              </p>
              <div className="space-y-2 text-left text-sm text-gray-600">
                <div>• User authentication</div>
                <div>• Database for houses & tenants</div>
                <div>• SMS notifications</div>
                <div>• File storage</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const TenantDashboard = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Tenant Portal</h1>
          </div>
          <Button variant="outline" onClick={onBack}>
            Switch Portal
          </Button>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome, Tenant!</h2>
          <p className="text-gray-600 mb-8">Please connect to Supabase to enable full functionality</p>
          
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-green-600">Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                To enable rent payments, maintenance requests, and all tenant features, 
                please connect your project to Supabase using the green button in the top right.
              </p>
              <div className="space-y-2 text-left text-sm text-gray-600">
                <div>• Rent payment tracking</div>
                <div>• Maintenance requests</div>
                <div>• Announcements</div>
                <div>• SMS notifications</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
