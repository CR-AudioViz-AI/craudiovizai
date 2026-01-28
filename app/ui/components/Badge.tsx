'use client';

import React from 'react';
import './components.css';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  children,
  className = '',
  dot = false
}) => {
  return (
    <span className={`crai-badge crai-badge--${variant} crai-badge--${size} ${className}`}>
      {dot && <span className="crai-badge-dot" aria-hidden="true" />}
      {children}
    </span>
  );
};
