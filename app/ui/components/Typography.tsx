'use client';

import React from 'react';
import './components.css';

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
type TextVariant = 'body1' | 'body2' | 'caption' | 'overline';

interface HeadingProps {
  level: HeadingLevel;
  children: React.ReactNode;
  className?: string;
}

export const Heading: React.FC<HeadingProps> = ({ level, children, className = '' }) => {
  const Component = level;
  return <Component className={`crai-heading crai-heading--${level} ${className}`}>{children}</Component>;
};

interface TextProps {
  variant?: TextVariant;
  children: React.ReactNode;
  className?: string;
  muted?: boolean;
}

export const Text: React.FC<TextProps> = ({ 
  variant = 'body1', 
  children, 
  className = '',
  muted = false 
}) => {
  const mutedClass = muted ? 'crai-text--muted' : '';
  return (
    <p className={`crai-text crai-text--${variant} ${mutedClass} ${className}`}>
      {children}
    </p>
  );
};

interface CodeProps {
  children: React.ReactNode;
  className?: string;
  inline?: boolean;
}

export const Code: React.FC<CodeProps> = ({ children, className = '', inline = false }) => {
  if (inline) {
    return <code className={`crai-code crai-code--inline ${className}`}>{children}</code>;
  }
  
  return (
    <pre className={`crai-code-block ${className}`}>
      <code className="crai-code">{children}</code>
    </pre>
  );
};
