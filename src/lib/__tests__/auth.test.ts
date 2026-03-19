// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { jwtVerify } from "jose";
import { webcrypto } from "crypto";

// Node 18 doesn't expose crypto as a global — jose's webapi build needs it
Object.defineProperty(globalThis, "crypto", { value: webcrypto });

// Mock server-only so it doesn't throw in the test environment
vi.mock("server-only", () => ({}));

// Capture cookie store calls
const mockSet = vi.fn();
const mockCookieStore = { set: mockSet };
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

// Import after mocks are in place
const { createSession } = await import("@/lib/auth");

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

describe("createSession", () => {
  beforeEach(() => {
    mockSet.mockClear();
  });

  it("sets a cookie named 'auth-token'", async () => {
    await createSession("user-1", "user@example.com");
    expect(mockSet).toHaveBeenCalledOnce();
    expect(mockSet.mock.calls[0][0]).toBe("auth-token");
  });

  it("issues a valid JWT containing userId and email", async () => {
    await createSession("user-42", "test@example.com");
    const token: string = mockSet.mock.calls[0][1];
    const { payload } = await jwtVerify(token, JWT_SECRET);
    expect(payload.userId).toBe("user-42");
    expect(payload.email).toBe("test@example.com");
  });

  it("sets the cookie to expire in ~7 days", async () => {
    const before = Date.now();
    await createSession("user-1", "user@example.com");
    const after = Date.now();

    const options = mockSet.mock.calls[0][2];
    const expires: Date = options.expires;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    expect(expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
    expect(expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
  });

  it("sets httpOnly and sameSite on the cookie", async () => {
    await createSession("user-1", "user@example.com");
    const options = mockSet.mock.calls[0][2];
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
  });

  it("JWT expiry matches the cookie expiry", async () => {
    await createSession("user-1", "user@example.com");
    const token: string = mockSet.mock.calls[0][1];
    const options = mockSet.mock.calls[0][2];

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const jwtExpMs = (payload.exp as number) * 1000;
    const cookieExpMs = (options.expires as Date).getTime();

    // Allow a 5-second window for test execution
    expect(Math.abs(jwtExpMs - cookieExpMs)).toBeLessThan(5000);
  });
});
