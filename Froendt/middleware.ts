import { NextRequest, NextResponse } from "next/server"

export function middleware(req: NextRequest) {
  // Remove dashboard protection since we don't have a dashboard
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
