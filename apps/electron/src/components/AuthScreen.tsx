import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRightToBracket,
  faUserPlus,
  faExternalLinkAlt,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "@quorum/components";

const WEB_APP_URL = import.meta.env.VITE_WEB_APP_URL || "http://localhost:4321";

export const AuthScreen = () => {
  const handleLogin = () => {
    // Open login page in system browser
    window.electronAPI.openExternal(`${WEB_APP_URL}/auth/login`);
  };

  const handleSignup = () => {
    // Open signup page in system browser
    window.electronAPI.openExternal(`${WEB_APP_URL}/auth/signup`);
  };

  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-subtle rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2">Quorum</h1>
          <p className="text-text-tertiary">
            AI-powered collaborative discussions
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <Button
            variant="unstyled"
            fullWidth
            onClick={handleLogin}
            className="bg-selected hover:bg-selected/90 text-text-inverse font-medium py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
          >
            <FontAwesomeIcon icon={faRightToBracket} />
            <span>Log In</span>
            <FontAwesomeIcon icon={faExternalLinkAlt} className="text-sm opacity-70" />
          </Button>

          <Button
            variant="unstyled"
            fullWidth
            onClick={handleSignup}
            className="bg-white hover:bg-subtle border border-border text-text-primary font-medium py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
          >
            <FontAwesomeIcon icon={faUserPlus} />
            <span>Sign Up</span>
            <FontAwesomeIcon icon={faExternalLinkAlt} className="text-sm opacity-70" />
          </Button>
        </div>

        <div className="bg-primary-50 border border-primary-200 rounded-md p-4">
          <p className="text-sm text-primary-800 text-center">
            You'll be redirected to your browser to complete authentication.
            After logging in, you'll be automatically redirected back to Quorum.
          </p>
        </div>
      </div>
    </div>
  );
};
