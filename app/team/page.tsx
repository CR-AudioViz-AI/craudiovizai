'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MobileButton, MobileInput } from '@/components/mobile';
import { 
  Users, Search,
  Code, Heart, Shield, DollarSign,
  TrendingUp, Lightbulb, Award, Brain, Zap
} from 'lucide-react';

interface Avatar {
  id: string;
  name: string;
  title: string;
  department: string;
  description: string;
  primaryColor: string;
  icon: any;
}

const avatarData: Avatar[] = [
  // Core Operations Team
  {
    id: 'javari',
    name: 'Javari AI',
    title: 'Chief Technology Officer',
    department: 'Core Operations',
    description: 'Master builder who codes autonomously. Makes impossible apps happen.',
    primaryColor: 'blue',
    icon: Code
  },
  {
    id: 'pulse',
    name: 'Pulse',
    title: 'Code Czar & Emergency Fixer',
    department: 'Core Operations',
    description: 'Emergency response for code. When systems break, Pulse fixes it.',
    primaryColor: 'red',
    icon: Zap
  },
  {
    id: 'aria',
    name: 'Aria',
    title: 'Chief People & Culture Officer',
    department: 'Core Operations',
    description: 'The person everyone trusts. Warm, nurturing, builds amazing culture.',
    primaryColor: 'purple',
    icon: Heart
  },
  {
    id: 'lexis',
    name: 'Lexis',
    title: 'Chief Legal & Compliance Officer',
    department: 'Core Operations',
    description: 'Former federal prosecutor. Commands respect. Fair but firm.',
    primaryColor: 'gray',
    icon: Shield
  },
  {
    id: 'sage',
    name: 'Sage',
    title: 'Chief Financial Officer',
    department: 'Core Operations',
    description: 'Wall Street veteran. Strategic finance master. Trusted advisor.',
    primaryColor: 'green',
    icon: DollarSign
  },
  // Innovation Team
  {
    id: 'nova',
    name: 'Nova',
    title: 'Chief Innovation Officer',
    department: 'Innovation',
    description: 'Visionary strategist. Sees market opportunities before they exist.',
    primaryColor: 'yellow',
    icon: Lightbulb
  },
  {
    id: 'apex',
    name: 'Apex',
    title: 'Growth Strategy Director',
    department: 'Innovation',
    description: 'Data-driven growth expert. Turns insights into explosive scaling.',
    primaryColor: 'orange',
    icon: TrendingUp
  },
  {
    id: 'cipher',
    name: 'Cipher',
    title: 'AI Research Lead',
    department: 'Innovation',
    description: 'Bleeding-edge AI researcher. Pushes boundaries of what\'s possible.',
    primaryColor: 'indigo',
    icon: Brain
  }
];

const departments = ['All', 'Core Operations', 'Innovation'];

export default function TeamPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');

  const filteredAvatars = avatarData.filter(avatar => {
    const matchesSearch = 
      avatar.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      avatar.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      avatar.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDepartment = 
      selectedDepartment === 'All' || avatar.department === selectedDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
      red: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' },
      purple: { bg: 'bg-cyan-500', text: 'text-cyan-500', border: 'border-cyan-500' },
      gray: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
      green: { bg: 'bg-cyan-500', text: 'text-cyan-500', border: 'border-cyan-500' },
      yellow: { bg: 'bg-cyan-400', text: 'text-cyan-400', border: 'border-cyan-400' },
      orange: { bg: 'bg-cyan-500', text: 'text-cyan-500', border: 'border-cyan-500' },
      indigo: { bg: 'bg-cyan-500', text: 'text-cyan-500', border: 'border-cyan-500' },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-cyan-500 to-cyan-500 text-white px-4 py-12 md:py-16 lg:py-20">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <Users className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 md:mb-6" />
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 md:mb-6">
              Meet Our Team
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-cyan-500 mb-6 md:mb-8">
              31 specialized AI avatars working together to empower creators
            </p>
          </div>
        </div>
      </section>

      {/* Search & Filter */}
      <section className="px-4 py-8 md:py-12 bg-white">
        <div className="container mx-auto">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              {/* Search */}
              <div className="flex-1">
                <MobileInput
                  type="search"
                  placeholder="Search team members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search className="w-5 h-5" />}
                />
              </div>

              {/* Department Filter */}
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                {departments.map((dept) => (
                  <button
                    key={dept}
                    onClick={() => setSelectedDepartment(dept)}
                    className={`px-4 py-3 rounded-lg font-medium whitespace-nowrap transition-all flex-shrink-0 text-sm md:text-base ${
                      selectedDepartment === dept
                        ? 'bg-cyan-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Count */}
            <div className="text-sm md:text-base text-gray-600 mb-6">
              Showing {filteredAvatars.length} team member{filteredAvatars.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </section>

      {/* Team Grid */}
      <section className="px-4 py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {filteredAvatars.map((avatar) => {
                const Icon = avatar.icon;
                const colors = getColorClasses(avatar.primaryColor);
                
                return (
                  <Card 
                    key={avatar.id}
                    className={`hover:shadow-xl transition-all border-2 ${colors.border}`}
                  >
                    <CardHeader className="p-4 md:p-6">
                      {/* Avatar Icon */}
                      <div className={`w-16 h-16 md:w-20 md:h-20 ${colors.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                        <Icon className={`w-8 h-8 md:w-10 md:h-10 ${colors.text}`} />
                      </div>
                      
                      {/* Name & Title */}
                      <CardTitle className="text-center mb-2">
                        <div className="text-lg md:text-xl font-bold text-gray-900">
                          {avatar.name}
                        </div>
                      </CardTitle>
                      <div className={`text-xs md:text-sm font-semibold ${colors.text} text-center mb-2`}>
                        {avatar.title}
                      </div>
                      <div className="text-xs text-gray-500 text-center">
                        {avatar.department}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-4 md:p-6 pt-0">
                      <p className="text-xs md:text-sm text-gray-600 text-center leading-relaxed">
                        {avatar.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* No Results */}
            {filteredAvatars.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No team members found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search or filter criteria
                </p>
                <MobileButton
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedDepartment('All');
                  }}
                  variant="outline"
                >
                  Clear Filters
                </MobileButton>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Join Team CTA */}
      <section className="px-4 py-12 md:py-16 bg-gradient-to-br from-cyan-500 to-cyan-500 text-white">
        <div className="container mx-auto text-center">
          <Award className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 md:mb-6" />
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
            Want to Join Our Team?
          </h2>
          <p className="text-base md:text-lg lg:text-xl text-cyan-500 mb-6 md:mb-8 max-w-2xl mx-auto">
            We're always looking for talented people to help build the future of AI-powered creativity
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <a href="/careers" className="flex-1">
              <MobileButton 
                size="lg" 
                fullWidth
                className="bg-white text-cyan-500 hover:bg-cyan-500"
              >
                View Open Positions
              </MobileButton>
            </a>
            <a href="/contact" className="flex-1">
              <MobileButton 
                size="lg" 
                fullWidth
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/10"
              >
                Get in Touch
              </MobileButton>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
