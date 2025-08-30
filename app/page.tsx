"use client"

import { useState } from "react"
import { PaymentHeader } from "@/components/payment-header"
import { PaymentCardPreview } from "@/components/payment-card-preview"
import { PaymentForm } from "@/components/payment-form"
import { PaymentFooter } from "@/components/payment-footer"

export default function PaymentPage() {
  const [state, setState] = useState({
    ui: { method: "qr" },
    amount: 123.45,
    currency: "USD",
    qr: {
      payload: "pay://qr?amount=123.45&ref=ORDER-1234",
      expiresAt: null,
    },
    card: {
      name: "",
      number: "",
      expMonth: "",
      expYear: "",
      cvv: "",
    },
    web3: {
      connected: false,
      chain: "Ethereum",
      token: "USDC",
      address: "",
      txHash: "",
      signDelivery: true,
    },
    loading: {
      qr: false,
      card: false,
      wallet: false,
      crypto: false,
    },
  })

  const updateState = (path: string, value: any) => {
    setState((prev) => {
      const keys = path.split(".")
      const newState = { ...prev }
      let current = newState

      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] }
        current = current[keys[i]]
      }

      current[keys[keys.length - 1]] = value
      return newState
    })
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#162936" }}>
      <div className="max-w-[980px] mx-auto">
        <PaymentHeader />

        <div className="grid lg:grid-cols-2 gap-8 p-6">
          <div className="order-2 lg:order-1">
            <PaymentCardPreview
              cardholder={state.card.name || "CARDHOLDER NAME"}
              number={state.card.number || "1234 5678 9012 3456"}
              expMonth={state.card.expMonth || "08"}
              expYear={state.card.expYear || "24"}
            />
          </div>

          <div className="order-1 lg:order-2">
            <PaymentForm state={state} updateState={updateState} />
          </div>
        </div>

        <PaymentFooter />
      </div>
    </div>
  )
}
