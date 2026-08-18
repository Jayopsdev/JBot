import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  getSessionCookieOptions,
} from "@/lib/constants";

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  role: "ADMIN" | "AGENT";
};

function getSecret() {
  const secret = process.env.SESSION_SECRET ?? "supporthub-demo-session-secret";
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || !payload.email || !payload.name || !payload.role) {
      return null;
    }

    return {
      sub: payload.sub,
      email: String(payload.email),
      name: String(payload.name),
      role: payload.role as SessionPayload["role"],
    } satisfies SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    ...getSessionCookieOptions(),
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
