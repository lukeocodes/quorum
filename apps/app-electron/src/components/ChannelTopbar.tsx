import { useState, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faFileLines, faEllipsisVertical, faPencil, faTrash, faCopy, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@quorum/app';
import AIMemberManager from './AIMemberManager';
import ContextMenu, { ContextMenuItem } from './ContextMenu';

export default function ChannelTopbar() {
  const { currentRoom, aiMembers, summary, contextMenuOpen, openContextMenu, closeContextMenu } = useAppStore();
  const [showAIManager, setShowAIManager] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  if (!currentRoom) return null;

  const handleMenuClick = () => {
    if (menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      setContextMenuPos({ x: rect.right - 180, y: rect.bottom + 4 }); // Align menu to right
      setShowContextMenu(true);
    }
  };

  const isGeneralChannel = currentRoom.name === 'general';

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
          if (confirm(`Are you sure you want to delete #${currentRoom.name}?`)) {
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
              {currentRoom.name}
            </h2>
            {currentRoom.description && (
              <p className="text-sm text-text-tertiary">{currentRoom.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="unstyled"
              onClick={() => setShowSummary(!showSummary)}
              className="flex items-center gap-2 px-4 py-2 text-text-secondary hover:bg-subtle rounded-lg transition-colors border border-border"
              title="View conversation summary"
            >
              <FontAwesomeIcon icon={faFileLines} className="w-5 h-5" />
              Summary
            </Button>
            <Button
              variant="unstyled"
              onClick={() => setShowAIManager(true)}
              className="flex items-center gap-2 px-4 py-2 bg-selected text-text-primary rounded-lg hover:bg-selected/90 transition-colors font-semibold"
            >
              <FontAwesomeIcon icon={faUsers} className="w-5 h-5" />
              AI Members ({aiMembers.length})
            </Button>
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

        {/* Summary Panel */}
        {showSummary && summary && (
          <div className="bg-subtle border-t border-border p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-selected mb-1">
                  Conversation Summary
                </h3>
                <p className="text-sm text-text-secondary">{summary}</p>
              </div>
              <Button
                variant="unstyled"
                size="sm"
                onClick={() => setShowSummary(false)}
                className="text-selected hover:text-selected/80 text-sm font-medium ml-4"
              >
                Hide
              </Button>
            </div>
          </div>
        )}
      </div>

      {showAIManager && (
        <AIMemberManager onClose={() => setShowAIManager(false)} />
      )}

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

