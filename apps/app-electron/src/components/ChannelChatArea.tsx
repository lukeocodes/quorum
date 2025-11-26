import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import MessageList from './MessageList'
import MessageInput from './MessageInput'

export default function ChannelChatArea() {
  const { currentRoom } = useAppStore()
  const [replyTo, setReplyTo] = useState<any | null>(null)

  if (!currentRoom) return null

  const handleReply = (message: any) => {
    setReplyTo(message)
  }

  const handleCancelReply = () => {
    setReplyTo(null)
  }

  return (
    <div className="flex-1 flex flex-col bg-off-white overflow-hidden">
      {/* Messages */}
      <MessageList onReply={handleReply} />

      {/* Input */}
      <MessageInput replyTo={replyTo} onCancelReply={handleCancelReply} />
    </div>
  )
}

