import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane, faMicrophone, faXmark } from '@fortawesome/free-solid-svg-icons'

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
        textareaRef.current.style.height = 'auto'
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
    
    // Auto-resize textarea
    e.target.style.height = 'auto'
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
        <div className="px-4 pt-3 pb-2 bg-subtle border-b border-border">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-text-tertiary mb-1">
                Replying to {getMemberDisplayName(replyTo)}
              </div>
              <div className="text-sm text-text-secondary truncate">
                {replyTo.content.substring(0, 100)}
                {replyTo.content.length > 100 ? '...' : ''}
              </div>
            </div>
            <button
              onClick={onCancelReply}
              className="p-1 hover:bg-subtle rounded transition-colors"
              title="Cancel reply"
            >
              <FontAwesomeIcon icon={faXmark} className="w-4 h-4 text-text-tertiary" />
            </button>
          </div>
        </div>
      )}

      {/* Mention Autocomplete Menu */}
      {showMentionMenu && suggestions.length > 0 && (
        <div className="px-4 py-2 border-b border-border bg-subtle max-h-48 overflow-y-auto">
          <div className="space-y-1">
            {suggestions.map((member) => (
              <button
                key={`${member.type}-${member.id}`}
                onClick={() => insertMention(member)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-subtle rounded-lg text-left transition-colors"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-text-primary font-semibold text-xs flex-shrink-0"
                  style={{ backgroundColor: member.avatar_color }}
                >
                  {member.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-text-primary">{member.name}</div>
                  <div className="text-xs text-text-tertiary">
                    {member.type === 'user' ? 'User' : 'AI Member'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-subtle border-t border-border">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={
              aiThinking 
                ? "Waiting for AI responses..." 
                : "Type your message... (@mention to tag someone, Shift+Enter for new line)"
            }
            className="flex-1 px-4 py-3 bg-white border border-border text-text-primary placeholder-text-tertiary rounded-lg focus:ring-2 focus:ring-selected focus:border-transparent resize-none max-h-32 scrollbar-thin disabled:bg-off-white disabled:text-text-secondary"
            rows={1}
            disabled={isDisabled}
          />
          
          <button
            type="button"
            onClick={handleVoiceInput}
            disabled={recording}
            className={`px-4 py-3 rounded-lg transition-colors border ${
              recording
                ? 'bg-notification text-text-primary border-notification'
                : 'bg-subtle text-text-secondary hover:bg-border border-border'
            }`}
            title="Voice input (coming soon)"
          >
            <FontAwesomeIcon icon={faMicrophone} className="w-5 h-5" />
          </button>
          
          <button
            type="submit"
            disabled={!content.trim() || isDisabled}
            className="px-6 py-3 bg-selected text-text-inverse rounded-lg hover:bg-selected/90 transition-colors disabled:bg-border disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
          >
            <FontAwesomeIcon icon={faPaperPlane} className="w-5 h-5" />
            {sending ? 'Sending...' : aiThinking ? 'Waiting...' : 'Send'}
          </button>
        </form>
        
        <p className="text-xs text-text-tertiary mt-2">
          Tip: Use @name to mention users or AI members
        </p>
      </div>
    </div>
  )
}
