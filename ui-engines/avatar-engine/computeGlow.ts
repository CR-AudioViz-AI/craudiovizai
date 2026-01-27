/**
 * Avatar Glow Computation
 * Calculates glow properties based on agent state
 */

import { Agent, GlowConfig, STATE_COLORS } from './engineTypes';

export function computeGlow(agent: Agent | null): GlowConfig {
  if (!agent) {
    return {
      color: STATE_COLORS.idle,
      intensity: 0.3,
      blur: 16,
      spread: 4,
      pulse: false
    };
  }

  const baseColor = agent.color || STATE_COLORS[agent.state];
  
  switch (agent.state) {
    case 'listening':
      return {
        color: baseColor,
        intensity: 0.7,
        blur: 20,
        spread: 6,
        pulse: true,
        pulseSpeed: 1500
      };
    
    case 'thinking':
      return {
        color: baseColor,
        intensity: 0.6,
        blur: 18,
        spread: 5,
        pulse: true,
        pulseSpeed: 1000
      };
    
    case 'speaking':
      return {
        color: baseColor,
        intensity: 0.9,
        blur: 28,
        spread: 10,
        pulse: true,
        pulseSpeed: 800
      };
    
    case 'idle':
    default:
      return {
        color: baseColor,
        intensity: 0.4,
        blur: 16,
        spread: 4,
        pulse: false
      };
  }
}

export function getGlowStyle(config: GlowConfig): React.CSSProperties {
  return {
    '--glow-color': config.color,
    '--glow-blur': `${config.blur}px`,
    '--glow-spread': `${config.spread}px`,
    '--glow-intensity': config.intensity.toString(),
    '--pulse-speed': `${config.pulseSpeed || 2000}ms`
  } as React.CSSProperties;
}
