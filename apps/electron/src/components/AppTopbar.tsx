import { useAppStore } from '../store/appStore';

export default function AppTopbar() {
  const { currentServer } = useAppStore();

  return (
    <div 
      className="h-10 bg-navigation border-b border-border-dark flex items-center justify-center px-6 w-full"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {currentServer ? (
        <div className="flex items-center space-x-3">
          {/* Server Icon */}
          {/* <div
            className="w-10 h-10 rounded-xl bg-selected flex items-center justify-center text-text-inverse text-lg font-bold"
            title={currentServer.name}
          >
            {currentServer.name.charAt(0).toUpperCase()}
          </div> */}
          
          {/* Server Name */}
          <div>
            <h1 className="text-sm font-light text-text-inverse">
              {currentServer.name}
            </h1>
          </div>
        </div>
      ) : (
        <div>
          <h1 className="text-sm font-light text-text-inverse">
            Quorum
          </h1>
        </div>
      )}
    </div>
  );
}

