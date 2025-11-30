/**
 * Main Layout
 *
 * Shared main application layout for Quorum apps.
 * Uses the session store for server state and platform adapter for operations.
 */

import { useEffect, useState, useRef } from "react";
import { usePlatformAdapter } from "../adapters";
import { useSessionStore, useChannelStore } from "../store/hooks";
import type { ChannelSection } from "../types";
import AppSidebar from "./AppSidebar";
import AppTopbar from "./AppTopbar";
import ServerSelectionEmpty from "./ServerSelectionEmpty";
import ServerTopbar from "./ServerTopbar";
import ServerSidebar from "./ServerSidebar";
import ServerFooter from "./ServerFooter";
import ChannelTopbar from "./ChannelTopbar";
import ChannelChatArea from "./ChannelChatArea";
import CollapsibleContextMenu from "./CollapsibleContextMenu";

export default function MainLayout() {
  const adapter = usePlatformAdapter();
  const sessionStore = useSessionStore();
  const channelStore = useChannelStore();
  const { activeSession, servers, currentServer } = sessionStore();
  const { channels, currentChannel, loadChannels, selectChannel } =
    channelStore();

  // Channel sections state
  const [sections, setSections] = useState<ChannelSection[]>([]);
  const [isLoadingSections, setIsLoadingSections] = useState(true);
  const saveSectionsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Resizable Server column state
  const [serverColumnWidth, setServerColumnWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [isLoadingWidth, setIsLoadingWidth] = useState(true);

  // Layout constraints
  const APP_SIDEBAR_WIDTH = 80;
  const SERVER_MIN_WIDTH = 240;
  const SERVER_MAX_WIDTH = 600;
  const CHANNEL_MIN_WIDTH = 700;

  const saveWidthTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Load server column width when session changes
  useEffect(() => {
    async function loadServerColumnWidth() {
      if (!activeSession) {
        setIsLoadingWidth(false);
        return;
      }

      try {
        setIsLoadingWidth(true);
        const result = await adapter.loadAppUIPreference(
          activeSession.id,
          "server_column_width"
        );

        if (result.success && result.data) {
          const width = parseInt(result.data, 10);
          if (
            !isNaN(width) &&
            width >= SERVER_MIN_WIDTH &&
            width <= SERVER_MAX_WIDTH
          ) {
            setServerColumnWidth(width);
          }
        }
      } catch (error) {
        console.error("Error loading server column width:", error);
      } finally {
        setIsLoadingWidth(false);
      }
    }

    loadServerColumnWidth();
  }, [activeSession, adapter]);

  // Save server column width when it changes
  useEffect(() => {
    if (isLoadingWidth || !activeSession) {
      return;
    }

    if (saveWidthTimeoutRef.current) {
      clearTimeout(saveWidthTimeoutRef.current);
    }

    saveWidthTimeoutRef.current = setTimeout(async () => {
      try {
        await adapter.saveAppUIPreference(
          activeSession.id,
          "server_column_width",
          serverColumnWidth.toString()
        );
      } catch (error) {
        console.error("Error saving server column width:", error);
      }
    }, 500);

    return () => {
      if (saveWidthTimeoutRef.current) {
        clearTimeout(saveWidthTimeoutRef.current);
      }
    };
  }, [serverColumnWidth, activeSession, adapter, isLoadingWidth]);

  // Load channels when server changes
  useEffect(() => {
    if (currentServer) {
      loadChannels(currentServer.id);
    } else {
      selectChannel(null);
    }
  }, [currentServer?.id, loadChannels, selectChannel]);

  // Load sections when server/channels change
  useEffect(() => {
    async function loadSections() {
      if (!currentServer || !activeSession || channels.length === 0) {
        setIsLoadingSections(false);
        return;
      }

      try {
        setIsLoadingSections(true);
        const result = await adapter.loadSections(
          activeSession.id,
          currentServer.id
        );

        if (result.success && result.data && result.data.length > 0) {
          // Sections exist - use them but add any new channels
          const allExistingChannelIds = new Set(
            result.data.flatMap((s) => s.channelIds)
          );
          const newChannelIds = channels
            .filter((c) => !allExistingChannelIds.has(c.id))
            .map((c) => c.id);

          if (newChannelIds.length > 0) {
            // Add new channels to the default section
            const updatedSections = result.data.map((section) =>
              section.isDefault
                ? {
                    ...section,
                    channelIds: [...section.channelIds, ...newChannelIds],
                  }
                : section
            );
            setSections(updatedSections);
          } else {
            setSections(result.data);
          }
        } else {
          // No saved sections - create default
          const defaultSection: ChannelSection = {
            id: "default-channels",
            name: "Channels",
            type: "channels",
            channelIds: channels.map((c) => c.id),
            collapsed: false,
            isDefault: true,
          };
          setSections([defaultSection]);
        }
      } catch (error) {
        console.error("Error loading sections:", error);
        // Fall back to default section
        const defaultSection: ChannelSection = {
          id: "default-channels",
          name: "Channels",
          type: "channels",
          channelIds: channels.map((c) => c.id),
          collapsed: false,
          isDefault: true,
        };
        setSections([defaultSection]);
      } finally {
        setIsLoadingSections(false);
      }
    }

    loadSections();
  }, [currentServer, activeSession, channels, adapter]);

  // Save sections when they change (debounced)
  useEffect(() => {
    if (isLoadingSections || !activeSession || !currentServer) {
      return;
    }

    if (saveSectionsTimeoutRef.current) {
      clearTimeout(saveSectionsTimeoutRef.current);
    }

    saveSectionsTimeoutRef.current = setTimeout(async () => {
      try {
        await adapter.saveSections(
          activeSession.id,
          currentServer.id,
          sections
        );
      } catch (error) {
        console.error("Error saving sections:", error);
      }
    }, 500);

    return () => {
      if (saveSectionsTimeoutRef.current) {
        clearTimeout(saveSectionsTimeoutRef.current);
      }
    };
  }, [sections, activeSession, currentServer, adapter, isLoadingSections]);

  // Auto-select general or first channel when channels load
  useEffect(() => {
    if (channels.length > 0 && !currentChannel) {
      // Try to find "general" channel
      const generalChannel = channels.find(
        (c) => c.name.toLowerCase() === "general"
      );
      const channelToSelect = generalChannel || channels[0];
      selectChannel(channelToSelect);
    }
  }, [channels, currentChannel, selectChannel]);

  // Handle resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX - APP_SIDEBAR_WIDTH;
      const constrainedWidth = Math.max(
        SERVER_MIN_WIDTH,
        Math.min(newWidth, SERVER_MAX_WIDTH)
      );

      setServerColumnWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isResizing]);

  const showEmptyState = !activeSession || servers.length === 0;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-off-white">
      {/* App topbar */}
      <AppTopbar />

      <div className="flex-1 flex overflow-hidden">
        {/* App sidebar - always visible */}
        <AppSidebar />

        {showEmptyState ? (
          <ServerSelectionEmpty />
        ) : currentServer ? (
          <>
            {/* Server column */}
            <div
              data-server-column
              className="flex flex-col h-full overflow-hidden bg-navigation/95 border-r border-border-dark relative"
              style={{
                width: `${serverColumnWidth}px`,
                minWidth: `${SERVER_MIN_WIDTH}px`,
                maxWidth: `${SERVER_MAX_WIDTH}px`,
                flexShrink: 0,
              }}
            >
              {/* Server Header */}
              <ServerTopbar />

              {/* Server Sidebar with Channels */}
              <ServerSidebar sections={sections} setSections={setSections} />

              {/* Server Footer */}
              <ServerFooter />

              {/* Resize Handle */}
              <div
                className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-selected/50 transition-colors z-10 ${
                  isResizing ? "bg-selected" : ""
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsResizing(true);
                }}
                title="Drag to resize"
              />
            </div>

            {/* Main content area */}
            <div
              className="flex-1 flex flex-col"
              style={{ minWidth: `${CHANNEL_MIN_WIDTH}px` }}
            >
              {currentChannel ? (
                <>
                  {/* Channel Header */}
                  <ChannelTopbar />

                  {/* Messages Area & Input */}
                  <ChannelChatArea />
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">💬</div>
                    <h2 className="text-2xl font-semibold text-text-primary mb-2">
                      Welcome to Quorum
                    </h2>
                    <p className="text-text-tertiary">
                      Select a channel to start chatting
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Collapsible Context Menu */}
            <CollapsibleContextMenu />
          </>
        ) : (
          <ServerSelectionEmpty />
        )}
      </div>
    </div>
  );
}
