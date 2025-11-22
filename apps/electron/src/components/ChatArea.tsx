import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import AIMemberManager from './AIMemberManager'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUsers, faFileLines } from '@fortawesome/free-solid-svg-icons'

export default function ChatArea() {
  const { currentRoom, aiMembers, summary } = useAppStore()
  const [showAIManager, setShowAIManager] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [replyTo, setReplyTo] = useState<any | null>(null)

  if (!currentRoom) return null

  const handleReply = (message: any) => {
    setReplyTo(message)
  }

  const handleCancelReply = () => {
    setReplyTo(null)
  }

  return (
    <>
      <div className="flex-1 flex flex-col bg-off-white">
        {/* Header */}
        <div className="h-16 border-b border-border flex items-center justify-between px-6">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              {currentRoom.name}
            </h2>
            {currentRoom.description && (
              <p className="text-sm text-text-tertiary">{currentRoom.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSummary(!showSummary)}
              className="flex items-center gap-2 px-4 py-2 text-text-secondary hover:bg-subtle rounded-lg transition-colors border border-border"
              title="View conversation summary"
            >
              <FontAwesomeIcon icon={faFileLines} className="w-5 h-5" />
              Summary
            </button>
            <button
              onClick={() => setShowAIManager(true)}
              className="flex items-center gap-2 px-4 py-2 bg-selected text-text-primary rounded-lg hover:bg-selected/90 transition-colors font-semibold"
            >
              <FontAwesomeIcon icon={faUsers} className="w-5 h-5" />
              AI Members ({aiMembers.length})
            </button>
          </div>
        </div>

        {/* Summary Panel */}
        {showSummary && summary && (
          <div className="bg-subtle border-b border-border p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-selected mb-1">
                  Conversation Summary
                </h3>
                <p className="text-sm text-text-secondary">{summary}</p>
              </div>
              <button
                onClick={() => setShowSummary(false)}
                className="text-selected hover:text-selected/80 text-sm font-medium ml-4"
              >
                Hide
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        <MessageList onReply={handleReply} />

        {/* Input */}
        <MessageInput replyTo={replyTo} onCancelReply={handleCancelReply} />
      </div>

      {showAIManager && (
        <AIMemberManager onClose={() => setShowAIManager(false)} />
      )}
    </>
  )
}

