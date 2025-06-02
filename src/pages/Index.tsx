import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function Index() {
  const [isHovered, setIsHovered] = useState(false);

  const features = [
    {
      title: "Responsive Design",
      description: "Crafted to provide optimal viewing experience across a wide range of devices.",
      icon: "📱",
    },
    {
      title: "Interactive UI",
      description: "Engaging user interfaces that respond to user actions with delightful animations.",
      icon: "🖱️",
    },
    {
      title: "Dark Mode",
      description: "Supports a dark theme for comfortable usage in low-light environments.",
      icon: "🌙",
    },
    {
      title: "Accessibility",
      description: "Built with accessibility in mind, ensuring content is usable by everyone.",
      icon: "♿",
    },
    {
      title: "Fast Performance",
      description: "Optimized for speed to provide a smooth and responsive user experience.",
      icon: "🚀",
    },
    {
      title: "Customizable",
      description: "Easily customizable themes and components to fit your brand.",
      icon: "🎨",
    },
  ];

  // Show main landing page
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Theme Toggle - Fixed position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="absolute inset-0 bg-grid-pattern opacity-5 dark:opacity-10"></div>
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
          <div className="shape shape-5"></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            Welcome to the Future of Web Design
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Experience the blend of modern design and cutting-edge technology.
          </p>
          <Button size="lg" className="mr-4">Get Started</Button>
          <Button variant="outline" size="lg">Learn More</Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="glass-card card-hover">
              <CardHeader>
                <CardTitle>{feature.icon} {feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Add any additional content here if needed */}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-semibold mb-6">Ready to Transform Your Web Presence?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join our community of innovators and elevate your projects.
          </p>
          <Button size="lg" className="mr-4">Sign Up Now</Button>
          <Button variant="secondary" size="lg">Explore Templates</Button>
        </div>
      </div>
    </div>
  );
}
