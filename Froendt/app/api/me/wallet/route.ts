// app/api/me/wallet/route.ts
import { NextResponse } from "next/server"

export async function GET() {
  // Mock response - simula que el usuario tiene una wallet Lisk configurada
  return NextResponse.json({
    data: {
      wallet: {
        liskAddress: "lsk1234567890abcdef"
      }
    }
  })
}
