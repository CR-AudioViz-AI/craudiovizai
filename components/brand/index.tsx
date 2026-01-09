/**
 * CR AudioViz AI - Shared Brand Components
 * 
 * These components ensure brand consistency across all apps.
 * Import and use these in every app.
 * 
 * @version 1.0.0
 */

import React from 'react';

// ============================================================================
// BRAND COLORS
// ============================================================================

export const BRAND_COLORS = {
  // Primary
  cyan: {
    50: '#ECFEFF',
    100: '#CFFAFE',
    200: '#A5F3FC',
    300: '#67E8F9',
    400: '#22D3EE',  // Light accent
    500: '#06B6D4',
    600: '#0891B2',  // PRIMARY BRAND COLOR
    700: '#0E7490',  // Dark accent
    800: '#155E75',
    900: '#164E63',
  },
  // Neutrals
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',  // Secondary text
    500: '#64748B',
    600: '#475569',  // Primary text
    700: '#334155',
    800: '#1E293B',  // Headings
    900: '#0F172A',
  },
  // Backgrounds
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',  // Background
    200: '#E5E7EB',
    300: '#D1D5DB',
  },
  // Accent (errors only)
  red: {
    500: '#EF4444',
    600: '#DC2626',  // Errors + "Cindy & Roy"
    700: '#B91C1C',
  },
  white: '#FFFFFF',
} as const;

// ============================================================================
// GRADIENT DEFINITIONS
// ============================================================================

export const GRADIENTS = {
  // Primary button gradient
  primary: 'bg-gradient-to-r from-cyan-500 to-cyan-700',
  // Logo background gradient
  logo: 'bg-gradient-to-b from-cyan-400 to-cyan-700',
  // Hero section gradient
  hero: 'bg-gradient-to-br from-cyan-50 via-white to-slate-50',
  // Card hover gradient
  cardHover: 'hover:bg-gradient-to-br hover:from-cyan-50 hover:to-white',
} as const;

// ============================================================================
// POWERED BY JAVARI AI BADGE
// ============================================================================

interface PoweredByBadgeProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PoweredByJavariBadge: React.FC<PoweredByBadgeProps> = ({
  variant = 'light',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };
  
  const variantClasses = {
    light: 'bg-white/80 text-slate-600 border border-slate-200',
    dark: 'bg-slate-800/80 text-white border border-slate-700',
  };
  
  return (
    <div className={`inline-flex items-center gap-2 rounded-full backdrop-blur-sm ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      <svg 
        className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'}
        viewBox="0 0 24 24" 
        fill="none"
      >
        <path 
          d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" 
          fill="currentColor" 
          className="text-cyan-500"
        />
      </svg>
      <span>Powered by <strong className="text-cyan-600">Javari AI</strong></span>
    </div>
  );
};

// ============================================================================
// CR AUDIOVIZ AI FOOTER
// ============================================================================

interface BrandFooterProps {
  appName?: string;
  showPoweredBy?: boolean;
  className?: string;
}

export const CRAudioVizFooter: React.FC<BrandFooterProps> = ({
  appName,
  showPoweredBy = true,
  className = '',
}) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className={`border-t border-slate-200 bg-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left side - Brand */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <a 
              href="https://craudiovizai.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-slate-600 hover:text-cyan-600 transition-colors min-h-[44px]"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-cyan-400 to-cyan-700 flex items-center justify-center">
                <span className="text-white font-bold text-sm">CR</span>
              </div>
              <span className="font-semibold">CR AudioViz AI</span>
            </a>
            <p className="text-sm text-slate-400">
              A Henderson Platform Production
            </p>
          </div>
          
          {/* Center - Powered by badge */}
          {showPoweredBy && (
            <PoweredByJavariBadge size="sm" />
          )}
          
          {/* Right side - Copyright */}
          <div className="text-center md:text-right">
            <p className="text-sm text-slate-500">
              © {currentYear} <span className="text-red-600 font-medium">Cindy & Roy</span> Henderson
            </p>
            {appName && (
              <p className="text-xs text-slate-400 mt-1">
                {appName}
              </p>
            )}
          </div>
        </div>
        
        {/* Footer links */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap justify-center gap-x-6 gap-y-2">
          <a href="https://craudiovizai.com/privacy" className="text-sm text-slate-500 hover:text-cyan-600 min-h-[44px] flex items-center">
            Privacy Policy
          </a>
          <a href="https://craudiovizai.com/terms" className="text-sm text-slate-500 hover:text-cyan-600 min-h-[44px] flex items-center">
            Terms of Service
          </a>
          <a href="https://craudiovizai.com/support" className="text-sm text-slate-500 hover:text-cyan-600 min-h-[44px] flex items-center">
            Support
          </a>
          <a href="https://craudiovizai.com/apps" className="text-sm text-slate-500 hover:text-cyan-600 min-h-[44px] flex items-center">
            All Apps
          </a>
        </div>
      </div>
    </footer>
  );
};

// ============================================================================
// BRAND BUTTON
// ============================================================================

interface BrandButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const BrandButton: React.FC<BrandButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-2.5 text-base min-h-[44px]',
    lg: 'px-6 py-3 text-lg min-h-[52px]',
  };
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-cyan-500 to-cyan-700 text-white hover:from-cyan-600 hover:to-cyan-800 shadow-md hover:shadow-lg',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    outline: 'border-2 border-cyan-600 text-cyan-600 hover:bg-cyan-50',
    ghost: 'text-slate-600 hover:bg-slate-100',
  };
  
  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// ============================================================================
// MOBILE-FIRST RESPONSIVE WRAPPER
// ============================================================================

interface MobileFirstContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export const MobileFirstContainer: React.FC<MobileFirstContainerProps> = ({
  children,
  className = '',
  maxWidth = 'xl',
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
  };
  
  return (
    <div className={`w-full mx-auto px-4 sm:px-6 lg:px-8 ${maxWidthClasses[maxWidth]} ${className}`}>
      {children}
    </div>
  );
};

// ============================================================================
// APP CARD (for app directories)
// ============================================================================

interface AppCardProps {
  name: string;
  description: string;
  icon?: React.ReactNode;
  href: string;
  category?: string;
}

export const AppCard: React.FC<AppCardProps> = ({
  name,
  description,
  icon,
  href,
  category,
}) => {
  return (
    <a
      href={href}
      className="group block p-4 bg-white rounded-xl border border-slate-200 hover:border-cyan-300 hover:shadow-lg transition-all min-h-[120px]"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-b from-cyan-400 to-cyan-700 flex items-center justify-center text-white shadow-md group-hover:shadow-lg transition-shadow">
          {icon || <span className="text-lg font-bold">{name.charAt(0)}</span>}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 group-hover:text-cyan-600 transition-colors">
            {name}
          </h3>
          {category && (
            <span className="text-xs text-cyan-600 font-medium">
              {category}
            </span>
          )}
          <p className="mt-1 text-sm text-slate-500 line-clamp-2">
            {description}
          </p>
        </div>
      </div>
    </a>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  BRAND_COLORS,
  GRADIENTS,
  PoweredByJavariBadge,
  CRAudioVizFooter,
  BrandButton,
  MobileFirstContainer,
  AppCard,
};
