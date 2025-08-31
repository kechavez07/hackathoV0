// app/voucher/page.tsx
import QRCode from "qrcode"
import { randomUUID } from "crypto"
import VoucherCard from "@/components/voucher-card"

type Search = Record<string, string | string[] | undefined>

export default async function VoucherPage({ searchParams }: { searchParams: Search }) {
  const amount = (searchParams.amount as string) ?? "0.00"
  const currency = (searchParams.currency as string) ?? "USD"
  const txId = (searchParams.id as string) ?? randomUUID()
  const ts = Date.now()
  const expiresAt = Number(searchParams.expiresAt ?? ts + 15 * 60 * 1000) // +15min

  // Payload que tu wallet/validador puede leer (ajústalo cuando tengas backend real)
  const payload = JSON.stringify({ txId, amount, currency, expiresAt, ts, source: "PayGateOmni" })

  const qrDataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 280,
  })

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#162936" }}>
      <div className="max-w-[980px] mx-auto px-6 py-10">
        <VoucherCard
          amount={amount}
          currency={currency}
          txId={txId}
          qrDataUrl={qrDataUrl}
          expiresAt={expiresAt}
        />
      </div>
    </div>
  )
}
