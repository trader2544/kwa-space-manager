import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, Settings, Bell, Home, Wrench, Trash2, Wifi, Shield, Droplets, BookOpen, Phone, Mail, MapPin, GraduationCap, MessageSquare, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AuthPage from '@/components/auth/AuthPage';
import AdminDashboard from '@/components/admin/AdminDashboard';
import TenantDashboard from '@/components/tenant/TenantDashboard';
import HouseSearch from '@/components/home/HouseSearch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

const Index = () => {
  const [userType, setUserType] = useState<'admin' | 'tenant' | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [researchOpen, setResearchOpen] = useState(false);
  const [partnersOpen, setPartnersOpen] = useState(false);
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

    // Load the 3CX chat script
    const script = document.createElement('script');
    script.defer = true;
    script.src = 'https://downloads-global.3cx.com/downloads/livechatandtalk/v1/callus.js';
    script.id = 'tcx-callus-js';
    script.charset = 'utf-8';
    document.head.appendChild(script);

    return () => {
      subscription.unsubscribe();
      // Clean up the script when component unmounts
      const existingScript = document.getElementById('tcx-callus-js');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
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
    <div className="min-h-screen relative overflow-hidden">
      <ThemeToggle />
      
      {/* 3CX Live Chat Widget */}
      <call-us-selector phonesystem-url="https://1575.3cx.cloud" party="kwakamande"></call-us-selector>
      
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="floating-shapes">
          {/* Original shapes */}
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
          <div className="shape shape-5"></div>
          
          {/* Additional floating shapes */}
          <div className="shape" style={{
            width: '50px',
            height: '50px',
            top: '15%',
            right: '30%',
            animation: 'float 7s ease-in-out infinite',
            animationDelay: '1.5s',
            background: 'linear-gradient(45deg, rgba(168, 85, 247, 0.1), rgba(236, 72, 153, 0.1))'
          }}></div>
          
          <div className="shape" style={{
            width: '75px',
            height: '75px',
            bottom: '15%',
            right: '10%',
            animation: 'float-reverse 9s ease-in-out infinite',
            animationDelay: '3s',
            background: 'linear-gradient(45deg, rgba(34, 197, 94, 0.12), rgba(59, 130, 246, 0.08))'
          }}></div>
          
          <div className="shape" style={{
            width: '60px',
            height: '60px',
            top: '45%',
            left: '5%',
            animation: 'float 8s ease-in-out infinite',
            animationDelay: '2.5s',
            background: 'linear-gradient(45deg, rgba(251, 146, 60, 0.1), rgba(34, 197, 94, 0.1))'
          }}></div>
          
          <div className="shape" style={{
            width: '85px',
            height: '85px',
            top: '65%',
            left: '60%',
            animation: 'float-reverse 6s ease-in-out infinite',
            animationDelay: '4s',
            background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.08))'
          }}></div>
          
          <div className="shape" style={{
            width: '40px',
            height: '40px',
            top: '25%',
            left: '75%',
            animation: 'pulse-glow 5s ease-in-out infinite',
            animationDelay: '1s',
            background: 'linear-gradient(45deg, rgba(236, 72, 153, 0.12), rgba(168, 85, 247, 0.08))'
          }}></div>
          
          <div className="shape" style={{
            width: '65px',
            height: '65px',
            bottom: '35%',
            left: '15%',
            animation: 'float 10s ease-in-out infinite',
            animationDelay: '0.5s',
            background: 'linear-gradient(45deg, rgba(16, 185, 129, 0.1), rgba(245, 101, 101, 0.08))'
          }}></div>
          
          <div className="shape" style={{
            width: '55px',
            height: '55px',
            top: '8%',
            left: '35%',
            animation: 'float-reverse 7.5s ease-in-out infinite',
            animationDelay: '2s',
            background: 'linear-gradient(45deg, rgba(139, 92, 246, 0.09), rgba(34, 197, 94, 0.11))'
          }}></div>
          
          <div className="shape" style={{
            width: '45px',
            height: '45px',
            bottom: '25%',
            right: '40%',
            animation: 'pulse-glow 6s ease-in-out infinite',
            animationDelay: '3.5s',
            background: 'linear-gradient(45deg, rgba(251, 146, 60, 0.08), rgba(59, 130, 246, 0.1))'
          }}></div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-4 md:py-8">
        {/* Header */}
        <div className="text-center mb-6 md:mb-12">
          <div className="flex items-center justify-center mb-4 md:mb-6">
            <Building2 className="h-8 w-8 md:h-12 md:w-12 text-green-600 mr-2 md:mr-3" />
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100">
              Kwa Kamande
            </h1>
          </div>
          <p className="text-base md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-4">
            Premium Student Accommodation in Mwingi, Kitui
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
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
        <div className="max-w-4xl mx-auto mb-6 md:mb-16">
          <Card className="glass-card border-2 border-green-200/30 dark:border-green-700/30">
            <CardContent className="p-4 md:p-8 text-center">
              <h2 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Find Your Perfect Room Today
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto text-sm md:text-base">
                Comfortable, secure, and affordable accommodation designed specifically for medical students and trainees
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => setShowSearch(true)}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-base md:text-lg px-6 md:px-8"
                >
                  <Home className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                  Browse Available Rooms
                </Button>
                <Button 
                  onClick={() => setShowAuth(true)}
                  variant="outline" 
                  size="lg"
                  className="text-base md:text-lg px-6 md:px-8 glass-button"
                >
                  <Users className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                  Student Portal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Why Students Choose Kwa Kamande */}
        <div className="max-w-6xl mx-auto mb-6 md:mb-16">
          <h3 className="text-xl md:text-3xl font-bold text-center mb-6 md:mb-12 text-gray-800 dark:text-gray-200">
            Why Students Choose Kwa Kamande
          </h3>
          
          {/* Mobile Carousel */}
          <div className="md:hidden">
            <div className="overflow-x-auto">
              <div className="flex gap-4 pb-4 animate-[scroll_15s_linear_infinite]" style={{ width: 'max-content' }}>
                {[
                  { icon: Shield, title: "24/7 Security", desc: "Round-the-clock security for complete peace of mind and safety", color: "green" },
                  { icon: Wifi, title: "Free WiFi", desc: "High-speed internet connectivity for all your study and research needs", color: "blue" },
                  { icon: Droplets, title: "24/7 Water Supply", desc: "Consistent clean water supply ensuring comfort and convenience", color: "cyan" },
                  { icon: BookOpen, title: "Study-Friendly Environment", desc: "Quiet, conducive atmosphere designed for academic excellence", color: "purple" },
                  { icon: Home, title: "Furnished Rooms", desc: "Fully furnished accommodations with essential amenities included", color: "orange" },
                  { icon: Users, title: "Exclusive Community", desc: "Students-only residence fostering academic collaboration", color: "teal" },
                  // Duplicate for seamless loop
                  { icon: Shield, title: "24/7 Security", desc: "Round-the-clock security for complete peace of mind and safety", color: "green" },
                  { icon: Wifi, title: "Free WiFi", desc: "High-speed internet connectivity for all your study and research needs", color: "blue" },
                  { icon: Droplets, title: "24/7 Water Supply", desc: "Consistent clean water supply ensuring comfort and convenience", color: "cyan" },
                ].map((feature, index) => (
                  <div key={index} className="text-center flex-shrink-0 w-64">
                    <div className={`mx-auto mb-4 p-4 glass-card rounded-full w-16 h-16 flex items-center justify-center`}>
                      <feature.icon className={`h-8 w-8 text-${feature.color}-600`} />
                    </div>
                    <h4 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">{feature.title}</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Desktop Grid */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center glass-card p-6 rounded-lg">
              <div className="mx-auto mb-4 p-4 bg-green-100/50 dark:bg-green-900/30 rounded-full w-16 h-16 flex items-center justify-center">
                <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">24/7 Security</h4>
              <p className="text-gray-600 dark:text-gray-400">Round-the-clock security for complete peace of mind and safety</p>
            </div>
            
            <div className="text-center glass-card p-6 rounded-lg">
              <div className="mx-auto mb-4 p-4 bg-blue-100/50 dark:bg-blue-900/30 rounded-full w-16 h-16 flex items-center justify-center">
                <Wifi className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Free WiFi</h4>
              <p className="text-gray-600 dark:text-gray-400">High-speed internet connectivity for all your study and research needs</p>
            </div>
            
            <div className="text-center glass-card p-6 rounded-lg">
              <div className="mx-auto mb-4 p-4 bg-cyan-100/50 dark:bg-cyan-900/30 rounded-full w-16 h-16 flex items-center justify-center">
                <Droplets className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />
              </div>
              <h4 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">24/7 Water Supply</h4>
              <p className="text-gray-600 dark:text-gray-400">Consistent clean water supply ensuring comfort and convenience</p>
            </div>
            
            <div className="text-center glass-card p-6 rounded-lg">
              <div className="mx-auto mb-4 p-4 bg-purple-100/50 dark:bg-purple-900/30 rounded-full w-16 h-16 flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Study-Friendly Environment</h4>
              <p className="text-gray-600 dark:text-gray-400">Quiet, conducive atmosphere designed for academic excellence</p>
            </div>
            
            <div className="text-center glass-card p-6 rounded-lg">
              <div className="mx-auto mb-4 p-4 bg-orange-100/50 dark:bg-orange-900/30 rounded-full w-16 h-16 flex items-center justify-center">
                <Home className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h4 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Furnished Rooms</h4>
              <p className="text-gray-600 dark:text-gray-400">Fully furnished accommodations with essential amenities included</p>
            </div>
            
            <div className="text-center glass-card p-6 rounded-lg">
              <div className="mx-auto mb-4 p-4 bg-teal-100/50 dark:bg-teal-900/30 rounded-full w-16 h-16 flex items-center justify-center">
                <Users className="h-8 w-8 text-teal-600 dark:text-teal-400" />
              </div>
              <h4 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Exclusive Community</h4>
              <p className="text-gray-600 dark:text-gray-400">Students-only residence fostering academic collaboration</p>
            </div>
          </div>
        </div>

        {/* Academic Research Support - Collapsible on Mobile */}
        <div className="max-w-6xl mx-auto mb-6 md:mb-16">
          <div className="md:hidden">
            <Collapsible open={researchOpen} onOpenChange={setResearchOpen}>
              <Card className="glass-card border-2 border-blue-200/30 dark:border-blue-700/30">
                <CollapsibleTrigger asChild>
                  <CardHeader className="text-center cursor-pointer">
                    <CardTitle className="text-lg text-gray-800 dark:text-gray-200 mb-2 flex items-center justify-center gap-2">
                      <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      Academic Research Support
                      {researchOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <div className="text-center">
                      <p className="text-gray-700 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
                        Get expert help with research papers, case studies, assignments, and thesis formatting. 
                        Our academic experts provide high-quality assistance at student-friendly prices.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="glass-card p-4 rounded-lg">
                          <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Research Papers</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Complete research writing and editing</p>
                        </div>
                        <div className="glass-card p-4 rounded-lg">
                          <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Case Studies</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Medical case study analysis and formatting</p>
                        </div>
                        <div className="glass-card p-4 rounded-lg">
                          <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Thesis Support</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Thesis writing and formatting assistance</p>
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
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>
          
          {/* Desktop Version */}
          <div className="hidden md:block">
            <Card className="glass-card border-2 border-blue-200/30 dark:border-blue-700/30">
              <CardHeader className="text-center">
                <CardTitle className="text-xl md:text-2xl text-gray-800 dark:text-gray-200 mb-4 flex items-center justify-center gap-2">
                  <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  Academic Research Support
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Professional research assistance for medical students at affordable rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-gray-700 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
                    Get expert help with research papers, case studies, assignments, and thesis formatting. 
                    Our academic experts provide high-quality assistance at student-friendly prices.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="glass-card p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Research Papers</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Complete research writing and editing</p>
                    </div>
                    <div className="glass-card p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Case Studies</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Medical case study analysis and formatting</p>
                    </div>
                    <div className="glass-card p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Thesis Support</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Thesis writing and formatting assistance</p>
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
        </div>

        {/* Partner Institutions - Collapsible on Mobile */}
        <div className="max-w-6xl mx-auto mb-6 md:mb-16">
          <div className="md:hidden">
            <Collapsible open={partnersOpen} onOpenChange={setPartnersOpen}>
              <Card className="glass-card">
                <CollapsibleTrigger asChild>
                  <CardHeader className="text-center cursor-pointer">
                    <CardTitle className="text-lg text-gray-800 dark:text-gray-200 mb-2 flex items-center justify-center gap-2">
                      Partner Medical Institutions
                      {partnersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <div className="flex gap-4 pb-4 animate-[scroll_20s_linear_infinite]" style={{ width: 'max-content' }}>
                        {[
                          { name: "Jordan Medical College", campus: "Kitui Campus", color: "blue" },
                          { name: "KMTC Kitui", fullName: "Kenya Medical Training College", color: "green" },
                          { name: "KMTC Mbooni", fullName: "Kenya Medical Training College", color: "purple" },
                          { name: "KMTC Thika", fullName: "Kenya Medical Training College", color: "orange" },
                          { name: "KMTC Wajir", fullName: "Kenya Medical Training College", color: "red" },
                          { name: "KTMC Thika", fullName: "Other Medical Institutions", color: "teal" },
                          // Duplicate for seamless loop
                          { name: "Jordan Medical College", campus: "Kitui Campus", color: "blue" },
                          { name: "KMTC Kitui", fullName: "Kenya Medical Training College", color: "green" },
                          { name: "KMTC Mbooni", fullName: "Kenya Medical Training College", color: "purple" },
                        ].map((institution, index) => (
                          <div key={index} className={`glass-card p-4 rounded-lg text-center flex-shrink-0 w-48`}>
                            <GraduationCap className={`h-8 w-8 text-${institution.color}-600 mx-auto mb-2`} />
                            <h4 className={`font-semibold text-${institution.color}-900 dark:text-${institution.color}-300 text-sm`}>{institution.name}</h4>
                            <p className={`text-xs text-${institution.color}-700 dark:text-${institution.color}-400`}>{institution.campus || institution.fullName}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>
          
          {/* Desktop Version */}
          <div className="hidden md:block">
            <Card className="glass-card">
              <CardHeader className="text-center">
                <CardTitle className="text-xl md:text-2xl text-gray-800 dark:text-gray-200 mb-4">
                  Partner Medical Institutions
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  We proudly accommodate students from leading medical training institutions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="glass-card p-4 rounded-lg text-center">
                    <GraduationCap className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                    <h4 className="font-semibold text-blue-900 dark:text-blue-300">Jordan Medical College</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-400">Kitui Campus</p>
                  </div>
                  <div className="glass-card p-4 rounded-lg text-center">
                    <GraduationCap className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                    <h4 className="font-semibold text-green-900 dark:text-green-300">KMTC Kitui</h4>
                    <p className="text-sm text-green-700 dark:text-green-400">Kenya Medical Training College</p>
                  </div>
                  <div className="glass-card p-4 rounded-lg text-center">
                    <GraduationCap className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                    <h4 className="font-semibold text-purple-900 dark:text-purple-300">Thika</h4>
                    <p className="text-sm text-purple-700 dark:text-purple-400">Medical School</p>
                  </div>
                  <div className="glass-card p-4 rounded-lg text-center">
                    <GraduationCap className="h-8 w-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
                    <h4 className="font-semibold text-orange-900 dark:text-orange-300">KMTC Thika</h4>
                    <p className="text-sm text-orange-700 dark:text-orange-400">Kenya Medical Training College</p>
                  </div>
                  <div className="glass-card p-4 rounded-lg text-center">
                    <GraduationCap className="h-8 w-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
                    <h4 className="font-semibold text-red-900 dark:text-red-300">KMTC Wajir</h4>
                    <p className="text-sm text-red-700 dark:text-red-400">Kenya Medical Training College</p>
                  </div>
                  <div className="glass-card p-4 rounded-lg text-center">
                    <GraduationCap className="h-8 w-8 text-teal-600 dark:text-teal-400 mx-auto mb-2" />
                    <h4 className="font-semibold text-teal-900 dark:text-teal-300">Univerities offering medical courses</h4>
                    <p className="text-sm text-teal-700 dark:text-teal-400">Other Medical Institutions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contact Information */}
        <div className="max-w-4xl mx-auto">
          <Card className="glass-card border-2 border-blue-200/30 dark:border-blue-700/30">
            <CardHeader className="text-center">
              <CardTitle className="text-xl md:text-2xl text-gray-800 dark:text-gray-200">Ready to Move In?</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Contact us today to secure your accommodation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center md:text-left">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Contact Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="dark:text-gray-300">+254 716722003</span>
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="dark:text-gray-300">kwakamander@gmail.com</span>
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <MapPin className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="dark:text-gray-300">Mwingi, Kitui County</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Quick Actions</h4>
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
                      className="w-full glass-button"
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
