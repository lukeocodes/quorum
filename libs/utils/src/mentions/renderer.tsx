import React from 'react';
import { TagType } from '@quorum/proto';
import { parseAllTags } from './parser';
import type { EntityLookup } from './converter';

/**
 * Click handler options for tag interactions
 */
export interface TagClickHandlers {
  onUserClick?: (userId: number) => void;
  onAIClick?: (aiId: number) => void;
  onChannelClick?: (channelId: number) => void;
  onAppClick?: (appId: number) => void;
  onServerClick?: (serverId: number) => void;
}

/**
 * Tag style customization
 */
export interface TagStyles {
  user?: React.CSSProperties;
  ai?: React.CSSProperties;
  channel?: React.CSSProperties;
  app?: React.CSSProperties;
  server?: React.CSSProperties;
  url?: React.CSSProperties;
}

/**
 * Default tag styles
 */
const defaultStyles: Required<TagStyles> = {
  user: {
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: 500,
  },
  ai: {
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: 500,
  },
  channel: {
    backgroundColor: '#5865f220',
    color: '#5865f2',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: 500,
  },
  app: {
    backgroundColor: '#9b59b620',
    color: '#9b59b6',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: 500,
  },
  server: {
    backgroundColor: '#e74c3c20',
    color: '#e74c3c',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: 500,
  },
  url: {
    color: '#00a8ff',
    textDecoration: 'underline',
  },
};

/**
 * Render message content with properly styled tags as React elements
 * @param content - Message content with tags
 * @param entities - Entity lookup for resolving IDs to names
 * @param options - Click handlers and style overrides
 * @returns Array of React nodes
 */
export function renderMessageWithTags(
  content: string,
  entities: EntityLookup = {},
  options?: {
    handlers?: TagClickHandlers;
    styles?: TagStyles;
  }
): React.ReactNode[] {
  const { users = [], aiMembers = [], channels = [], apps = [], servers = [] } = entities;
  const handlers = options?.handlers || {};
  const customStyles = options?.styles || {};
  const tags = parseAllTags(content);
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;

  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i];

    // Add text before this tag
    if (tag.startIndex > lastIndex) {
      const text = content.substring(lastIndex, tag.startIndex);
      elements.push(<span key={`text-${lastIndex}`}>{text}</span>);
    }

    // Render the tag
    const tagKey = `tag-${i}-${tag.startIndex}`;

    switch (tag.type) {
      case TagType.User: {
        const user = users.find((u) => u.id === tag.id);
        if (user) {
          const userStyle = {
            ...defaultStyles.user,
            backgroundColor: user.avatar_color ? `${user.avatar_color}20` : '#99999920',
            color: user.avatar_color || '#999999',
            cursor: handlers.onUserClick ? 'pointer' : 'default',
            ...customStyles.user,
          };
          elements.push(
            <span
              key={tagKey}
              className="mention mention-user"
              style={userStyle}
              onClick={() => handlers.onUserClick?.(user.id)}
            >
              @{user.display_name || user.username}
            </span>
          );
        } else {
          elements.push(<span key={tagKey}>{tag.raw}</span>);
        }
        break;
      }

      case TagType.AI: {
        const ai = aiMembers.find((a) => a.id === tag.id);
        if (ai) {
          const aiStyle = {
            ...defaultStyles.ai,
            backgroundColor: ai.avatar_color ? `${ai.avatar_color}20` : '#99999920',
            color: ai.avatar_color || '#999999',
            cursor: handlers.onAIClick ? 'pointer' : 'default',
            ...customStyles.ai,
          };
          elements.push(
            <span
              key={tagKey}
              className="mention mention-ai"
              style={aiStyle}
              onClick={() => handlers.onAIClick?.(ai.id)}
            >
              @{ai.name}
            </span>
          );
        } else {
          elements.push(<span key={tagKey}>{tag.raw}</span>);
        }
        break;
      }

      case TagType.Channel: {
        const channel = channels.find((c) => c.id === tag.id);
        if (channel) {
          const channelStyle = {
            ...defaultStyles.channel,
            cursor: handlers.onChannelClick ? 'pointer' : 'default',
            ...customStyles.channel,
          };
          elements.push(
            <span
              key={tagKey}
              className="mention mention-channel"
              style={channelStyle}
              onClick={() => handlers.onChannelClick?.(channel.id)}
            >
              #{channel.name}
            </span>
          );
        } else {
          elements.push(<span key={tagKey}>{tag.raw}</span>);
        }
        break;
      }

      case TagType.App: {
        const app = apps.find((a) => a.id === tag.id);
        if (app) {
          const appStyle = {
            ...defaultStyles.app,
            cursor: handlers.onAppClick ? 'pointer' : 'default',
            ...customStyles.app,
          };
          elements.push(
            <span
              key={tagKey}
              className="mention mention-app"
              style={appStyle}
              onClick={() => handlers.onAppClick?.(app.id)}
            >
              #{app.name}
            </span>
          );
        } else {
          elements.push(<span key={tagKey}>{tag.raw}</span>);
        }
        break;
      }

      case TagType.Server: {
        const server = servers.find((s) => s.id === tag.id);
        if (server) {
          const serverStyle = {
            ...defaultStyles.server,
            cursor: handlers.onServerClick ? 'pointer' : 'default',
            ...customStyles.server,
          };
          elements.push(
            <span
              key={tagKey}
              className="mention mention-server"
              style={serverStyle}
              onClick={() => handlers.onServerClick?.(server.id)}
            >
              !{server.name}
            </span>
          );
        } else {
          elements.push(<span key={tagKey}>{tag.raw}</span>);
        }
        break;
      }

      case TagType.URL: {
        const url = tag.url || '';
        const displayText = tag.text || url;
        const urlStyle = {
          ...defaultStyles.url,
          ...customStyles.url,
        };
        elements.push(
          <a
            key={tagKey}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="message-link"
            style={urlStyle}
          >
            {displayText}
          </a>
        );
        break;
      }
    }

    lastIndex = tag.endIndex;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    elements.push(<span key={`text-${lastIndex}`}>{content.substring(lastIndex)}</span>);
  }

  return elements;
}

/**
 * React component for rendering a message with tags
 */
export interface MessageWithTagsProps {
  content: string;
  entities?: EntityLookup;
  handlers?: TagClickHandlers;
  styles?: TagStyles;
  className?: string;
}

export const MessageWithTags: React.FC<MessageWithTagsProps> = ({
  content,
  entities = {},
  handlers,
  styles,
  className,
}) => {
  const rendered = renderMessageWithTags(content, entities, { handlers, styles });

  return <div className={className}>{rendered}</div>;
};

