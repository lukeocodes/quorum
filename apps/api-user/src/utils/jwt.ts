import { createHmac } from 'crypto';

interface JWTPayload {
  id: number;
  email: string;
  username: string;
  exp?: number;
}

/**
 * Verify JWT token (simplified version - in production use a proper JWT library)
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    
    // Verify signature
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const data = `${headerB64}.${payloadB64}`;
    const signature = createHmac('sha256', secret)
      .update(data)
      .digest('base64url');

    if (signature !== signatureB64) {
      return null;
    }

    // Decode payload
    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadJson) as JWTPayload;

    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

