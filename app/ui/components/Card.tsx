'use client';

import React from 'react';
import './components.css';

export type CardVariant = 'default' | 'elevated' | 'outlined';

interface CardProps {
  variant?: CardVariant;
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  children,
  className = '',
  padding = 'md',
  onClick,
  hover = false
}) => {
  const baseClass = 'crai-card';
  const variantClass = `crai-card--${variant}`;
  const paddingClass = `crai-card--padding-${padding}`;
  const interactiveClass = onClick ? 'crai-card--interactive' : '';
  const hoverClass = hover ? 'crai-card--hover' : '';
  
  const Component = onClick ? 'button' : 'div';
  
  return (
    <Component
      className={`${baseClass} ${variantClass} ${paddingClass} ${interactiveClass} ${hoverClass} ${className}`}
      onClick={onClick}
      {...(onClick && { type: 'button' })}
    >
      {children}
    </Component>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => (
  <div className={`crai-card-header ${className}`}>
    {children}
  </div>
);

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const CardBody: React.FC<CardBodyProps> = ({ children, className = '' }) => (
  <div className={`crai-card-body ${className}`}>
    {children}
  </div>
);

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => (
  <div className={`crai-card-footer ${className}`}>
    {children}
  </div>
);
