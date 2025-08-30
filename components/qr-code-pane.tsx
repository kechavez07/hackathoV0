"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Copy, RefreshCw } from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

interface QrCodePaneProps {
  state: any
  updateState: (path: string, value: any) => void
}

export function QrCodePane({ state, updateState }: QrCodePaneProps) {
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const { toast } = useToast()

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      updateState("qr.payload", "")
      toast({
        title: "QR expired, generate a new one",
        variant: "destructive",
      })
    }
  }, [timeLeft, updateState, toast])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const copyPaymentCode = () => {
    navigator.clipboard.writeText(state.qr.payload)
    toast({
      title: "Payment code copied",
      variant: "default",
    })
  }

  const regenerateQR = () => {
    setTimeLeft(300)
    updateState("qr.payload", `pay://qr?amount=${state.amount}&ref=ORDER-1234&t=${Date.now()}`)
    toast({
      title: "QR generated",
      variant: "default",
    })
  }

  return (
    <div className="space-y-6">
      <p className="text-gray-300 text-center">Scan the QR with your banking app</p>

      <div className="flex justify-center">
        <div className="w-56 h-56 bg-white rounded-lg flex items-center justify-center">
          <div className="text-center p-4">
            <div className="w-48 h-48 bg-black rounded grid grid-cols-8 gap-1 p-2">
              {Array.from({ length: 64 }).map((_, i) => (
                <div key={i} className={`w-full h-full ${Math.random() > 0.5 ? "bg-white" : "bg-black"}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        onClick={copyPaymentCode}
        className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent"
      >
        <Copy className="w-4 h-4 mr-2" />
        Copy payment code
      </Button>

      <div className="text-center text-gray-400">Expires in {formatTime(timeLeft)}</div>

      <Separator className="bg-gray-700" />

      <Button variant="secondary" onClick={regenerateQR} className="w-full bg-gray-700 text-gray-300 hover:bg-gray-600">
        <RefreshCw className="w-4 h-4 mr-2" />
        Regenerate QR
      </Button>
    </div>
  )
}
