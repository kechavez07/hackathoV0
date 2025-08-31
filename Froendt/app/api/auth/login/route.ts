import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    // Llama a tu backend real usando la variable de entorno
    const res = await fetch(`${process.env.BACKEND_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json().catch(() => ({} as any))

    if (!res.ok || !data?.data?.token) {
      const msg = data?.message || "Invalid credentials"
      return NextResponse.json({ message: msg }, { status: res.status || 401 })
    }

    const token: string = data.data.token

    // Guarda el JWT en cookie httpOnly
    const jar = await cookies()
    jar.set("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 días
    })

    return NextResponse.json({ ok: true, user: data.data.user })
  } catch (err: any) {
    return NextResponse.json({ message: err?.message || "Unexpected error" }, { status: 500 })
  }
}
