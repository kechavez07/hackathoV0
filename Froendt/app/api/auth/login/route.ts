import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(req: Request) {
  const { email, password } = await req.json()

  const validEmail = process.env.AUTH_EMAIL ?? "admin@example.com"
  const validPassword = process.env.AUTH_PASSWORD ?? "admin123"

  if (email !== validEmail || password !== validPassword) {
    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
  }

  const token = crypto.randomUUID()
  const cookieStore = await cookies()
  cookieStore.set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  return NextResponse.json({ ok: true })
}
