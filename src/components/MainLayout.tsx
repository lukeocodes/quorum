import { useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import RoomSidebar from './RoomSidebar'
import ChatArea from './ChatArea'

export default function MainLayout() {
  const { currentServer, loadRooms, currentRoom } = useAppStore()

  useEffect(() => {
    if (currentServer) {
      loadRooms(currentServer.id)
    }
  }, [currentServer])

  return (
    <div className="h-screen flex overflow-hidden bg-off-white">
      <RoomSidebar />
      {currentRoom ? (
        <ChatArea />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-2xl font-semibold text-text-primary mb-2">
              Welcome to Quorum
            </h2>
            <p className="text-text-tertiary">
              Select a room or create a new one to start a discussion
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

