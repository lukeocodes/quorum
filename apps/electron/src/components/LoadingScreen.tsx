export default function LoadingScreen() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 transition-opacity duration-300">
      <div className="text-center">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-6 bg-selected rounded-3xl flex items-center justify-center animate-pulse">
            <svg
              className="w-12 h-12 text-off-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-3">
            Loading Quorum
          </h1>
          <p className="text-text-secondary mb-8">
            Checking for active sessions...
          </p>
        </div>
        
        {/* Spinner */}
        <div className="inline-block">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-selected"></div>
        </div>
      </div>
    </div>
  )
}

