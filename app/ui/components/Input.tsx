'use client';

import React, { forwardRef } from 'react';
import './components.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);
    
    return (
      <div className="crai-input-wrapper">
        {label && (
          <label htmlFor={inputId} className="crai-input-label">
            {label}
            {props.required && <span className="crai-input-required" aria-label="required">*</span>}
          </label>
        )}
        
        <div className={`crai-input-container ${hasError ? 'crai-input-container--error' : ''}`}>
          {leftIcon && <span className="crai-input-icon-left" aria-hidden="true">{leftIcon}</span>}
          
          <input
            ref={ref}
            id={inputId}
            className={`crai-input ${leftIcon ? 'crai-input--with-left-icon' : ''} ${rightIcon ? 'crai-input--with-right-icon' : ''} ${className}`}
            aria-invalid={hasError}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
          
          {rightIcon && <span className="crai-input-icon-right" aria-hidden="true">{rightIcon}</span>}
        </div>
        
        {error && (
          <p id={`${inputId}-error`} className="crai-input-error" role="alert">
            {error}
          </p>
        )}
        
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="crai-input-helper">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
