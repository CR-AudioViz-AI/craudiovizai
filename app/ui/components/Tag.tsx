'use client';

import React from 'react';
import './components.css';

interface TagProps {
  children: React.ReactNode;
  onRemove?: () => void;
  className?: string;
  color?: 'default' | 'primary' | 'secondary';
}

export const Tag: React.FC<TagProps> = ({
  children,
  onRemove,
  className = '',
  color = 'default'
}) => {
  return (
    <span className={`crai-tag crai-tag--${color} ${className}`}>
      <span className="crai-tag-text">{children}</span>
      {onRemove && (
        <button
          type="button"
          className="crai-tag-remove"
          onClick={onRemove}
          aria-label="Remove tag"
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </span>
  );
};
