import { jwtDecode } from "jwt-decode";
import { JwtPayload } from "../types";

// Manage the storage of the accessToken in memory
let accessToken: string | null = null;

export function getToken() {
  return accessToken;
}

export function setToken(token: string) {
  accessToken = token;
}

export function removeToken() {
  accessToken = null;
}

export function getUser() {
  const token = getToken();

  if (!token) {
    return null;
  } else {
    const result = jwtDecode<JwtPayload>(token);
    return result;
  }
}
