"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, CreditCard, ShieldCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CardPaneProps {
  state: any
  updateState: (path: string, value: any) => void
}

export function CardPane({ state, updateState }: CardPaneProps) {
  const { toast } = useToast()

  const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]
  const years = ["2025", "2026", "2027", "2028", "2029", "2030"]

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(" ")
    } else {
      return v
    }
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value)
    updateState("card.number", formatted)
  }

  const handlePayment = () => {
    updateState("loading.card", true)

    // Simulate payment processing
    setTimeout(() => {
      updateState("loading.card", false)
      toast({
        title: "Payment successful!",
        description: "Your payment has been processed.",
        variant: "default",
      })
    }, 2000)
  }

  const isFormValid =
    state.card.name && state.card.number && state.card.expMonth && state.card.expYear && state.card.cvv

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="cardName" className="text-gray-300">
            Cardholder name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="cardName"
              placeholder="Enter cardholder name"
              value={state.card.name}
              onChange={(e) => updateState("card.name", e.target.value)}
              className="pl-10 bg-gray-800 border-gray-600 text-white"
              autoComplete="cc-name"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="cardNumber" className="text-gray-300">
            Card number
          </Label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="cardNumber"
              placeholder="1234 5678 9012 3456"
              value={state.card.number}
              onChange={handleCardNumberChange}
              className="pl-10 bg-gray-800 border-gray-600 text-white"
              autoComplete="cc-number"
              maxLength={19}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">We support Visa, Mastercard, Amex</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="expMonth" className="text-gray-300">
              Exp. month
            </Label>
            <Select value={state.card.expMonth} onValueChange={(value) => updateState("card.expMonth", value)}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="expYear" className="text-gray-300">
              Exp. year
            </Label>
            <Select value={state.card.expYear} onValueChange={(value) => updateState("card.expYear", value)}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="YY" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="cvv" className="text-gray-300">
              CVV
            </Label>
            <Input
              id="cvv"
              type="password"
              placeholder="123"
              value={state.card.cvv}
              onChange={(e) => updateState("card.cvv", e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
              maxLength={4}
              autoComplete="cc-csc"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold text-white">
            Payment amount: ${state.amount} {state.currency}
          </span>
        </div>

        <Button
          onClick={handlePayment}
          disabled={!isFormValid || state.loading.card}
          className="w-full bg-[#27e9b5] hover:bg-[#20c49a] text-black font-medium"
        >
          <ShieldCheck className="w-4 h-4 mr-2" />
          {state.loading.card ? "Processing..." : "Pay"}
        </Button>
      </div>
    </div>
  )
}
