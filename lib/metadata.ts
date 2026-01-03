// /lib/metadata.ts
// Centralized metadata configuration for all pages
// Ensures canonical URLs are present on every page

import { Metadata } from 'next';

const BASE_URL = 'https://craudiovizai.com';

export function generatePageMetadata(
  path: string,
  title: string,
  description: string
): Metadata {
  const url = `${BASE_URL}${path}`;
  
  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'CR AudioViz AI',
      type: 'website',
    },
  };
}

// Pre-defined metadata for main pages
export const pageMetadata = {
  home: generatePageMetadata('/', 'CR AudioViz AI - Your Story. Our Design.', 'Professional AI-powered creative platform with comprehensive tools, games, and social impact programs.'),
  apps: generatePageMetadata('/apps', 'Apps & Tools | CR AudioViz AI', 'Explore our comprehensive suite of AI-powered creative tools and applications.'),
  pricing: generatePageMetadata('/pricing', 'Pricing | CR AudioViz AI', 'Flexible pricing plans for individuals, teams, and enterprises.'),
  about: generatePageMetadata('/about', 'About Us | CR AudioViz AI', 'Learn about CR AudioViz AI and our mission to democratize creative technology.'),
  contact: generatePageMetadata('/contact', 'Contact Us | CR AudioViz AI', 'Get in touch with the CR AudioViz AI team.'),
  login: generatePageMetadata('/login', 'Login | CR AudioViz AI', 'Sign in to your CR AudioViz AI account.'),
  dashboard: generatePageMetadata('/dashboard', 'Dashboard | CR AudioViz AI', 'Your personal CR AudioViz AI dashboard.'),
};
