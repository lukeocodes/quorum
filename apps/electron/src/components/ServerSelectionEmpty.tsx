import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@quorum/components'

const { electronAPI } = window

export default function ServerSelection() {
  const handleAddServer = async () => {
    try {
      await electronAPI.openAddServerFlow()
    } catch (error) {
      console.error('Error opening add server flow:', error)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="text-center max-w-md px-8">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-6 bg-selected rounded-3xl flex items-center justify-center">
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-text-primary mb-3">
            Welcome to Quorum
          </h1>
          <p className="text-lg text-text-secondary mb-8">
            Connect to your servers to start collaborating.
          </p>
        </div>

        <Button
          variant="unstyled"
          onClick={handleAddServer}
          className="inline-flex items-center px-8 py-4 bg-selected hover:bg-selected/90 text-text-inverse text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-3" />
          Add Server
        </Button>
      </div>
    </div>
  )
}

