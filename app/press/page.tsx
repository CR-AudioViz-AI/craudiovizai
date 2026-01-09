import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MobileButton } from '@/components/mobile';
import { Download, FileText, Image as ImageIcon, Video, Mail, ExternalLink, Newspaper } from 'lucide-react';
import Link from 'next/link';

export default function PressPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white px-4 py-12 md:py-16 lg:py-20">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <FileText className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 md:mb-6" />
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 md:mb-6">
              Press Kit
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-gray-300 mb-6 md:mb-8">
              Media resources, company information, and brand assets for journalists and creators
            </p>
          </div>
        </div>
      </section>

      {/* Quick Facts */}
      <section className="px-4 py-12 md:py-16 bg-white">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8">
              Company Overview
            </h2>
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">Company Name</h3>
                    <p className="text-gray-600 text-sm md:text-base">CR AudioViz AI</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">Founded</h3>
                    <p className="text-gray-600 text-sm md:text-base">2024</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">Headquarters</h3>
                    <p className="text-gray-600 text-sm md:text-base">Fort Myers, Florida, USA</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">Industry</h3>
                    <p className="text-gray-600 text-sm md:text-base">AI Technology, Creative Tools, SaaS</p>
                  </div>
                  <div className="sm:col-span-2">
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">Description</h3>
                    <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                      CR AudioViz AI is a comprehensive AI-powered platform that empowers creators to build apps, 
                      games, websites, and more with 60+ creative tools, 1,200+ games, and Javari AI assistant. 
                      We're democratizing creativity through accessible, powerful technology.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Brand Assets */}
      <section className="px-4 py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8">
              Brand Assets
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="flex items-center text-base md:text-lg">
                    <ImageIcon className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0" />
                    Logos & Icons
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <p className="text-xs md:text-sm text-gray-600 mb-4">
                    Official CR AudioViz AI logos in various formats and color schemes
                  </p>
                  <MobileButton 
                    fullWidth
                    className="bg-blue-600 hover:bg-blue-700"
                    icon={<Download className="w-4 h-4" />}
                  >
                    Download Logo Pack
                  </MobileButton>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="flex items-center text-base md:text-lg">
                    <ImageIcon className="w-5 h-5 mr-2 text-cyan-500 flex-shrink-0" />
                    Product Screenshots
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <p className="text-xs md:text-sm text-gray-600 mb-4">
                    High-resolution screenshots of our platform and features
                  </p>
                  <MobileButton 
                    fullWidth
                    className="bg-cyan-500 hover:bg-cyan-500"
                    icon={<Download className="w-4 h-4" />}
                  >
                    Download Screenshots
                  </MobileButton>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="flex items-center text-base md:text-lg">
                    <Video className="w-5 h-5 mr-2 text-cyan-500 flex-shrink-0" />
                    Videos & Demos
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <p className="text-xs md:text-sm text-gray-600 mb-4">
                    Product demos, tutorials, and promotional videos
                  </p>
                  <MobileButton 
                    fullWidth
                    className="bg-cyan-500 hover:bg-cyan-500"
                    icon={<ExternalLink className="w-4 h-4" />}
                  >
                    View Video Library
                  </MobileButton>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="flex items-center text-base md:text-lg">
                    <FileText className="w-5 h-5 mr-2 text-cyan-500 flex-shrink-0" />
                    Press Releases
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <p className="text-xs md:text-sm text-gray-600 mb-4">
                    Latest news, announcements, and company updates
                  </p>
                  <MobileButton 
                    fullWidth
                    className="bg-cyan-500 hover:bg-cyan-500"
                    icon={<Newspaper className="w-4 h-4" />}
                  >
                    View Press Releases
                  </MobileButton>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Press */}
      <section className="px-4 py-12 md:py-16 bg-white">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8">
              In The News
            </h2>
            
            <div className="space-y-4 md:space-y-6">
              {[
                {
                  outlet: "TechCrunch",
                  title: "CR AudioViz AI Raises $2.5M to Democratize Creative Tools",
                  date: "October 2024",
                  link: "#"
                },
                {
                  outlet: "Forbes",
                  title: "How AI is Transforming the Creator Economy",
                  date: "September 2024",
                  link: "#"
                },
                {
                  outlet: "VentureBeat",
                  title: "CR AudioViz AI Launches 60+ Tools in One Platform",
                  date: "August 2024",
                  link: "#"
                },
                {
                  outlet: "The Verge",
                  title: "Meet Javari: The AI Assistant Building Apps",
                  date: "July 2024",
                  link: "#"
                }
              ].map((article, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-xs md:text-sm font-semibold text-blue-600 mb-1">
                          {article.outlet}
                        </div>
                        <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2">
                          {article.title}
                        </h3>
                        <div className="text-xs md:text-sm text-gray-500">
                          {article.date}
                        </div>
                      </div>
                      <Link href={article.link} className="block sm:w-auto">
                        <MobileButton 
                          size="sm"
                          fullWidth
                          variant="outline"
                          className="sm:w-auto"
                          icon={<ExternalLink className="w-4 h-4" />}
                        >
                          Read Article
                        </MobileButton>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Media Contact */}
      <section className="px-4 py-12 md:py-16 bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <Mail className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 md:mb-6" />
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
              Media Inquiries
            </h2>
            <p className="text-base md:text-lg text-blue-100 mb-6 md:mb-8">
              For press inquiries, interviews, or additional information
            </p>
            <div className="space-y-3 mb-6 md:mb-8">
              <div>
                <div className="text-sm text-blue-100">Email</div>
                <a 
                  href="mailto:press@craudiovizai.com" 
                  className="text-lg md:text-xl font-semibold hover:underline"
                >
                  press@craudiovizai.com
                </a>
              </div>
              <div>
                <div className="text-sm text-blue-100">Media Relations</div>
                <div className="text-lg md:text-xl font-semibold">
                  Cindy Henderson, CMO
                </div>
              </div>
            </div>
            <Link href="/contact?subject=Press Inquiry" className="inline-block w-full sm:w-auto">
              <MobileButton 
                size="lg"
                fullWidth
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                Contact Press Team
              </MobileButton>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
