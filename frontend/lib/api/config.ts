/**
 * Central API configuration.
 *
 * The rest of the app should never care whether data is coming from mocks
 * or a real FastAPI backend. Every feature hook goes through `lib/api/*`
 * repositories, which check USE_MOCK_API and either resolve a local mock
 * payload or hit the real HTTP client. When the backend is ready, flip the
 * env var (or the default below) and nothing in `components/` or `app/`
 * needs to change.
 */
export const USE_MOCK_API =
  process.env.NEXT_PUBLIC_USE_MOCK_API !== "false"; // mock by default until backend exists

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

/** Artificial latency so mock-driven UI still exercises loading states. */
export const MOCK_LATENCY_MS = 450;

export function mockDelay<T>(value: T, ms: number = MOCK_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
