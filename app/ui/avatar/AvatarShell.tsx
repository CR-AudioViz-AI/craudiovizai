'use client';

import React, { useEffect, useState } from 'react';
import { useEngine } from '../state/EngineContext';
import { AvatarGlow } from './AvatarGlow';
import { AvatarStack } from './AvatarStack';
import { avatarEngine, Agent, computeGlow } from '@/ui-engines/avatar-engine';
import { Badge, Spinner } from '../components';
import './avatar.css';

export const AvatarShell: React.FC = () => {
  const { state } = useEngine();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);

  useEffect(() => {
    // Initialize default agent (Javari)
    if (agents.length === 0) {
      avatarEngine.addAgent({
        id: 'javari',
        name: 'Javari',
        color: 'rgba(79, 70, 229, 0.8)',
        state: 'idle'
      });
    }

    const unsubscribe = avatarEngine.subscribe((engineState) => {
      setAgents(engineState.agents);
      setActiveAgent(avatarEngine.getActiveAgent());
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Sync AEC state with avatar engine
    if (activeAgent) {
      const aecStateMap = {
        'idle': 'idle' as const,
        'listening': 'listening' as const,
        'thinking': 'thinking' as const,
        'speaking': 'speaking' as const,
        'error': 'idle' as const
      };

      avatarEngine.setAgentState(
        activeAgent.id, 
        aecStateMap[state.mode]
      );
    }
  }, [state.mode, activeAgent]);

  const handleAgentClick = (agentId: string) => {
    avatarEngine.setActiveAgent(agentId);
  };

  const glowConfig = computeGlow(activeAgent);

  return (
    <div className="avatar-shell">
      <div className="avatar-header">
        <h2 className="avatar-header__title">
          {activeAgent?.name || 'Javari AI'}
        </h2>
        <div className="avatar-header__status">
          <Badge
            variant={
              state.mode === 'speaking' ? 'success' :
              state.mode === 'listening' ? 'info' :
              state.mode === 'thinking' ? 'warning' :
              state.mode === 'error' ? 'error' :
              'default'
            }
            size="sm"
            dot
          >
            {state.mode}
          </Badge>
        </div>
      </div>

      <div className="avatar-container">
        <div className="avatar-viewport">
          {/* Glow Layer */}
          <AvatarGlow config={glowConfig} size={240} />

          {/* Avatar Render Area */}
          <div className={`avatar-render avatar-render--${state.mode}`}>
            {state.isProcessing ? (
              <div className="avatar-render__loading">
                <Spinner size="lg" color="primary" />
                <p className="avatar-render__status">Processing...</p>
              </div>
            ) : (
              <div className="avatar-render__placeholder">
                <div className="avatar-render__icon">
                  {activeAgent?.name.charAt(0).toUpperCase() || 'J'}
                </div>
                <p className="avatar-render__label">
                  Avatar Ready
                </p>
                <p className="avatar-render__sublabel">
                  Phase 4: Video Integration
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Multi-Agent Stack */}
        {agents.length > 1 && (
          <div className="avatar-agents">
            <AvatarStack 
              agents={agents}
              onAgentClick={handleAgentClick}
            />
          </div>
        )}
      </div>
    </div>
  );
};
