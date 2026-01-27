/**
 * Avatar Engine Types
 * Core type definitions for avatar rendering and state management
 */

export type AgentState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface Agent {
  id: string;
  name: string;
  color: string;
  state: AgentState;
  isActive: boolean;
  avatarUrl?: string;
  position?: number;
}

export interface GlowConfig {
  color: string;
  intensity: number;
  blur: number;
  spread: number;
  pulse: boolean;
  pulseSpeed?: number;
}

export interface AvatarEngineState {
  agents: Agent[];
  activeAgentId: string | null;
  glowConfig: GlowConfig;
}

export const DEFAULT_GLOW_CONFIG: GlowConfig = {
  color: 'rgba(79, 70, 229, 0.6)',
  intensity: 0.8,
  blur: 24,
  spread: 8,
  pulse: true,
  pulseSpeed: 2000
};

export const STATE_COLORS: Record<AgentState, string> = {
  idle: 'rgba(161, 161, 170, 0.4)',
  listening: 'rgba(59, 130, 246, 0.6)',
  thinking: 'rgba(245, 158, 11, 0.6)',
  speaking: 'rgba(79, 70, 229, 0.8)'
};
