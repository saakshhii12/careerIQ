/**
 * Central API configuration.
 * All production clients hit the real Express backend at BACKEND_URL.
 */
export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

export const API_BASE_URL = `${BACKEND_URL}/api`;

export { getToken, setToken, clearToken } from "@/lib/auth/token";
