import { useState } from "react";
import { useAppStore } from "../store/appStore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faEnvelope,
  faLock,
  faUserPlus,
  faRightToBracket,
} from "@fortawesome/free-solid-svg-icons";

export const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const setUser = useAppStore((state) => state.setUser);
  const setAuthToken = useAppStore((state) => state.setAuthToken);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const result = await window.electronAPI.login(username, password);
        setUser(result.user);
        setAuthToken(result.token);

        // Store token in localStorage for persistence
        localStorage.setItem("authToken", result.token);
      } else {
        // Sign up
        if (!email || !username || password.length < 8) {
          setError(
            "Please fill all fields. Password must be at least 8 characters."
          );
          setLoading(false);
          return;
        }

        const result = await window.electronAPI.signup(
          username,
          email,
          password,
          displayName || username
        );
        setUser(result.user);
        setAuthToken(result.token);

        // Store token in localStorage for persistence
        localStorage.setItem("authToken", result.token);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
      setLoading(false);
    }
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

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              setIsLogin(true);
              setError("");
            }}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              isLogin
                ? "bg-selected text-text-inverse"
                : "bg-subtle text-text-secondary hover:bg-border"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setError("");
            }}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              !isLogin
                ? "bg-selected text-text-inverse"
                : "bg-subtle text-text-secondary hover:bg-border"
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-border rounded-md text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-selected focus:border-transparent"
                placeholder="you@example.com"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {isLogin ? "Username or Email" : "Username"}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-border rounded-md text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-selected focus:border-transparent"
              placeholder={isLogin ? "username or email" : "username"}
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Display Name (Optional)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-border rounded-md text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-selected focus:border-transparent"
                placeholder="Your name"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-border rounded-md text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-selected focus:border-transparent"
              placeholder={isLogin ? "Password" : "At least 8 characters"}
              required
              minLength={!isLogin ? 8 : undefined}
            />
          </div>

          {error && (
            <div className="bg-notification/20 border border-notification text-text-primary px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-selected hover:bg-selected/90 text-text-inverse font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : isLogin ? "Log In" : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-text-tertiary">
          {isLogin ? (
            <p>
              Don't have an account?{" "}
              <button
                onClick={() => {
                  setIsLogin(false);
                  setError("");
                }}
                className="text-selected hover:text-selected/80"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button
                onClick={() => {
                  setIsLogin(true);
                  setError("");
                }}
                className="text-selected hover:text-selected/80"
              >
                Log in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
