"use client"

import { useState } from "react"
import { PaymentHeader } from "@/components/payment-header"
import { PaymentForm } from "@/components/payment-form"
import { PaymentFooter } from "@/components/payment-footer"

export default function PaymentPage() {
  const [state, setState] = useState({
    amount: 123.45,
    currency: "USD",
    web3: {
      connected: false,
      chain: "Ethereum",
      token: "USDC",
      address: "",
      txHash: "",
      signDelivery: true,
    },
    loading: {
      wallet: false,
      crypto: false,
    },
  })

  const updateState = (path: string, value: any) => {
    setState((prev) => {
      const keys = path.split(".")
      const newState = { ...prev } as any
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

        <div className="p-6">
          <div className="max-w-md mx-auto">
            <PaymentForm state={state} updateState={updateState} />
          </div>
        </div>

        <PaymentFooter />
      </div>
    </div>
  )
}
