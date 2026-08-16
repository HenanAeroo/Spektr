import { jwtDecode } from "jwt-decode";
import { JwtPayload } from "../types";

/**
 * The access token is kept only in module memory — never localStorage/cookies —
 * so it can't be read by XSS or persisted across a hard refresh (it is restored
 * on mount via the refresh flow).
 */
let accessToken: string | null = null;

/**
 * Returns the current in-memory access token.
 *
 * @returns The JWT access token, or `null` if not authenticated.
 */
export function getToken() {
  return accessToken;
}

/**
 * Stores the access token in memory.
 *
 * @param token - The JWT access token to keep for subsequent requests.
 */
export function setToken(token: string) {
  accessToken = token;
}

/**
 * Clears the in-memory access token (used on logout).
 */
export function removeToken() {
  accessToken = null;
}

/**
 * Reports whether the current token is missing or (nearly) expired. A 30-second
 * safety margin is applied so a token about to expire is treated as expired,
 * avoiding races on the boundary.
 *
 * @returns `true` when there is no token or it expires within 30 seconds.
 */
export function isTokenExpired(): boolean {
  const token = getToken();
  if (!token) return true;
  try {
    const { exp } = jwtDecode<JwtPayload>(token);
    if (!exp) return false;
    // Consider expired 30s before actual expiry to avoid race conditions
    return Date.now() / 1000 >= exp - 30;
  } catch {
    return true;
  }
}

/**
 * Decodes the current access token into its JWT payload (user id, role, …).
 *
 * @returns The decoded {@link JwtPayload}, or `null` if not authenticated.
 */
export function getUser() {
  const token = getToken();

  if (!token) {
    return null;
  } else {
    const result = jwtDecode<JwtPayload>(token);
    return result;
  }
}
