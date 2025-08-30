"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QrCodePane } from "@/components/qr-code-pane"
import { CardPane } from "@/components/card-pane"
import { CryptoPane } from "@/components/crypto-pane"
import { QrCode, CreditCard, Wallet } from "lucide-react"

interface PaymentFormProps {
  state: any
  updateState: (path: string, value: any) => void
}

export function PaymentForm({ state, updateState }: PaymentFormProps) {
  return (
    <Card className="border-gray-700" style={{ backgroundColor: "#051824" }}>
      <CardHeader>
        <CardTitle className="text-white">Payment details</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={state.ui.method} onValueChange={(value) => updateState("ui.method", value)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger
              value="qr"
              className="flex items-center gap-2 data-[state=active]:bg-[#27e9b5] data-[state=active]:text-black"
            >
              <QrCode className="w-4 h-4" />
              Pay with QR
            </TabsTrigger>
            <TabsTrigger
              value="card"
              className="flex items-center gap-2 data-[state=active]:bg-[#27e9b5] data-[state=active]:text-black"
            >
              <CreditCard className="w-4 h-4" />
              Credit / Debit Card
            </TabsTrigger>
            <TabsTrigger
              value="crypto"
              className="flex items-center gap-2 data-[state=active]:bg-[#27e9b5] data-[state=active]:text-black"
            >
              <Wallet className="w-4 h-4" />
              Crypto / Web3
            </TabsTrigger>
          </TabsList>

          <TabsContent value="qr" className="mt-6">
            <QrCodePane state={state} updateState={updateState} />
          </TabsContent>

          <TabsContent value="card" className="mt-6">
            <CardPane state={state} updateState={updateState} />
          </TabsContent>

          <TabsContent value="crypto" className="mt-6">
            <CryptoPane state={state} updateState={updateState} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
