import { useEffect, useState } from 'react';
import { Server } from '../types/electron';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPencil, faTrash, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@quorum/app';
import clsx from 'clsx';
import { useAppStore } from '../store/appStore';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ContextMenu, { ContextMenuItem } from './ContextMenu';

const { electronAPI } = window;

interface AppSidebarProps {
  onServerChange?: (server: Server | null) => void;
}

interface SortableServerItemProps {
  server: Server;
  isActive: boolean;
  isHovered: boolean;
  onServerClick: (server: Server) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onContextMenu: (server: Server, x: number, y: number) => void;
}

function SortableServerItem({
  server,
  isActive,
  isHovered,
  onServerClick,
  onMouseEnter,
  onMouseLeave,
  onContextMenu,
}: SortableServerItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: server.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu(server, e.clientX, e.clientY);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onContextMenu={handleContextMenu}
    >
      <div {...attributes} {...listeners}>
        <Button
          variant="unstyled"
          size="icon"
          onClick={() => onServerClick(server)}
          className={clsx(
            'w-12 h-12 rounded-2xl flex items-center justify-center text-off-white text-lg font-bold transition-all duration-200 cursor-grab active:cursor-grabbing',
            isActive
              ? 'bg-selected rounded-xl'
              : 'bg-secondary-700 hover:bg-selected hover:rounded-xl'
          )}
          title={server.name}
        >
          {server.name.charAt(0).toUpperCase()}
        </Button>
      </div>

      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-1 h-8 bg-off-white rounded-r pointer-events-none" />
      )}

      {/* Tooltip */}
      {isHovered && (
        <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-secondary-800 text-off-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none">
          <div className="font-semibold">{server.name}</div>
          <div className="text-xs text-text-tertiary">{server.role}</div>
        </div>
      )}
    </div>
  );
}

export default function AppSidebar({ onServerChange }: AppSidebarProps) {
  const { activeSession, servers, currentServer, setCurrentServer, updateServerOrder } = useAppStore();
  const [hoveredServerId, setHoveredServerId] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{ server: Server; x: number; y: number } | null>(null);

  // Set up drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before dragging starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = servers.findIndex((s) => s.id === active.id);
    const newIndex = servers.findIndex((s) => s.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      await updateServerOrder(oldIndex, newIndex);
    }
  };

  // Handle clicking on a server
  const handleServerClick = async (server: Server) => {
    if (server.id === currentServer?.id) return;

    setCurrentServer(server);
    onServerChange?.(server);
  };

  // Handle adding a new server via web
  const handleAddServerClick = async () => {
    try {
      await electronAPI.openAddServerFlow();
    } catch (error) {
      console.error('Error opening add server flow:', error);
    }
  };

  // Handle server context menu
  const handleServerContextMenu = (server: Server, x: number, y: number) => {
    setContextMenu({ server, x, y });
  };

  const getServerContextMenuItems = (): ContextMenuItem[] => {
    if (!contextMenu) return [];

    const items: ContextMenuItem[] = [
      {
        label: 'Edit Server',
        icon: <FontAwesomeIcon icon={faPencil} />,
        onClick: () => {
          // TODO: Implement edit server
          alert('Edit server coming soon!');
        },
      },
    ];

    // Only show leave/delete for user-added servers
    if (contextMenu.server.role === 'user') {
      items.push({
        label: 'Leave Server',
        icon: <FontAwesomeIcon icon={faRightFromBracket} />,
        variant: 'danger',
        separator: true,
        onClick: () => {
          // TODO: Implement leave server
          if (confirm(`Are you sure you want to leave ${contextMenu.server.name}?`)) {
            alert('Leave server coming soon!');
          }
        },
      });
    }

    return items;
  };

  return (
    <>
      <div className="w-20 flex-shrink-0 bg-navigation flex flex-col items-center py-4 space-y-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={servers.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {/* Server Icons */}
            {servers.map((server) => (
              <SortableServerItem
                key={server.id}
                server={server}
                isActive={currentServer?.id === server.id}
                isHovered={hoveredServerId === server.id}
                onServerClick={handleServerClick}
                onMouseEnter={() => setHoveredServerId(server.id)}
                onMouseLeave={() => setHoveredServerId(null)}
                onContextMenu={handleServerContextMenu}
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* Add Server Button */}
        <Button
          variant="unstyled"
          size="icon"
          onClick={handleAddServerClick}
          className="w-12 h-12 rounded-2xl bg-secondary-700 hover:bg-presence hover:rounded-xl flex items-center justify-center text-off-white transition-all duration-200"
          title="Add a server"
        >
          <FontAwesomeIcon icon={faPlus} className="text-xl" />
        </Button>

        {/* Separator */}
        {servers.length > 0 && (
          <div className="w-8 h-0.5 bg-secondary-700 my-2" />
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getServerContextMenuItems()}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}

