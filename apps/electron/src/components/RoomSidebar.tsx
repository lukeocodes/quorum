import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faBoxArchive, faHashtag, faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import CreateRoomModal from './CreateRoomModal'

export default function RoomSidebar() {
  const { currentServer, setCurrentServer, rooms, currentRoom, selectRoom, archiveRoom } = useAppStore()
  const [showCreateModal, setShowCreateModal] = useState(false)

  const handleSelectRoom = async (room: any) => {
    await selectRoom(room)
  }

  const handleArchiveRoom = async (e: React.MouseEvent, roomId: number) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to archive this room?')) {
      await archiveRoom(roomId)
    }
  }

  return (
    <>
      <div className="w-80 bg-navigation text-text-inverse flex flex-col border-r border-border-dark">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setCurrentServer(null)}
              className="p-1 hover:bg-subtle rounded transition-colors"
              title="Back to servers"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-selected">Quorum</h1>
          </div>
          <p className="text-sm text-text-tertiary">{currentServer?.name || 'Server'}</p>
        </div>

        {/* New Room Button */}
        <div className="p-4 border-b border-border">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-selected hover:bg-selected/90 text-text-primary py-2 px-4 rounded-lg transition-colors font-medium"
          >
            <FontAwesomeIcon icon={faPlus} className="w-5 h-5" />
            New Room
          </button>
        </div>

        {/* Rooms List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-2">
            {rooms.length === 0 ? (
              <div className="text-center text-text-tertiary py-8 px-4">
                <p className="text-sm">No rooms yet</p>
                <p className="text-xs mt-1">Create your first room to get started</p>
              </div>
            ) : (
              <div className="space-y-1">
                {rooms.map((room) => {
                  const hasActivity = useAppStore.getState().roomsWithActivity.has(room.id)
                  
                  return (
                    <div
                      key={room.id}
                      onClick={() => handleSelectRoom(room)}
                      className={`
                        group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
                        ${currentRoom?.id === room.id
                          ? 'bg-subtle border border-selected'
                          : 'hover:bg-off-white'
                        }
                      `}
                    >
                      <FontAwesomeIcon icon={faHashtag} className="w-5 h-5 flex-shrink-0 text-selected" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{room.name}</p>
                          {hasActivity && currentRoom?.id !== room.id && (
                            <span className="w-2 h-2 bg-selected rounded-full animate-pulse" title="AI responding" />
                          )}
                        </div>
                        {room.description && (
                          <p className="text-xs text-text-tertiary truncate">
                            {room.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => handleArchiveRoom(e, room.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-subtle rounded transition-opacity"
                        title="Archive room"
                      >
                        <FontAwesomeIcon icon={faBoxArchive} className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-dark text-xs text-text-tertiary">
          <p>Version 0.1.0</p>
        </div>
      </div>

      {showCreateModal && (
        <CreateRoomModal onClose={() => setShowCreateModal(false)} />
      )}
    </>
  )
}

