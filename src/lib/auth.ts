import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "growsync_role";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

function getSecret(): string {
  const secret = process.env.AUTH_PASSWORD_PARENT;
  if (!secret) throw new Error("AUTH_PASSWORD_PARENT environment variable is not set");
  return secret;
}

function sign(value: string): string {
  const signature = createHmac("sha256", getSecret())
    .update(value)
    .digest("hex");
  return `${value}.${signature}`;
}

function verify(signed: string): string | null {
  const idx = signed.lastIndexOf(".");
  if (idx === -1) return null;
  const value = signed.slice(0, idx);
  const expected = sign(value);
  try {
    const a = Buffer.from(signed);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return null;
    if (timingSafeEqual(a, b)) return value;
  } catch {
    return null;
  }
  return null;
}

export { COOKIE_NAME, COOKIE_MAX_AGE, sign, verify };
