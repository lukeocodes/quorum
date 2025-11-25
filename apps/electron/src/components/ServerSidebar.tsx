import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../store/appStore'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHashtag, faEllipsisVertical, faChevronRight, faPencil, faTrash, faCopy } from '@fortawesome/free-solid-svg-icons'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import CreateChannelModal from './CreateChannelModal'
import CreateSectionModal from './CreateSectionModal'
import ContextMenu, { ContextMenuItem } from './ContextMenu'

/**
 * ServerSidebar - Displays channels organized in draggable sections
 * 
 * Features:
 * - Sections are draggable to reorder
 * - Channels are draggable within and between sections
 * - Default "Channels" section and "general" channel cannot be deleted
 * - Context menu on sections for create/delete actions
 */

interface Section {
  id: string
  name: string
  type: 'channels' // More types can be added later
  channelIds: number[]
  collapsed: boolean
  isDefault: boolean
}

interface SectionContextMenuState {
  sectionId: string | null
  x: number
  y: number
}

interface ChannelContextMenuState {
  channelId: number | null
  x: number
  y: number
}

interface SortableChannelProps {
  room: any
  isActive: boolean
  hasActivity: boolean
  onSelect: (room: any) => void
  onContextMenu: (channelId: number, x: number, y: number) => void
}

function SortableChannel({ room, isActive, hasActivity, onSelect, onContextMenu }: SortableChannelProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `channel-${room.id}`, data: { type: 'channel', channelId: room.id } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onContextMenu(room.id, e.clientX, e.clientY)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(room)}
      onContextMenu={handleContextMenu}
      className={`
        group relative flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-colors
        ${isActive
          ? 'bg-selected text-text-inverse font-semibold'
          : 'hover:bg-subtle hover:text-text-primary text-text-inverse'
        }
      `}
    >
      <FontAwesomeIcon icon={faHashtag} className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
      <div className="flex-1 min-w-0 flex items-center gap-1.5">
        <p className="text-sm truncate leading-tight">{room.name}</p>
        {hasActivity && !isActive && (
          <span className="w-1.5 h-1.5 bg-selected rounded-full animate-pulse flex-shrink-0" title="AI responding" />
        )}
      </div>
    </div>
  )
}

interface SortableSectionProps {
  section: Section
  rooms: any[]
  currentRoomId: number | undefined
  roomsWithActivity: Set<number>
  onSelectRoom: (room: any) => void
  onToggleCollapse: (sectionId: string) => void
  onSectionContextMenu: (sectionId: string, x: number, y: number) => void
  onChannelContextMenu: (channelId: number, x: number, y: number) => void
}

