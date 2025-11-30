import { useEffect, useRef } from 'react';

export interface ContextMenuItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'danger';
  separator?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

/**
 * ContextMenu - A reusable context menu component
 * 
 * Features:
 * - Automatically positions itself to stay within viewport
 * - Closes on outside click or escape key
 * - Supports icons, separators, and danger variants
 */
export default function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to keep menu within viewport
  useEffect(() => {
    if (menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      
      // Check if menu goes off right edge
      if (rect.right > window.innerWidth) {
        menu.style.left = `${x - rect.width}px`;
      }
      
      // Check if menu goes off bottom edge
      if (rect.bottom > window.innerHeight) {
        menu.style.top = `${y - rect.height}px`;
      }
    }
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-lg shadow-xl border border-border py-1 min-w-[180px] z-50"
      style={{ left: x, top: y }}
    >
      {items.map((item, index) => (
        <div key={index}>
          {item.separator && index > 0 && (
            <div className="border-t border-border my-1" />
          )}
          <button
            onClick={() => {
              item.onClick();
              onClose();
            }}
            className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2 ${
              item.variant === 'danger'
                ? 'text-red-600 hover:bg-red-50'
                : 'text-text-primary hover:bg-subtle'
            }`}
          >
            {item.icon && <span className="w-4 h-4 flex items-center justify-center">{item.icon}</span>}
            <span>{item.label}</span>
          </button>
        </div>
      ))}
    </div>
  );
}

