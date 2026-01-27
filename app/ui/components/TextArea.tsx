'use client';

import React, { forwardRef } from 'react';
import './components.css';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, helperText, resize = 'vertical', className = '', id, ...props }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);
    
    return (
      <div className="crai-textarea-wrapper">
        {label && (
          <label htmlFor={textareaId} className="crai-textarea-label">
            {label}
            {props.required && <span className="crai-textarea-required" aria-label="required">*</span>}
          </label>
        )}
        
        <textarea
          ref={ref}
          id={textareaId}
          className={`crai-textarea crai-textarea--resize-${resize} ${hasError ? 'crai-textarea--error' : ''} ${className}`}
          aria-invalid={hasError}
          aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
          {...props}
        />
        
        {error && (
          <p id={`${textareaId}-error`} className="crai-textarea-error" role="alert">
            {error}
          </p>
        )}
        
        {!error && helperText && (
          <p id={`${textareaId}-helper`} className="crai-textarea-helper">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