function SortableSection({
  section,
  rooms,
  currentRoomId,
  roomsWithActivity,
  onSelectRoom,
  onToggleCollapse,
  onSectionContextMenu,
  onChannelContextMenu,
}: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `section-${section.id}`, data: { type: 'section', sectionId: section.id } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onSectionContextMenu(section.id, e.clientX, e.clientY)
  }

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    onSectionContextMenu(section.id, rect.right, rect.bottom)
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className="flex items-center gap-1 px-2 py-1 text-text-inverse-muted hover:text-text-inverse cursor-pointer group/header transition-colors"
        onContextMenu={handleContextMenu}
      >
        <div {...attributes} {...listeners} className="flex items-center gap-1 flex-1">
          <FontAwesomeIcon
            icon={faChevronRight}
            className={`w-3 h-3 transition-transform ${section.collapsed ? '' : 'rotate-90'}`}
            onClick={(e) => {
              e.stopPropagation()
              onToggleCollapse(section.id)
            }}
          />
          <span className="text-xs font-semibold uppercase tracking-wide">{section.name}</span>
          <span className="text-xs opacity-60">{section.channelIds.length}</span>
        </div>
        <button
          onClick={handleMenuClick}
          className="opacity-0 group-hover/header:opacity-100 p-0.5 hover:bg-subtle rounded transition-opacity"
          title="Section options"
        >
          <FontAwesomeIcon icon={faEllipsisVertical} className="w-3 h-3" />
        </button>
      </div>

      {!section.collapsed && (
        <SortableContext
          items={section.channelIds.map(id => `channel-${id}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-0.5 mt-0.5">
            {section.channelIds.length === 0 ? (
              <div className="px-2 py-3 text-center text-text-inverse-muted text-xs opacity-50">
                Drop channels here
              </div>
            ) : (
              section.channelIds.map((channelId) => {
                const room = rooms.find(r => r && r.id === channelId)
                if (!room) return null
                return (
                  <SortableChannel
                    key={room.id}
                    room={room}
                    isActive={currentRoomId === room.id}
                    hasActivity={roomsWithActivity.has(room.id)}
                    onSelect={onSelectRoom}
                    onContextMenu={onChannelContextMenu}
                  />
                )
              })
            )}
          </div>
        </SortableContext>
      )}
    </div>
  )
}

export default function ServerSidebar() {
  const { rooms, currentRoom, selectRoom, roomsWithActivity, currentServer, activeSession } = useAppStore()
  const [sections, setSections] = useState<Section[]>([])
  const [sectionContextMenu, setSectionContextMenu] = useState<SectionContextMenuState>({ sectionId: null, x: 0, y: 0 })
  const [channelContextMenu, setChannelContextMenu] = useState<ChannelContextMenuState>({ channelId: null, x: 0, y: 0 })
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [showCreateSection, setShowCreateSection] = useState(false)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [isLoadingSections, setIsLoadingSections] = useState(true)
  const saveSectionsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load sections from SQLite when server changes
  useEffect(() => {
    async function loadSections() {
      if (!currentServer || !activeSession || rooms.length === 0) {
        setIsLoadingSections(false)
        return
      }

      try {
        setIsLoadingSections(true)
        const result = await window.electronAPI.loadSections(activeSession.id, currentServer.id)
        
        if (result.success && result.data && result.data.length > 0) {
          // Sections exist in database - use them but add any new channels
          const allExistingChannelIds = new Set(result.data.flatMap(s => s.channelIds))
          const newChannelIds = rooms.filter(r => r && !allExistingChannelIds.has(r.id)).map(r => r.id)
          
          if (newChannelIds.length > 0) {
            // Add new channels to the default section
            const updatedSections = result.data.map(section => 
              section.isDefault
                ? { ...section, channelIds: [...section.channelIds, ...newChannelIds] }
                : section
            )
            setSections(updatedSections)
          } else {
            setSections(result.data)
          }
        } else {
          // No saved sections - create default
          const defaultSection: Section = {
            id: 'default-channels',
            name: 'Channels',
            type: 'channels',
            channelIds: rooms.filter(r => r).map(r => r.id),
            collapsed: false,
            isDefault: true,
          }
          setSections([defaultSection])
        }
      } catch (error) {
        console.error('Error loading sections:', error)
        // Fall back to default section
        const defaultSection: Section = {
          id: 'default-channels',
          name: 'Channels',
          type: 'channels',
          channelIds: rooms.filter(r => r).map(r => r.id),
          collapsed: false,
          isDefault: true,
        }
        setSections([defaultSection])
      } finally {
        setIsLoadingSections(false)
      }
    }

    loadSections()
  }, [currentServer, activeSession, rooms])

  // Save sections to SQLite when they change (debounced)
  useEffect(() => {
    if (isLoadingSections || !currentServer || !activeSession || sections.length === 0) {
      return
    }

    // Debounce saves to avoid too many writes
    if (saveSectionsTimeoutRef.current) {
      clearTimeout(saveSectionsTimeoutRef.current)
    }

    saveSectionsTimeoutRef.current = setTimeout(async () => {
      try {
        await window.electronAPI.saveSections(activeSession.id, currentServer.id, sections)
        console.log('✅ Sections saved to SQLite')
      } catch (error) {
        console.error('Error saving sections:', error)
      }
    }, 500) // 500ms debounce

    return () => {
      if (saveSectionsTimeoutRef.current) {
        clearTimeout(saveSectionsTimeoutRef.current)
      }
    }
  }, [sections, currentServer, activeSession, isLoadingSections])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null)
    const { active, over } = event

    if (!over || active.id === over.id) return

    const activeData = active.data.current
    const overData = over.data.current

    // Section reordering
    if (activeData?.type === 'section' && overData?.type === 'section') {
      const oldIndex = sections.findIndex(s => `section-${s.id}` === active.id)
      const newIndex = sections.findIndex(s => `section-${s.id}` === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newSections = [...sections]
        const [movedSection] = newSections.splice(oldIndex, 1)
        newSections.splice(newIndex, 0, movedSection)
        setSections(newSections)
      }
    }

    // Channel moving within/between sections
    if (activeData?.type === 'channel') {
      const activeChannelId = activeData.channelId
      
      // Find which section contains the active channel
      const activeSectionIndex = sections.findIndex(s => s.channelIds.includes(activeChannelId))
      if (activeSectionIndex === -1) return

      const newSections = [...sections]

      // Dropping onto another channel
      if (overData?.type === 'channel') {
        const overChannelId = overData.channelId
        const overSectionIndex = sections.findIndex(s => s.channelIds.includes(overChannelId))
        
        if (overSectionIndex === -1) return

        // Same section - reorder
        if (activeSectionIndex === overSectionIndex) {
          const section = { ...newSections[activeSectionIndex] }
          const oldIndex = section.channelIds.indexOf(activeChannelId)
          const newIndex = section.channelIds.indexOf(overChannelId)

          const newChannelIds = [...section.channelIds]
          newChannelIds.splice(oldIndex, 1)
          newChannelIds.splice(newIndex, 0, activeChannelId)

          section.channelIds = newChannelIds
          newSections[activeSectionIndex] = section
        } else {
          // Different sections - move channel
          const activeSection = { ...newSections[activeSectionIndex] }
          const overSection = { ...newSections[overSectionIndex] }

          // Remove from active section
          activeSection.channelIds = activeSection.channelIds.filter(id => id !== activeChannelId)

          // Add to over section at the position of the over channel
          const insertIndex = overSection.channelIds.indexOf(overChannelId)
          overSection.channelIds = [
            ...overSection.channelIds.slice(0, insertIndex + 1),
            activeChannelId,
            ...overSection.channelIds.slice(insertIndex + 1),
          ]

          newSections[activeSectionIndex] = activeSection
          newSections[overSectionIndex] = overSection
        }
      } 
      // Dropping directly onto a section (header or empty section)
      else if (overData?.type === 'section') {
        const overSectionId = overData.sectionId
        const overSectionIndex = sections.findIndex(s => s.id === overSectionId)
        
        if (overSectionIndex === -1 || overSectionIndex === activeSectionIndex) return

        // Move channel to the end of the target section
        const activeSection = { ...newSections[activeSectionIndex] }
        const overSection = { ...newSections[overSectionIndex] }

        // Remove from active section
        activeSection.channelIds = activeSection.channelIds.filter(id => id !== activeChannelId)

        // Add to end of over section
        overSection.channelIds = [...overSection.channelIds, activeChannelId]

        newSections[activeSectionIndex] = activeSection
        newSections[overSectionIndex] = overSection
      }

      setSections(newSections)
    }
  }

  const handleSelectRoom = async (room: any) => {
    await selectRoom(room)
  }

  const handleToggleCollapse = (sectionId: string) => {
    setSections(prev =>
      prev.map(s => s.id === sectionId ? { ...s, collapsed: !s.collapsed } : s)
    )
  }

  const handleSectionContextMenu = (sectionId: string, x: number, y: number) => {
    setSectionContextMenu({ sectionId, x, y })
  }

  const handleChannelContextMenu = (channelId: number, x: number, y: number) => {
    setChannelContextMenu({ channelId, x, y })
  }

  const handleCreateSection = (name: string, type: string) => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      name,
      type: type as 'channels',
      channelIds: [],
      collapsed: false,
      isDefault: false,
    }
    setSections(prev => [...prev, newSection])
  }

  const handleDeleteSection = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId)
    if (!section || section.isDefault) return

    // Move channels back to default section
    setSections(prev => {
      const defaultSection = prev.find(s => s.isDefault)
      if (!defaultSection) return prev

      return prev
        .map(s => {
          if (s.id === defaultSection.id) {
            return { ...s, channelIds: [...s.channelIds, ...section.channelIds] }
          }
          return s
        })
        .filter(s => s.id !== sectionId)
    })
    setSectionContextMenu({ sectionId: null, x: 0, y: 0 })
  }

  const getSectionContextMenuItems = (): ContextMenuItem[] => {
    if (!sectionContextMenu.sectionId) return []
    
    const section = sections.find(s => s.id === sectionContextMenu.sectionId)
    if (!section) return []

    const items: ContextMenuItem[] = [
      {
        label: 'Create Channel',
        onClick: () => {
          setShowCreateChannel(true)
        },
      },
      {
        label: 'Create Section',
        onClick: () => {
          setShowCreateSection(true)
        },
      },
    ]

    if (!section.isDefault) {
      items.push({
        label: 'Delete Section',
        icon: <FontAwesomeIcon icon={faTrash} />,
        variant: 'danger',
        separator: true,
        onClick: () => handleDeleteSection(sectionContextMenu.sectionId!),
      })
    }

    return items
  }

  const getChannelContextMenuItems = (): ContextMenuItem[] => {
    if (!channelContextMenu.channelId) return []
    
    const channel = rooms.find(r => r && r.id === channelContextMenu.channelId)
    if (!channel) return []

    const isGeneralChannel = channel.name === 'general'

    const items: ContextMenuItem[] = [
      {
        label: 'Edit Channel',
        icon: <FontAwesomeIcon icon={faPencil} />,
        onClick: () => {
          // TODO: Implement edit channel
          alert('Edit channel coming soon!')
        },
      },
      {
        label: 'Copy Channel Link',
        icon: <FontAwesomeIcon icon={faCopy} />,
        onClick: () => {
          // TODO: Implement copy channel link
          alert('Copy channel link coming soon!')
        },
      },
    ]

    // Don't allow deleting general channel
    if (!isGeneralChannel) {
      items.push({
        label: 'Delete Channel',
        icon: <FontAwesomeIcon icon={faTrash} />,
        variant: 'danger',
        separator: true,
        onClick: () => {
          // TODO: Implement delete channel
          if (confirm(`Are you sure you want to delete #${channel.name}?`)) {
            alert('Delete channel coming soon!')
          }
        },
      })
    }

    return items
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="px-2 py-3">
            {rooms.length === 0 ? (
              <div className="text-center text-text-inverse-muted py-6 px-3">
                <p className="text-xs">No channels yet</p>
                <p className="text-xs mt-1 opacity-70">Create your first channel</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sections.map(s => `section-${s.id}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {sections.map((section) => (
                      <SortableSection
                        key={section.id}
                        section={section}
                        rooms={rooms}
                        currentRoomId={currentRoom?.id}
                        roomsWithActivity={roomsWithActivity}
                        onSelectRoom={handleSelectRoom}
                        onToggleCollapse={handleToggleCollapse}
                        onSectionContextMenu={handleSectionContextMenu}
                        onChannelContextMenu={handleChannelContextMenu}
                      />
                    ))}
                  </div>
                </SortableContext>
                
                {/* Drag Overlay for visual feedback */}
                <DragOverlay>
                  {activeDragId ? (() => {
                    // Determine what's being dragged
                    if (activeDragId.startsWith('channel-')) {
                      const channelId = parseInt(activeDragId.replace('channel-', ''))
                      const room = rooms.find(r => r && r.id === channelId)
                      if (room) {
                        return (
                          <div className="bg-navigation text-text-inverse px-2 py-1 rounded shadow-lg flex items-center gap-2 opacity-90">
                            <FontAwesomeIcon icon={faHashtag} className="w-3.5 h-3.5 opacity-70" />
                            <span className="text-sm">{room.name}</span>
                          </div>
                        )
                      }
                    } else if (activeDragId.startsWith('section-')) {
                      const sectionId = activeDragId.replace('section-', '')
                      const section = sections.find(s => s.id === sectionId)
                      if (section) {
                        return (
                          <div className="bg-navigation text-text-inverse px-2 py-1 rounded shadow-lg opacity-90">
                            <span className="text-xs font-semibold uppercase tracking-wide">{section.name}</span>
                          </div>
                        )
                      }
                    }
                    return null
                  })() : null}
                </DragOverlay>
              </DndContext>
            )}
          </div>
        </div>

      {/* Section Context Menu */}
      {sectionContextMenu.sectionId && (
        <ContextMenu
          x={sectionContextMenu.x}
          y={sectionContextMenu.y}
          items={getSectionContextMenuItems()}
          onClose={() => setSectionContextMenu({ sectionId: null, x: 0, y: 0 })}
        />
      )}

      {/* Channel Context Menu */}
      {channelContextMenu.channelId && (
        <ContextMenu
          x={channelContextMenu.x}
          y={channelContextMenu.y}
          items={getChannelContextMenuItems()}
          onClose={() => setChannelContextMenu({ channelId: null, x: 0, y: 0 })}
        />
      )}

      {/* Modals */}
      {showCreateChannel && (
        <CreateChannelModal onClose={() => setShowCreateChannel(false)} />
      )}
      {showCreateSection && (
        <CreateSectionModal
          onClose={() => setShowCreateSection(false)}
          onCreateSection={handleCreateSection}
        />
      )}
    </>
  )
}
