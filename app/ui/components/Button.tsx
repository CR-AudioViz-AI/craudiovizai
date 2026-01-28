'use client';

import React from 'react';
import './components.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  children,
  className = '',
  ...props
}) => {
  const baseClass = 'crai-button';
  const variantClass = `crai-button--${variant}`;
  const sizeClass = `crai-button--${size}`;
  const loadingClass = isLoading ? 'crai-button--loading' : '';
  
  return (
    <button
      className={`${baseClass} ${variantClass} ${sizeClass} ${loadingClass} ${className}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading && <span className="crai-button__spinner" aria-hidden="true" />}
      {!isLoading && leftIcon && <span className="crai-button__icon-left">{leftIcon}</span>}
      {children && <span className="crai-button__text">{children}</span>}
      {!isLoading && rightIcon && <span className="crai-button__icon-right">{rightIcon}</span>}
    </button>
  );
};
