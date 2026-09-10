import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/session-token";
import { SESSION_COOKIE } from "@/lib/constants";

const protectedPrefixes = ["/dashboard", "/agents", "/knowledge-base", "/tools", "/calls", "/settings"];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  const isProtected = protectedPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
  if (isProtected && !session) return NextResponse.redirect(new URL("/login", request.url));
  if (isProtected && session?.mustChangePassword && path !== "/settings/profile") return NextResponse.redirect(new URL("/settings/profile", request.url));
  if ((path === "/" || path === "/login") && session) {
    return NextResponse.redirect(new URL(session.mustChangePassword ? "/settings/profile" : "/dashboard", request.url));
  }
  if (path === "/") return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|widget|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|gif)$).*)"],
};
