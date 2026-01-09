import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Code2, Music, Mail, ArrowRight, CheckCircle, Zap } from 'lucide-react';

const featuredApps = [
  {
    id: 'builder',
    icon: '🏗️',
    iconComponent: Code2,
    name: 'App Builder',
    description: 'Build production-ready apps with AI - no coding required',
    href: '/apps/builder',
    color: 'from-blue-500 to-blue-600',
    features: ['AI-powered', 'Export code', '70% revenue share'],
  },
  {
    id: 'music-builder',
    icon: '🎵',
    iconComponent: Music,
    name: 'Music Builder',
    description: 'Create original music with AI composition tools',
    href: '/apps/music-builder',
    color: 'from-cyan-500 to-cyan-500',
    features: ['Multiple genres', 'Pro quality', 'Instant export'],
  },
  {
    id: 'newsletter',
    icon: '📧',
    iconComponent: Mail,
    name: 'Newsletter Pro',
    description: 'Enterprise email marketing and campaign management',
    href: '/apps/newsletter',
    color: 'from-cyan-500 to-cyan-500',
    features: ['Campaigns', 'Analytics', 'Templates'],
  },
];

export default function FeaturedApps() {
  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-4 py-2 rounded-full mb-4">
            <Zap className="inline-block w-4 h-4 mr-1" />
            Launch Instantly
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Featured Apps & Tools
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Access powerful AI-driven applications instantly. No installation required - run everything in your browser.
          </p>
        </div>

        {/* Featured Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto mb-12">
          {featuredApps.map((app) => {
            const IconComponent = app.iconComponent;
            
            return (
              <Card 
                key={app.id} 
                className="border-2 hover:shadow-2xl transition-all duration-300 bg-white group"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-3xl shadow-sm group-hover:scale-110 transition-transform">
                      {app.icon}
                    </div>
                    <div className="flex items-center gap-1 bg-cyan-500 text-cyan-500 px-2 py-1 rounded-full text-xs font-semibold">
                      <CheckCircle className="w-3 h-3" />
                      Live
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                    {app.name}
                  </CardTitle>
                  <CardDescription className="text-base text-gray-600">
                    {app.description}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {app.features.map((feature, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  <Link href={app.href}>
                    <Button 
                      className={`w-full bg-gradient-to-r ${app.color} hover:shadow-lg text-white py-6 text-base font-semibold group-hover:scale-105 transition-transform`}
                    >
                      <IconComponent className="w-5 h-5 mr-2" />
                      Launch App
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* View All Apps CTA */}
        <div className="text-center">
          <p className="text-gray-600 mb-4 text-lg">
            Explore 60+ creative tools and growing
          </p>
          <Link href="/apps">
            <Button 
              size="lg" 
              variant="outline"
              className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg font-semibold"
            >
              View All Apps
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
