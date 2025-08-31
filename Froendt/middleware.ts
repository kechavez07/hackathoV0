import { NextRequest, NextResponse } from "next/server"

export function middleware(req: NextRequest) {
  const isProtected = req.nextUrl.pathname.startsWith("/dashboard")
  if (!isProtected) return NextResponse.next()

  const session = req.cookies.get("auth_token")?.value
  if (!session) {
    const url = new URL("/login", req.url)
    url.searchParams.set("next", req.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
