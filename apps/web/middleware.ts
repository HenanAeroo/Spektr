import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export const config = {
  matcher: ["/login", "/oauth/:path*"],
};

export function proxy(request: NextRequest) {
  const token = request.cookies.get("refreshToken")?.value;

  if (token && request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }
}

export default proxy;
