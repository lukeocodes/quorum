/**
 * ServerFooter - Footer component for the server column
 * Matches the initial height of ChannelTextEntry (MessageInput area)
 * Height structure: border-t (1px) + p-3 (24px) + content height (40px) = ~65px
 */
export default function ServerFooter() {
  return (
    <div className="bg-navigation/95 text-text-inverse border-t border-border-dark">
      <div className="p-3">
        <div className="h-10 flex items-center text-xs text-text-inverse-muted">
          <p>Version 0.1.0</p>
        </div>
      </div>
    </div>
  )
}

