import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane, faMicrophone, faXmark } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@quorum/ui'

interface MessageInputProps {
  replyTo: any | null
  onCancelReply: () => void
}

export default function MessageInput({ replyTo, onCancelReply }: MessageInputProps) {
  const { sendMessage, aiThinking, mentionableMembers } = useAppStore()
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [recording, setRecording] = useState(false)
  const [showMentionMenu, setShowMentionMenu] = useState(false)
  const [mentionFilter, setMentionFilter] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isDisabled = sending || aiThinking

  useEffect(() => {
    // Focus textarea when component mounts or when reply is set
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [replyTo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isDisabled) return

    setSending(true)
    try {
      await sendMessage(content.trim(), replyTo?.id || null)
      setContent('')
      if (textareaRef.current) {
        textareaRef.current.style.height = '36px'
      }
      onCancelReply()
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      
      // If mention menu is open and there are suggestions, insert the first one
      if (showMentionMenu && getMentionSuggestions().length > 0) {
        insertMention(getMentionSuggestions()[0])
      } else {
        handleSubmit(e)
      }
    } else if (e.key === 'Escape' && showMentionMenu) {
      setShowMentionMenu(false)
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    const newCursorPosition = e.target.selectionStart
    
    setContent(newContent)
    setCursorPosition(newCursorPosition)
    
    // Auto-resize textarea - reset to initial height (36px = h-10), then expand to content
    e.target.style.height = '36px'
    e.target.style.height = e.target.scrollHeight + 'px'
    
    // Check for @ mention trigger
    const textBeforeCursor = newContent.substring(0, newCursorPosition)
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtSymbol !== -1) {
      const textAfterAt = newContent.substring(lastAtSymbol + 1, newCursorPosition)
      
      // Only show menu if @ is at start or preceded by whitespace
      const charBeforeAt = lastAtSymbol === 0 ? ' ' : newContent[lastAtSymbol - 1]
      if (/\s/.test(charBeforeAt) && !/\s/.test(textAfterAt)) {
        setMentionFilter(textAfterAt.toLowerCase())
        setShowMentionMenu(true)
      } else {
        setShowMentionMenu(false)
      }
    } else {
      setShowMentionMenu(false)
    }
  }

  const getMentionSuggestions = () => {
    if (!mentionableMembers) return []
    
    const allMembers = [
      ...mentionableMembers.users.map(u => ({
        type: 'user' as const,
        id: u.id,
        name: u.display_name || u.username,
        username: u.username,
        avatar_color: u.avatar_color
      })),
      ...mentionableMembers.aiMembers.map(ai => ({
        type: 'ai' as const,
        id: ai.id,
        name: ai.name,
        username: ai.name.toLowerCase().replace(/\s+/g, ''),
        avatar_color: ai.avatar_color
      }))
    ]
    
    return allMembers.filter(m => 
      m.name.toLowerCase().includes(mentionFilter) ||
      m.username.toLowerCase().includes(mentionFilter)
    ).slice(0, 5) // Limit to 5 suggestions
  }

  const insertMention = (member: any) => {
    const textBeforeCursor = content.substring(0, cursorPosition)
    const textAfterCursor = content.substring(cursorPosition)
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@')
    
    const beforeAt = content.substring(0, lastAtSymbol)
    const mention = member.name.includes(' ') ? `@"${member.name}"` : `@${member.name}`
    const newContent = beforeAt + mention + ' ' + textAfterCursor
    
    setContent(newContent)
    setShowMentionMenu(false)
    
    // Set cursor after the mention
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = beforeAt.length + mention.length + 1
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
        textareaRef.current.focus()
      }
    }, 0)
  }

  const handleVoiceInput = async () => {
    setRecording(true)
    try {
      // TODO: Implement actual audio recording
      alert('Voice input feature coming soon!')
    } catch (error) {
      console.error('Error with voice input:', error)
    } finally {
      setRecording(false)
    }
  }

  const getMemberDisplayName = (message: any) => {
    if (message.member_type === 'user') {
      return message.member_display_name || message.member_name || 'User'
    } else {
      return message.member_name || 'AI'
    }
  }

  const suggestions = showMentionMenu ? getMentionSuggestions() : []

  return (
    <div className="border-t border-border bg-off-white">
      {/* Reply Indicator */}
      {replyTo && (
        <div className="px-3 pt-2 pb-1.5 bg-subtle border-b border-border">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-text-tertiary mb-0.5">
                Replying to {getMemberDisplayName(replyTo)}
              </div>
              <div className="text-xs text-text-secondary truncate">
                {replyTo.content.substring(0, 100)}
                {replyTo.content.length > 100 ? '...' : ''}
              </div>
            </div>
            <Button
              variant="unstyled"
              size="icon"
              onClick={onCancelReply}
              className="p-0.5 hover:bg-subtle rounded transition-colors"
              title="Cancel reply"
            >
              <FontAwesomeIcon icon={faXmark} className="w-3 h-3 text-text-tertiary" />
            </Button>
          </div>
        </div>
      )}

      {/* Mention Autocomplete Menu */}
      {showMentionMenu && suggestions.length > 0 && (
        <div className="px-3 py-1.5 border-b border-border bg-subtle max-h-48 overflow-y-auto">
          <div className="space-y-0.5">
            {suggestions.map((member) => (
              <Button
                key={`${member.type}-${member.id}`}
                variant="unstyled"
                onClick={() => insertMention(member)}
                className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-subtle rounded-lg text-left transition-colors"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-text-primary font-semibold text-xs flex-shrink-0"
                  style={{ backgroundColor: member.avatar_color }}
                >
                  {member.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary">{member.name}</div>
                  <div className="text-xs text-text-tertiary">
                    {member.type === 'user' ? 'User' : 'AI Member'}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 bg-subtle border-t border-border">
        <form onSubmit={handleSubmit} className="flex gap-2 items-start">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 text-sm bg-white border border-border text-text-primary placeholder-text-tertiary rounded-lg focus:ring-2 focus:ring-selected focus:border-transparent resize-none max-h-32 scrollbar-thin disabled:bg-off-white disabled:text-text-secondary h-10 min-h-10 leading-5"
            disabled={isDisabled}
          />
          
          <Button
            type="button"
            variant="unstyled"
            onClick={handleVoiceInput}
            disabled={recording}
            className={`!px-3 !py-2 !text-sm !leading-5 !h-10 rounded-lg transition-colors border flex items-center justify-center shrink-0 ${
              recording
                ? 'bg-notification text-text-primary border-notification'
                : 'bg-subtle text-text-secondary hover:bg-border border-border'
            }`}
            title="Voice input (coming soon)"
          >
            <FontAwesomeIcon icon={faMicrophone} className="w-3.5 h-3.5" />
          </Button>
          
          <Button
            type="submit"
            variant="unstyled"
            disabled={!content.trim() || isDisabled}
            className="!px-4 !py-2 !text-sm !leading-5 !h-10 bg-selected text-text-inverse rounded-lg hover:bg-selected/90 transition-colors disabled:bg-border disabled:cursor-not-allowed flex items-center justify-center gap-1.5 font-semibold shrink-0"
          >
            <FontAwesomeIcon icon={faPaperPlane} className="w-4 h-4" />
            {sending ? 'Sending...' : aiThinking ? 'Waiting...' : 'Send'}
          </Button>
        </form>
      </div>
    </div>
  )
}
