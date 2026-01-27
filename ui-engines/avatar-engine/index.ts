/**
 * Avatar Engine
 * Manages multi-agent avatar rendering, state, and animations
 */

import { Agent, AgentState, AvatarEngineState, DEFAULT_GLOW_CONFIG } from './engineTypes';
import { computeGlow } from './computeGlow';

export * from './engineTypes';
export * from './computeGlow';

export class AvatarEngine {
  private state: AvatarEngineState;
  private listeners: Set<(state: AvatarEngineState) => void>;

  constructor() {
    this.state = {
      agents: [],
      activeAgentId: null,
      glowConfig: DEFAULT_GLOW_CONFIG
    };
    this.listeners = new Set();
  }

  subscribe(listener: (state: AvatarEngineState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  getState(): AvatarEngineState {
    return { ...this.state };
  }

  addAgent(agent: Omit<Agent, 'isActive'>): void {
    const newAgent: Agent = {
      ...agent,
      isActive: false,
      state: agent.state || 'idle'
    };

    this.state = {
      ...this.state,
      agents: [...this.state.agents, newAgent]
    };

    this.notify();
  }

  removeAgent(agentId: string): void {
    this.state = {
      ...this.state,
      agents: this.state.agents.filter(a => a.id !== agentId),
      activeAgentId: this.state.activeAgentId === agentId ? null : this.state.activeAgentId
    };

    if (this.state.activeAgentId === null && this.state.agents.length > 0) {
      this.setActiveAgent(this.state.agents[0].id);
    }

    this.notify();
  }

  setActiveAgent(agentId: string | null): void {
    const agent = agentId ? this.state.agents.find(a => a.id === agentId) : null;

    this.state = {
      ...this.state,
      activeAgentId: agentId,
      agents: this.state.agents.map(a => ({
        ...a,
        isActive: a.id === agentId
      })),
      glowConfig: computeGlow(agent || null)
    };

    this.notify();
  }

  setAgentState(agentId: string, state: AgentState): void {
    const agent = this.state.agents.find(a => a.id === agentId);
    if (!agent) return;

    this.state = {
      ...this.state,
      agents: this.state.agents.map(a =>
        a.id === agentId ? { ...a, state } : a
      )
    };

    if (agentId === this.state.activeAgentId) {
      this.state.glowConfig = computeGlow({ ...agent, state });
    }

    this.notify();
  }

  setAgentColor(agentId: string, color: string): void {
    this.state = {
      ...this.state,
      agents: this.state.agents.map(a =>
        a.id === agentId ? { ...a, color } : a
      )
    };

    if (agentId === this.state.activeAgentId) {
      const agent = this.state.agents.find(a => a.id === agentId);
      if (agent) {
        this.state.glowConfig = computeGlow(agent);
      }
    }

    this.notify();
  }

  getActiveAgent(): Agent | null {
    return this.state.agents.find(a => a.isActive) || null;
  }

  getAgents(): Agent[] {
    return [...this.state.agents];
  }
}

export const avatarEngine = new AvatarEngine();
