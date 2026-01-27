'use client';

import React from 'react';
import { Agent } from '@/ui-engines/avatar-engine';
import { Badge } from '../components';
import './avatar.css';

interface AvatarStackProps {
  agents: Agent[];
  onAgentClick?: (agentId: string) => void;
  maxVisible?: number;
}

export const AvatarStack: React.FC<AvatarStackProps> = ({ 
  agents, 
  onAgentClick,
  maxVisible = 5
}) => {
  const visibleAgents = agents.slice(0, maxVisible);
  const remainingCount = Math.max(0, agents.length - maxVisible);

  return (
    <div className="avatar-stack">
      <div className="avatar-stack__list">
        {visibleAgents.map((agent, index) => (
          <button
            key={agent.id}
            className={`avatar-stack__item ${agent.isActive ? 'avatar-stack__item--active' : ''}`}
            onClick={() => onAgentClick?.(agent.id)}
            style={{ 
              '--stack-index': index,
              '--agent-color': agent.color
            } as React.CSSProperties}
            aria-label={`${agent.name} - ${agent.state}`}
            aria-current={agent.isActive}
          >
            <div className="avatar-stack__avatar">
              {agent.avatarUrl ? (
                <img 
                  src={agent.avatarUrl} 
                  alt={agent.name}
                  className="avatar-stack__image"
                />
              ) : (
                <div className="avatar-stack__placeholder">
                  {agent.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            <Badge 
              variant={
                agent.state === 'speaking' ? 'success' :
                agent.state === 'listening' ? 'info' :
                agent.state === 'thinking' ? 'warning' :
                'default'
              }
              size="sm"
              dot
            />
          </button>
        ))}
        
        {remainingCount > 0 && (
          <div className="avatar-stack__overflow">
            +{remainingCount}
          </div>
        )}
      </div>
      
      <div className="avatar-stack__labels">
        {visibleAgents.map(agent => (
          <div 
            key={`label-${agent.id}`}
            className={`avatar-stack__label ${agent.isActive ? 'avatar-stack__label--active' : ''}`}
          >
            <span className="avatar-stack__name">{agent.name}</span>
            <span className="avatar-stack__state">{agent.state}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
