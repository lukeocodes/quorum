import { useState, useRef } from 'react';
import { useChannelStore, useAppUIStore } from '../store/hooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisVertical, faPencil, faTrash, faCopy, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { Button } from './primitives';
import ContextMenu, { ContextMenuItem } from './ContextMenu';

export default function ChannelTopbar() {
  const channelStore = useChannelStore();
  const uiStore = useAppUIStore();
  const { currentChannel } = channelStore();
  const { contextMenuOpen, openContextMenu, closeContextMenu } = uiStore();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  if (!currentChannel) return null;

  const handleMenuClick = () => {
    if (menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      setContextMenuPos({ x: rect.right - 180, y: rect.bottom + 4 }); // Align menu to right
      setShowContextMenu(true);
    }
  };

  const isGeneralChannel = currentChannel.name === 'general';

  const getChannelContextMenuItems = (): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [
      {
        label: 'Edit Channel',
        icon: <FontAwesomeIcon icon={faPencil} />,
        onClick: () => {
          // TODO: Implement edit channel
          alert('Edit channel coming soon!');
        },
      },
      {
        label: 'Copy Channel Link',
        icon: <FontAwesomeIcon icon={faCopy} />,
        onClick: () => {
          // TODO: Implement copy channel link
          alert('Copy channel link coming soon!');
        },
      },
    ];

    // Don't allow deleting general channel
    if (!isGeneralChannel) {
      items.push({
        label: 'Delete Channel',
        icon: <FontAwesomeIcon icon={faTrash} />,
        variant: 'danger',
        separator: true,
        onClick: () => {
          // TODO: Implement delete channel
          if (confirm(`Are you sure you want to delete #${currentChannel.name}?`)) {
            alert('Delete channel coming soon!');
          }
        },
      });
    }

    return items;
  };

  return (
    <>
      <div className="bg-white border-b border-border">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              {currentChannel.name}
            </h2>
            {currentChannel.description && (
              <p className="text-sm text-text-tertiary">{currentChannel.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="unstyled"
              size="icon"
              onClick={() => {
                if (contextMenuOpen) {
                  closeContextMenu()
                } else {
                  openContextMenu('channel-details')
                }
              }}
              className={`p-2 rounded-lg transition-colors ${
                contextMenuOpen
                  ? 'bg-selected text-text-primary'
                  : 'text-text-secondary hover:bg-subtle'
              }`}
              title="Channel details"
            >
              <FontAwesomeIcon icon={faInfoCircle} className="w-5 h-5" />
            </Button>
            <Button
              ref={menuButtonRef}
              variant="unstyled"
              size="icon"
              onClick={handleMenuClick}
              className="p-2 text-text-secondary hover:bg-subtle rounded-lg transition-colors"
              title="Channel options"
            >
              <FontAwesomeIcon icon={faEllipsisVertical} className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <ContextMenu
          x={contextMenuPos.x}
          y={contextMenuPos.y}
          items={getChannelContextMenuItems()}
          onClose={() => setShowContextMenu(false)}
        />
      )}
    </>
  );
}

