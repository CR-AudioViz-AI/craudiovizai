'use client';

import React from 'react';
import './components.css';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  spacing?: 'sm' | 'md' | 'lg';
}

export const Divider: React.FC<DividerProps> = ({ 
  orientation = 'horizontal',
  className = '',
  spacing = 'md'
}) => {
  return (
    <hr 
      className={`crai-divider crai-divider--${orientation} crai-divider--spacing-${spacing} ${className}`}
      role="separator"
      aria-orientation={orientation}
    />
  );
};
