import { useState, useRef, useEffect } from 'react'
import { useChannelStore, useMessageStore } from '../store/hooks'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane, faXmark } from '@fortawesome/free-solid-svg-icons'
import { Button } from './primitives'

interface MessageInputProps {
  replyTo: any | null
  onCancelReply: () => void
}

export default function MessageInput({ replyTo, onCancelReply }: MessageInputProps) {
  const channelStore = useChannelStore()
  const messageStore = useMessageStore()
  const { currentChannel } = channelStore()
  const { send: sendMessage } = messageStore()
  
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isDisabled = sending

  useEffect(() => {
    // Focus textarea when component mounts or when reply is set
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [replyTo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isDisabled || !currentChannel) return

    setSending(true)
    try {
      await sendMessage(currentChannel.id, content.trim(), replyTo?.id || undefined)
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
      handleSubmit(e)
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    
    setContent(newContent)
    
    // Auto-resize textarea - reset to initial height (36px = h-10), then expand to content
    e.target.style.height = '36px'
    e.target.style.height = e.target.scrollHeight + 'px'
  }

  const getMemberDisplayName = (message: any) => {
    return message.member_display_name || message.member_name || 'User'
  }

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
            type="submit"
            variant="unstyled"
            disabled={!content.trim() || isDisabled}
            className="!px-4 !py-2 !text-sm !leading-5 !h-10 bg-selected text-text-inverse rounded-lg hover:bg-selected/90 transition-colors disabled:bg-border disabled:cursor-not-allowed flex items-center justify-center gap-1.5 font-semibold shrink-0"
          >
            <FontAwesomeIcon icon={faPaperPlane} className="w-4 h-4" />
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </form>
      </div>
    </div>
  )
}

