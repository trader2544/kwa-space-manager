
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, Settings, Bell, Home, Wrench, Trash2, Wifi, Shield, Droplets, BookOpen, Phone, Mail, MapPin, GraduationCap, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AuthPage from '@/components/auth/AuthPage';
import AdminDashboard from '@/components/admin/AdminDashboard';
import TenantDashboard from '@/components/tenant/TenantDashboard';
import HouseSearch from '@/components/home/HouseSearch';

const Index = () => {
  const [userType, setUserType] = useState<'admin' | 'tenant' | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (session?.user) {
        setUser(session.user);
        // Defer the profile fetch to avoid blocking the auth state change
        setTimeout(async () => {
          await fetchUserProfile(session.user.id);
        }, 0);
        setShowAuth(false);
      } else {
        setUser(null);
        setProfile(null);
        setUserType(null);
        setLoading(false);
      }
    });

    // THEN check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await fetchUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
      
      console.log('Profile data:', data);
      setProfile(data);
      setUserType(data?.role as 'admin' | 'tenant');
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
      toast({
        title: "Error",
        description: "Failed to fetch user profile.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = () => {
    setUser(null);
    setProfile(null);
    setUserType(null);
    setShowAuth(false);
    setShowSearch(false);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-green-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth page if requested
  if (showAuth && !user) {
    return <AuthPage onBack={() => setShowAuth(false)} />;
  }

  // Show house search if requested
  if (showSearch) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-green-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Available Rooms</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowSearch(false)}>
                Back to Home
              </Button>
              {user && (
                <Button onClick={() => {
                  setShowSearch(false);
                  // Will show dashboard since user is logged in
                }}>
                  Dashboard
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <HouseSearch />
        </div>
      </div>
    );
  }

  // Show dashboard if user is authenticated
  if (user && profile && userType) {
    if (userType === 'admin') {
      return <AdminDashboard user={user} onSignOut={handleSignOut} />;
    } else {
      return <TenantDashboard user={user} onSignOut={handleSignOut} />;
    }
  }

  // Show main landing page
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="flex items-center justify-center mb-4 md:mb-6">
            <Building2 className="h-10 w-10 md:h-12 md:w-12 text-green-600 mr-3" />
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">
              Kwa Kamande
            </h1>
          </div>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-4">
            Premium Student Accommodation in Mwingi, Kitui
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>Mwingi, Kitui County, Kenya</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <div className="flex items-center gap-1">
              <GraduationCap className="h-4 w-4" />
              <span>Students Only</span>
            </div>
          </div>
          {user && (
            <div className="mt-4">
              <Button onClick={() => {
                // Will show dashboard since user is logged in
              }}>
                Go to Dashboard
              </Button>
            </div>
          )}
        </div>

        {/* Hero CTA */}
        <div className="max-w-4xl mx-auto mb-8 md:mb-16">
          <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
            <CardContent className="p-6 md:p-8 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Find Your Perfect Room Today
              </h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Comfortable, secure, and affordable accommodation designed specifically for medical students and trainees
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => setShowSearch(true)}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-lg px-8"
                >
                  <Home className="h-5 w-5 mr-2" />
                  Browse Available Rooms
                </Button>
                <Button 
                  onClick={() => setShowAuth(true)}
                  variant="outline" 
                  size="lg"
                  className="text-lg px-8"
                >
                  Student Portal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Research Services Section */}
        <div className="max-w-6xl mx-auto mb-8 md:mb-16">
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardHeader className="text-center">
              <CardTitle className="text-xl md:text-2xl text-gray-800 mb-4 flex items-center justify-center gap-2">
                <BookOpen className="h-6 w-6 text-blue-600" />
                Academic Research Support
              </CardTitle>
              <CardDescription className="text-gray-600">
                Professional research assistance for medical students at affordable rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
                  Get expert help with research papers, case studies, assignments, and thesis formatting. 
                  Our academic experts provide high-quality assistance at student-friendly prices.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-semibold text-blue-900 mb-2">Research Papers</h4>
                    <p className="text-sm text-gray-600">Complete research writing and editing</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-semibold text-blue-900 mb-2">Case Studies</h4>
                    <p className="text-sm text-gray-600">Medical case study analysis and formatting</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-semibold text-blue-900 mb-2">Thesis Support</h4>
                    <p className="text-sm text-gray-600">Thesis writing and formatting assistance</p>
                  </div>
                </div>
                <Button 
                  onClick={() => window.open('https://wa.me/254707947594?text=Hello! I need help with academic research.', '_blank')}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Consult Research Expert
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Partner Institutions */}
        <div className="max-w-6xl mx-auto mb-8 md:mb-16">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl md:text-2xl text-gray-800 mb-4">
                Partner Medical Institutions
              </CardTitle>
              <CardDescription className="text-gray-600">
                We proudly accommodate students from leading medical training institutions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <GraduationCap className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-blue-900">Jordan Medical College</h4>
                  <p className="text-sm text-blue-700">Kitui Campus</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <GraduationCap className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-green-900">KMTC Kitui</h4>
                  <p className="text-sm text-green-700">Kenya Medical Training College</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <GraduationCap className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-purple-900">KMTC Mbooni</h4>
                  <p className="text-sm text-purple-700">Kenya Medical Training College</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <GraduationCap className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-orange-900">KMTC Thika</h4>
                  <p className="text-sm text-orange-700">Kenya Medical Training College</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <GraduationCap className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-red-900">KMTC Wajir</h4>
                  <p className="text-sm text-red-700">Kenya Medical Training College</p>
                </div>
                <div className="bg-teal-50 p-4 rounded-lg text-center">
                  <GraduationCap className="h-8 w-8 text-teal-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-teal-900">KTMC Thika</h4>
                  <p className="text-sm text-teal-700">Other Medical Institutions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="max-w-6xl mx-auto mb-8 md:mb-16">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12 text-gray-800">
            Why Students Choose Kwa Kamande
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center">
              <div className="mx-auto mb-4 p-4 bg-green-100 rounded-full w-16 h-16 flex items-center justify-center">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2 text-gray-800">24/7 Security</h4>
              <p className="text-gray-600">Round-the-clock security for complete peace of mind and safety</p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto mb-4 p-4 bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center">
                <Wifi className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2 text-gray-800">Free WiFi</h4>
              <p className="text-gray-600">High-speed internet connectivity for all your study and research needs</p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto mb-4 p-4 bg-cyan-100 rounded-full w-16 h-16 flex items-center justify-center">
                <Droplets className="h-8 w-8 text-cyan-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2 text-gray-800">24/7 Water Supply</h4>
              <p className="text-gray-600">Consistent clean water supply ensuring comfort and convenience</p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto mb-4 p-4 bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2 text-gray-800">Study-Friendly Environment</h4>
              <p className="text-gray-600">Quiet, conducive atmosphere designed for academic excellence</p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto mb-4 p-4 bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center">
                <Home className="h-8 w-8 text-orange-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2 text-gray-800">Furnished Rooms</h4>
              <p className="text-gray-600">Fully furnished accommodations with essential amenities included</p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto mb-4 p-4 bg-teal-100 rounded-full w-16 h-16 flex items-center justify-center">
                <Users className="h-8 w-8 text-teal-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2 text-gray-800">Exclusive Community</h4>
              <p className="text-gray-600">Students-only residence fostering academic collaboration</p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-blue-200">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gray-800">Ready to Move In?</CardTitle>
              <CardDescription>
                Contact us today to secure your accommodation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center md:text-left">
                  <h4 className="font-semibold text-gray-800 mb-4">Contact Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <Phone className="h-4 w-4 text-green-600" />
                      <span>+254 707 947 594</span>
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span>kwakamander@gmail.com</span>
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <MapPin className="h-4 w-4 text-red-600" />
                      <span>Mwingi, Kitui County</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <h4 className="font-semibold text-gray-800 mb-4">Quick Actions</h4>
                  <div className="space-y-3">
                    <Button 
                      onClick={() => setShowSearch(true)}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Home className="h-4 w-4 mr-2" />
                      View Available Rooms
                    </Button>
                    <Button 
                      onClick={() => setShowAuth(true)}
                      variant="outline"
                      className="w-full"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Access Portal
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
