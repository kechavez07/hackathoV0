import { NextResponse } from "next/server"
import { cookies } from "next/headers"

function toBaseUnits(amount: string | number, decimals = 8): string {
  const s = typeof amount === "number" ? amount.toString() : String(amount).trim()
  if (!/^\d+(\.\d+)?$/.test(s)) throw new Error("Invalid amount format")
  const [intPart, fracPart = ""] = s.split(".")
  const pow = BigInt(10 ** decimals)
  const fracPadded = (fracPart + "0".repeat(decimals)).slice(0, decimals)
  const base = BigInt(intPart) * pow + BigInt(fracPadded || "0")
  return base.toString()
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any))
    const {
      sellerId,
      amount,
      description,
      terms,
      autoReleaseHours = 72,
    } = body || {}

    if (!sellerId) {
      return NextResponse.json({ message: "sellerId is required" }, { status: 400 })
    }
    const n = Number(amount)
    if (!Number.isFinite(n) || n <= 0) {
      return NextResponse.json({ message: "amount must be a number > 0" }, { status: 400 })
    }

    // Mock response - simula la creación exitosa de un escrow
    const mockEscrowId = `escrow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return NextResponse.json({
      data: {
        escrow: {
          escrowId: mockEscrowId,
          sellerId: String(sellerId),
          amount: amount,
          description: description ?? "Payment via TrustPay",
          terms: terms ?? "Buyer will release after delivery confirmation.",
          autoReleaseHours,
          status: "pending",
          createdAt: new Date().toISOString()
        }
      }
    })
  } catch (err: any) {
    return NextResponse.json({ message: err?.message || "Unexpected error" }, { status: 500 })
  }
}
