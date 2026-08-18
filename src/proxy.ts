import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  findDemoAgent,
  getSessionCookieOptions,
} from "@/lib/constants";
import { verifySessionToken } from "@/lib/session";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/chat",
  "/tickets",
  "/customers",
  "/settings",
];

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function hasUsableSession(token: string | undefined) {
  return token ? verifySessionToken(token) : Promise.resolve(null);
}

function clearSession(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const loggingOut = request.nextUrl.searchParams.get("loggedOut") === "1";
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await hasUsableSession(token);
  const agent = session ? findDemoAgent(session) : null;

  if (loggingOut) {
    if (pathname !== "/login") {
      return clearSession(
        NextResponse.redirect(new URL("/login?loggedOut=1", request.url)),
      );
    }
    return clearSession(NextResponse.next());
  }

  if (token && session && !agent) {
    const loginUrl = new URL("/login", request.url);
    return clearSession(NextResponse.redirect(loginUrl));
  }

  if (isProtectedPath(pathname) && !agent) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return clearSession(NextResponse.redirect(loginUrl));
  }

  if (pathname === "/login" && agent) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname === "/" && agent) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname === "/" && !agent) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard",
    "/dashboard/:path*",
    "/chat",
    "/chat/:path*",
    "/tickets",
    "/tickets/:path*",
    "/customers",
    "/customers/:path*",
    "/settings",
    "/settings/:path*",
  ],
};
