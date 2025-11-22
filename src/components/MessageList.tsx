import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/appStore'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleUser, faReply } from '@fortawesome/free-solid-svg-icons'
import { convertTagsToMentions } from '../utils/mention-utils'

interface MessageListProps {
  onReply: (message: any) => void
}

export default function MessageList({ onReply }: MessageListProps) {
  const { messages, aiThinking, mentionableMembers } = useAppStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const renderMessageContent = (content: string) => {
    if (!mentionableMembers) return content
    
    // Convert tags like <@user:123> to @Username
    const displayContent = convertTagsToMentions(
      content,
      mentionableMembers.users,
      mentionableMembers.aiMembers
    )
    
    // Highlight mentions in the display
    const parts = displayContent.split(/(@\w+)/g)
    return (
      <>
        {parts.map((part, index) => {
          if (part.startsWith('@')) {
            return (
              <span key={index} className="text-selected font-semibold bg-selected/10 px-1 rounded">
                {part}
              </span>
            )
          }
          return <span key={index}>{part}</span>
        })}
      </>
    )
  }

  const getMemberDisplayName = (message: any) => {
    if (message.member_type === 'user') {
      return message.member_display_name || message.member_name || 'User'
    } else {
      return message.member_name || 'AI'
    }
  }

  const getMemberAvatar = (message: any) => {
    if (message.member_type === 'user') {
      return (
        <FontAwesomeIcon 
          icon={faCircleUser}
          className="w-10 h-10" 
          style={{ color: message.member_avatar_color || '#8b5cf6' }}
        />
      )
    } else {
      return (
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-text-primary font-semibold text-sm"
          style={{ backgroundColor: message.member_avatar_color || '#8b5cf6' }}
        >
          {message.member_name?.[0] || 'AI'}
        </div>
      )
    }
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-tertiary bg-off-white">
        <div className="text-center">
          <p className="text-lg mb-2">No messages yet</p>
          <p className="text-sm">Start the conversation below</p>
          <p className="text-xs mt-4 text-text-tertiary">Tip: @mention an AI to get their response</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-4 bg-off-white">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`group flex gap-3 ${
            message.member_type === 'ai' ? 'bg-subtle -mx-6 px-6 py-4 border-l-2 border-blue-500' : ''
          }`}
        >
          {/* Avatar */}
          <div className="flex-shrink-0">
            {getMemberAvatar(message)}
          </div>

          {/* Message Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-text-primary">
                {getMemberDisplayName(message)}
              </span>
              <span className="text-xs text-text-tertiary">
                {new Date(message.created_at).toLocaleTimeString()}
              </span>
            </div>

            {/* Reply Indicator */}
            {message.reply_to_message_id && message.reply_to_content && (
              <div className="mb-2 pl-3 border-l-2 border-selected text-sm text-text-secondary">
                <span className="text-xs text-text-tertiary">
                  Replying to {message.reply_to_member_name || 'someone'}:
                </span>
                <p className="truncate max-w-md">
                  {message.reply_to_content.substring(0, 100)}
                  {message.reply_to_content.length > 100 ? '...' : ''}
                </p>
              </div>
            )}

            {/* Message Text */}
            <p className="text-text-secondary whitespace-pre-wrap break-words">
              {renderMessageContent(message.content)}
            </p>

            {/* Reply Button */}
            <button
              onClick={() => onReply(message)}
              className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-text-tertiary hover:text-selected"
            >
              <FontAwesomeIcon icon={faReply} className="w-3 h-3" />
              Reply
            </button>
          </div>
        </div>
      ))}
      
      {/* AI Thinking Indicator */}
      {aiThinking && (
        <div className="flex gap-3 bg-subtle -mx-6 px-6 py-4 border-l-4 border-selected">
          <div className="w-10 h-10 rounded-full bg-selected/20 flex items-center justify-center">
            <div className="w-2 h-2 bg-selected rounded-full animate-bounce" />
          </div>
          <div className="flex-1">
            <p className="text-text-tertiary italic">AI is thinking...</p>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  )
}
