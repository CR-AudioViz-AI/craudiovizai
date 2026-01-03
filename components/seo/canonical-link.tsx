'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const BASE_URL = 'https://craudiovizai.com';

export function CanonicalLink() {
  const pathname = usePathname();
  
  useEffect(() => {
    // Remove any existing canonical link
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.remove();
    }
    
    // Create and append new canonical link
    const link = document.createElement('link');
    link.rel = 'canonical';
    link.href = `${BASE_URL}${pathname}`;
    document.head.appendChild(link);
    
    return () => {
      // Cleanup on unmount
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        canonical.remove();
      }
    };
  }, [pathname]);
  
  return null;
}
