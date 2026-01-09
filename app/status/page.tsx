import { Card, CardContent } from '@/components/ui/card';
import { MobileButton } from '@/components/mobile';
import { CheckCircle, AlertCircle, Clock, Server, Database, Globe, Zap } from 'lucide-react';
import Link from 'next/link';

const services = [
  { name: 'Web Application', status: 'operational', icon: Globe },
  { name: 'API Services', status: 'operational', icon: Server },
  { name: 'Database', status: 'operational', icon: Database },
  { name: 'Javari AI', status: 'operational', icon: Zap },
  { name: 'Payment Processing', status: 'operational', icon: CheckCircle },
  { name: 'CDN & Assets', status: 'operational', icon: Globe },
];

export default function StatusPage() {
  const allOperational = services.every(s => s.status === 'operational');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className={`px-4 py-12 md:py-16 lg:py-20 ${allOperational ? 'bg-gradient-to-br from-cyan-500 to-teal-600' : 'bg-gradient-to-br from-cyan-400 to-cyan-500'} text-white`}>
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            {allOperational ? (
              <CheckCircle className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 md:mb-6" />
            ) : (
              <AlertCircle className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 md:mb-6" />
            )}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">
              {allOperational ? 'All Systems Operational' : 'Partial Service Disruption'}
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-white/80">
              Last updated: {new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </section>

      {/* Service Status */}
      <section className="px-4 py-12 md:py-16 bg-white">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8">Service Status</h2>
            
            <div className="space-y-3 md:space-y-4">
              {services.map((service) => {
                const Icon = service.icon;
                return (
                  <Card key={service.name}>
                    <CardContent className="p-4 md:p-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
                        <span className="font-medium text-sm md:text-base">{service.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${service.status === 'operational' ? 'bg-cyan-500' : 'bg-cyan-400'}`} />
                        <span className={`text-xs md:text-sm font-medium ${service.status === 'operational' ? 'text-cyan-500' : 'text-cyan-400'}`}>
                          {service.status === 'operational' ? 'Operational' : 'Degraded'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Uptime Stats */}
      <section className="px-4 py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8">Uptime Statistics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <Card>
                <CardContent className="p-4 md:p-6 text-center">
                  <div className="text-3xl md:text-4xl font-bold text-cyan-500 mb-2">99.9%</div>
                  <div className="text-xs md:text-sm text-gray-600">Last 30 Days</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 md:p-6 text-center">
                  <div className="text-3xl md:text-4xl font-bold text-cyan-500 mb-2">99.95%</div>
                  <div className="text-xs md:text-sm text-gray-600">Last 90 Days</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 md:p-6 text-center">
                  <div className="text-3xl md:text-4xl font-bold text-cyan-500 mb-2">99.9%</div>
                  <div className="text-xs md:text-sm text-gray-600">All Time</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Subscribe */}
      <section className="px-4 py-12 md:py-16 bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
        <div className="container mx-auto text-center">
          <Clock className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 md:mb-6" />
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-base md:text-lg text-blue-100 mb-6 md:mb-8 max-w-2xl mx-auto">
            Get notified about service incidents and maintenance
          </p>
          <Link href="/contact?subject=Status Updates" className="inline-block">
            <MobileButton size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
              Subscribe to Updates
            </MobileButton>
          </Link>
        </div>
      </section>
    </div>
  );
}
