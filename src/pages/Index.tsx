
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AuthPage from '@/components/auth/AuthPage';
import AdminDashboard from '@/components/admin/AdminDashboard';
import TenantDashboard from '@/components/tenant/TenantDashboard';
import HouseSearch from '@/components/home/HouseSearch';
import AnimatedBackground from '@/components/home/AnimatedBackground';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, Shield, Phone, Mail, MapPin } from 'lucide-react';

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      console.log('Profile data:', data);
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSignOut = () => {
    setUser(null);
    setProfile(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <AnimatedBackground />
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show appropriate dashboard based on user role
  if (user && profile) {
    if (profile.role === 'admin') {
      return <AdminDashboard user={user} profile={profile} onSignOut={handleSignOut} />;
    } else if (profile.role === 'tenant') {
      return <TenantDashboard user={user} onSignOut={handleSignOut} />;
    }
  }

  // Show auth page if user is logged in but no profile found
  if (user && !profile) {
    return <AuthPage />;
  }

  // Public landing page with animated background
  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-2">
                <Building2 className="h-8 w-8 text-green-600" />
                <span className="text-2xl font-bold text-gray-900">Kwa-Kamande</span>
              </div>
              <AuthPage />
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Your Perfect
              <span className="text-green-600 block">Home Awaits</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Modern, comfortable, and affordable rental units in the heart of the city. 
              Experience quality living with premium amenities and excellent management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                <Phone className="h-5 w-5 mr-2" />
                Call: 0716 722 003
              </Button>
              <Button size="lg" variant="outline">
                <Mail className="h-5 w-5 mr-2" />
                Email Us
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Kwa-Kamande?</h2>
              <p className="text-lg text-gray-600">Experience the best in rental living</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <Building2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <CardTitle>Modern Facilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Well-maintained rooms with modern amenities, reliable water, and 24/7 security.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <CardTitle>Professional Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Responsive management team dedicated to providing excellent tenant services.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <Shield className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                  <CardTitle>Secure Environment</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Safe and secure premises with controlled access and reliable security measures.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Available Rooms Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50/80">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Available Rooms</h2>
              <p className="text-lg text-gray-600">Find your ideal room today</p>
            </div>
            <HouseSearch />
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Get In Touch</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center">
                <Phone className="h-8 w-8 text-green-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Phone</h3>
                <p className="text-gray-600">0716 722 003</p>
              </div>
              <div className="flex flex-col items-center">
                <Mail className="h-8 w-8 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Email</h3>
                <p className="text-gray-600">info@kwa-kamande.com</p>
              </div>
              <div className="flex flex-col items-center">
                <MapPin className="h-8 w-8 text-purple-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Location</h3>
                <p className="text-gray-600">Kamande, Kenya</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900/90 backdrop-blur-sm text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Building2 className="h-8 w-8 text-green-400" />
                <span className="text-2xl font-bold">Kwa-Kamande</span>
              </div>
              <p className="text-gray-400 mb-4">Quality rental housing in the heart of Kenya</p>
              <p className="text-sm text-gray-500">
                © 2024 Kwa-Kamande. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
