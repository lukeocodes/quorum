const crypto = require("crypto");

// Encryption settings
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Get encryption key from environment variable
 * If not set, generate a warning and use a default (NOT SECURE FOR PRODUCTION)
 */
function getEncryptionKey() {
  if (!process.env.ENCRYPTION_KEY) {
    console.warn(
      "WARNING: ENCRYPTION_KEY not set in environment. Using insecure default key. " +
        "Set ENCRYPTION_KEY in your .env file for production!"
    );
    // Generate a deterministic key for development (NOT SECURE)
    return crypto.createHash("sha256").update("development-key").digest();
  }

  // Convert hex string to buffer
  return Buffer.from(process.env.ENCRYPTION_KEY, "hex");
}

/**
 * Encrypt a plaintext string (API key)
 * Returns a string in the format: salt:iv:tag:encryptedData (all hex encoded)
 */
function encrypt(plaintext) {
  try {
    const key = getEncryptionKey();

    // Generate random IV and salt
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt
    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Get auth tag
    const tag = cipher.getAuthTag();

    // Return format: salt:iv:tag:encryptedData
    return [
      salt.toString("hex"),
      iv.toString("hex"),
      tag.toString("hex"),
      encrypted,
    ].join(":");
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt an encrypted string
 * Expects format: salt:iv:tag:encryptedData (all hex encoded)
 */
function decrypt(encryptedData) {
  try {
    const key = getEncryptionKey();

    // Split the encrypted data
    const parts = encryptedData.split(":");
    if (parts.length !== 4) {
      throw new Error("Invalid encrypted data format");
    }

    const [saltHex, ivHex, tagHex, encrypted] = parts;

    // Convert hex strings back to buffers
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    // Decrypt
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Generate a secure encryption key (for initial setup)
 * Returns a 32-byte hex string
 */
function generateEncryptionKey() {
  return crypto.randomBytes(KEY_LENGTH).toString("hex");
}

module.exports = {
  encrypt,
  decrypt,
  generateEncryptionKey,
};

