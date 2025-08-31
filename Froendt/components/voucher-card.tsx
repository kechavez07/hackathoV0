// components/voucher-card.tsx
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check, Printer, QrCode } from "lucide-react"

export default function VoucherCard({
  amount,
  currency,
  txId,
  qrDataUrl,
  expiresAt,
}: {
  amount: string
  currency: string
  txId: string
  qrDataUrl: string
  expiresAt: number
}) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000))
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0")
  const ss = String(remaining % 60).padStart(2, "0")

  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(txId)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }
  const onPrint = () => window.print()

  const fmtAmount = (() => {
    const n = Number(amount)
    if (Number.isFinite(n)) return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return amount
  })()

  return (
    <Card className="mx-auto max-w-2xl border-gray-700 shadow-2xl rounded-2xl" style={{ backgroundColor: "#051824" }}>
      <CardHeader className="pt-8 pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="text-white text-xl">Payment voucher</span>
          <span className="text-sm text-gray-400">expira en {mm}:{ss}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="grid md:grid-cols-2 gap-6 items-center">
        <div className="flex items-center justify-center rounded-xl p-4" style={{ backgroundColor: "#0a2432" }}>
          <img src={qrDataUrl} alt="Payment QR" className="w-64 h-64" />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-400">Transaction ID</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-mono">{txId.slice(0, 8)}…{txId.slice(-6)}</span>
              <Button size="sm" onClick={copy} className="bg-[#27e9b5] hover:bg-[#20c49a] text-black">
                {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
            </div>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Amount</span>
            <span className="text-[#27e9b5] font-semibold">{currency} {fmtAmount}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Status</span>
            <span className="text-yellow-300">pending</span>
          </div>

          <p className="text-xs text-gray-400 pt-2">
            Escanea este QR con tu wallet para confirmar el pago. Conserva este comprobante.
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end gap-3 pb-8">
        <Button onClick={onPrint} variant="outline" className="border-gray-600 text-white">
          <Printer className="w-4 h-4 mr-2" /> Imprimir
        </Button>
        <a href={qrDataUrl} download={`voucher-${txId}.png`}>
          <Button className="bg-[#27e9b5] hover:bg-[#20c49a] text-black">
            <QrCode className="w-4 h-4 mr-2" /> Descargar QR
          </Button>
        </a>
      </CardFooter>
    </Card>
  )
}
