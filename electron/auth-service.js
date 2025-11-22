const crypto = require("crypto");
const { getPool } = require("./database");

/**
 * Hash password using scrypt
 */
function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt + ":" + derivedKey.toString("hex"));
    });
  });
}

/**
 * Verify password against hash
 */
function verifyPassword(password, hash) {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(":");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString("hex"));
    });
  });
}

/**
 * Generate a secure session token
 */
function generateSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Sign up a new user
 */
async function signUp(username, email, password, displayName = null) {
  const pool = getPool();

  // Validate inputs
  if (!username || username.length < 3) {
    throw new Error("Username must be at least 3 characters");
  }

  if (!email || !email.includes("@")) {
    throw new Error("Valid email is required");
  }

  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  try {
    // Check if username or email already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE username = $1 OR email = $2",
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error("Username or email already exists");
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate random avatar color
    const colors = [
      "#8b5cf6",
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#ec4899",
      "#14b8a6",
    ];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    // Create user
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, display_name, avatar_color)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, display_name, avatar_color, created_at`,
      [username, email, passwordHash, displayName || username, avatarColor]
    );

    const user = result.rows[0];

    // Create session
    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await pool.query(
      "INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [user.id, token, expiresAt]
    );

    return {
      user,
      token,
    };
  } catch (error) {
    console.error("Sign up error:", error);
    throw error;
  }
}

/**
 * Log in an existing user
 */
async function login(usernameOrEmail, password) {
  const pool = getPool();

  try {
    // Find user by username or email
    const result = await pool.query(
      `SELECT id, username, email, password_hash, display_name, avatar_color, created_at
       FROM users
       WHERE username = $1 OR email = $1`,
      [usernameOrEmail]
    );

    if (result.rows.length === 0) {
      throw new Error("Invalid username/email or password");
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);

    if (!isValid) {
      throw new Error("Invalid username/email or password");
    }

    // Remove password hash from response
    delete user.password_hash;

    // Create session
    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await pool.query(
      "INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [user.id, token, expiresAt]
    );

    return {
      user,
      token,
    };
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

/**
 * Validate a session token and return the user
 */
async function validateSession(token) {
  const pool = getPool();

  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.display_name, u.avatar_color, u.created_at
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token = $1 AND s.expires_at > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error("Session validation error:", error);
    return null;
  }
}

/**
 * Log out a user by deleting their session
 */
async function logout(token) {
  const pool = getPool();

  try {
    await pool.query("DELETE FROM sessions WHERE token = $1", [token]);
    return true;
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
}

/**
 * Clean up expired sessions
 */
async function cleanupExpiredSessions() {
  const pool = getPool();

  try {
    await pool.query("DELETE FROM sessions WHERE expires_at < NOW()");
  } catch (error) {
    console.error("Session cleanup error:", error);
  }
}

module.exports = {
  signUp,
  login,
  validateSession,
  logout,
  cleanupExpiredSessions,
};
