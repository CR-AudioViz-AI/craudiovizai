'use client';

import React, { useEffect, useState } from 'react';
import { GlowConfig, getGlowStyle } from '@/ui-engines/avatar-engine';
import './avatar.css';

interface AvatarGlowProps {
  config: GlowConfig;
  size?: number;
}

export const AvatarGlow: React.FC<AvatarGlowProps> = ({ 
  config, 
  size = 200 
}) => {
  const [isAnimating, setIsAnimating] = useState(config.pulse);

  useEffect(() => {
    setIsAnimating(config.pulse);
  }, [config.pulse]);

  const style = {
    ...getGlowStyle(config),
    width: `${size}px`,
    height: `${size}px`
  };

  return (
    <div 
      className={`avatar-glow ${isAnimating ? 'avatar-glow--pulse' : ''}`}
      style={style}
      aria-hidden="true"
    >
      <div className="avatar-glow__inner" />
      <div className="avatar-glow__outer" />
    </div>
  );
};
