import Cookies from 'js-cookie';

// Cookie configuration
const COOKIE_CONFIG = {
  TOKEN_KEY: 'raworc_auth_token',
  EXPIRES_KEY: 'raworc_token_expires',
  // Security options
  secure: process.env.NODE_ENV === 'production', // Only HTTPS in production
  sameSite: 'strict' as const,
  expires: 7, // 7 days default
};

/**
 * Token Management with Secure Cookies
 * Why: Secure storage prevents XSS attacks and provides automatic cleanup
 */
export class TokenManager {
  /**
   * Store JWT token securely in cookies
   * @param token - JWT token from API
   * @param expiresAt - ISO string of expiration date
   */
  static setToken(token: string, expiresAt: string): void {
    const expirationDate = new Date(expiresAt);
    
    // Store token with security options
    Cookies.set(COOKIE_CONFIG.TOKEN_KEY, token, {
      expires: expirationDate,
      secure: COOKIE_CONFIG.secure,
      sameSite: COOKIE_CONFIG.sameSite,
      // httpOnly: true, // Note: Cannot set httpOnly from client-side
    });
    
    // Store expiration separately for client-side checks
    Cookies.set(COOKIE_CONFIG.EXPIRES_KEY, expiresAt, {
      expires: expirationDate,
      secure: COOKIE_CONFIG.secure,
      sameSite: COOKIE_CONFIG.sameSite,
    });
  }

  /**
   * Retrieve stored token
   * @returns token string or null if not found/expired
   */
  static getToken(): string | null {
    const token = Cookies.get(COOKIE_CONFIG.TOKEN_KEY);
    const expiresAt = Cookies.get(COOKIE_CONFIG.EXPIRES_KEY);
    
    if (!token || !expiresAt) {
      return null;
    }
    
    // Check if token is expired
    if (new Date(expiresAt) <= new Date()) {
      this.clearToken();
      return null;
    }
    
    return token;
  }

  /**
   * Check if user has valid token
   */
  static isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Get token expiration date
   */
  static getTokenExpiration(): Date | null {
    const expiresAt = Cookies.get(COOKIE_CONFIG.EXPIRES_KEY);
    return expiresAt ? new Date(expiresAt) : null;
  }

  /**
   * Check if token will expire soon (within 5 minutes)
   */
  static isTokenExpiringSoon(): boolean {
    const expiration = this.getTokenExpiration();
    if (!expiration) return false;
    
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    return expiration <= fiveMinutesFromNow;
  }

  /**
   * Clear all authentication data
   */
  static clearToken(): void {
    Cookies.remove(COOKIE_CONFIG.TOKEN_KEY);
    Cookies.remove(COOKIE_CONFIG.EXPIRES_KEY);
  }

  /**
   * Get formatted Authorization header value
   */
  static getAuthHeader(): string | null {
    const token = this.getToken();
    return token ? `Bearer ${token}` : null;
  }
}
