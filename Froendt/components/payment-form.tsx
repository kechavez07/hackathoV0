"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CryptoPane } from "@/components/crypto-pane"
import { Wallet } from "lucide-react"

interface PaymentFormProps {
  state: any
  updateState: (path: string, value: any) => void
}

export function PaymentForm({ state, updateState }: PaymentFormProps) {
  return (
    <Card className="border-gray-700" style={{ backgroundColor: "#051824" }}>
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Crypto Payment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CryptoPane state={state} updateState={updateState} />
      </CardContent>
    </Card>
  )
}
