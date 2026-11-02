import { NextResponse, type NextRequest } from "next/server";

// The app website is public. Administrative screens and authentication are disabled.
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/auth/:path*"],
};
