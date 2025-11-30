import { useState, useEffect } from 'react'
import { useChannelStore, useMessageStore } from '../store/hooks'
import MessageList from './MessageList'
import MessageInput from './MessageInput'

export default function ChannelChatArea() {
  const channelStore = useChannelStore()
  const messageStore = useMessageStore()
  const { currentChannel } = channelStore()
  const { loadMessages } = messageStore()
  const [replyTo, setReplyTo] = useState<any | null>(null)

  // Load messages when channel changes
  useEffect(() => {
    if (currentChannel) {
      console.log('Loading messages for channel:', currentChannel.id)
      loadMessages(currentChannel.id)
    }
  }, [currentChannel?.id, loadMessages])

  if (!currentChannel) return null

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

