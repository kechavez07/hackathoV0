// components/voucher-card.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Download, QrCode } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface VoucherCardProps {
  amount: string
  currency: string
  txId: string
  qrDataUrl: string
  expiresAt: number
}

export default function VoucherCard({ amount, currency, txId, qrDataUrl, expiresAt }: VoucherCardProps) {
  const { toast } = useToast()

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Transaction ID copied to clipboard",
      variant: "default",
    })
  }

  const downloadQR = () => {
    const link = document.createElement('a')
    link.href = qrDataUrl
    link.download = `payment-qr-${txId}.png`
    link.click()
  }

  const formatExpiry = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <Card className="border-gray-700 mx-auto max-w-md" style={{ backgroundColor: "#051824" }}>
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          Payment Voucher
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* QR Code */}
        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-lg">
            <img src={qrDataUrl} alt="Payment QR Code" className="w-48 h-48" />
          </div>
        </div>

        {/* Payment Details */}
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">
              {amount} {currency}
            </div>
            <div className="text-sm text-gray-400">Payment Amount</div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-400">Transaction ID</div>
              <div className="flex items-center gap-2">
                <code className="text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded flex-1">
                  {txId}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(txId)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-400">Expires At</div>
              <div className="text-sm text-gray-300">{formatExpiry(expiresAt)}</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={downloadQR}
            variant="outline"
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <Download className="w-4 h-4 mr-2" />
            Download QR Code
          </Button>

          <div className="text-xs text-gray-400 text-center">
            Scan this QR code with your Lisk wallet to complete the payment
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
