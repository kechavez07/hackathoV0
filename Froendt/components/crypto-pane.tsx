"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Link as LinkIcon, Coins, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CryptoPaneProps {
  state: any
  updateState: (path: string, value: any) => void
}

export function CryptoPane({ state, updateState }: CryptoPaneProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [walletLoading, setWalletLoading] = useState(false)
  const [payLoading, setPayLoading] = useState(false)

  // --- Helpers
  const amountHuman = Number(state?.amount ?? 0)
  const isFormValid =
    Boolean(state?.web3?.connected) &&
    Boolean(state?.web3?.sellerId) &&
    Number.isFinite(amountHuman) &&
    amountHuman > 0

  // --- Connect wallet (consulta tu backend vía /api/me/wallet)
  const connectWallet = async () => {
    try {
      setWalletLoading(true)
      const res = await fetch("/api/me/wallet", { method: "GET" })
      const data = await res.json().catch(() => ({} as any))

      if (!res.ok) {
        throw new Error(data?.message || "Cannot fetch wallet info")
      }

      // intentamos varias formas comunes del shape
      const lisk =
        data?.data?.wallet?.liskAddress ||
        data?.data?.liskAddress ||
        data?.wallet?.liskAddress ||
        data?.liskAddress

      if (!lisk) {
        updateState("web3.connected", false)
        updateState("web3.liskAddress", "")
        toast({
          title: "Wallet not set",
          description: "No Lisk address found in your profile. Go to Profile to add one.",
          variant: "destructive",
        })
        return
      }

      updateState("web3.connected", true)
      updateState("web3.liskAddress", lisk)
      toast({ title: "Wallet connected", description: `Address: ${lisk}`, variant: "default" })
    } catch (e: any) {
      toast({ title: "Connection error", description: e?.message ?? "Unexpected error", variant: "destructive" })
    } finally {
      setWalletLoading(false)
    }
  }

  // --- Pay (crea escrow y redirige a voucher)
  const payWithCrypto = async () => {
    try {
      setPayLoading(true)
      if (!isFormValid) throw new Error("Complete the form first")

      const payload = {
        sellerId: String(state.web3.sellerId),
        amount: String(amountHuman), // en unidades humanas; el API route /api/escrow lo convierte a base units
        description: state?.order?.description ?? "Payment via TrustPay",
        terms: state?.order?.terms ?? "Buyer will release after delivery confirmation.",
        autoReleaseHours: 72,
      }

      const res = await fetch("/api/escrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({} as any))

      if (!res.ok || !data?.data?.escrow?.escrowId) {
        throw new Error(data?.message || "Failed to create escrow")
      }

      const escrowId = data.data.escrow.escrowId as string
      router.push(`/voucher?escrowId=${encodeURIComponent(escrowId)}&amount=${encodeURIComponent(amountHuman)}`)
    } catch (e: any) {
      toast({ title: "Payment error", description: e?.message ?? "Unexpected error", variant: "destructive" })
    } finally {
      setPayLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Alert className="border-blue-500 bg-blue-500/10">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-blue-200">
          Lisk escrow payment. Connect your wallet and enter the seller ID to proceed.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {/* Network fijo */}
        <div>
          <Label htmlFor="network" className="text-gray-300">Network</Label>
          <Input id="network" value="Lisk" readOnly className="bg-gray-800 border-gray-600 text-gray-300" />
        </div>

        {/* Asset fijo */}
        <div>
          <Label htmlFor="asset" className="text-gray-300">Asset</Label>
          <Input id="asset" value="LSK" readOnly className="bg-gray-800 border-gray-600 text-gray-300" />
        </div>

        {/* Seller ID (reemplaza Merchant address) */}
        <div>
          <Label htmlFor="sellerId" className="text-gray-300">Seller ID</Label>
          <Input
            id="sellerId"
            placeholder="SELLER_USER_ID_HERE"
            value={state?.web3?.sellerId ?? ""}
            onChange={(e) => updateState("web3.sellerId", e.target.value)}
            className="bg-gray-800 border-gray-600 text-white"
          />
        </div>

        {/* Wallet (solo visual) */}
        <div>
          <Label htmlFor="wallet" className="text-gray-300">Wallet</Label>
          <Input
            id="wallet"
            value={state?.web3?.liskAddress ? state.web3.liskAddress : "Not connected"}
            readOnly
            className="bg-gray-800 border-gray-600 text-gray-400"
          />
        </div>
      </div>

      <div className="space-y-4">
        <Button
          onClick={connectWallet}
          disabled={Boolean(state?.web3?.connected) || walletLoading}
          variant="outline"
          className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent"
        >
          <LinkIcon className="w-4 h-4 mr-2" />
          {walletLoading ? "Connecting..." : state?.web3?.connected ? "Wallet Connected" : "Connect Wallet"}
        </Button>

        <Button
          onClick={payWithCrypto}
          disabled={!isFormValid || payLoading}
          className="w-full bg-[#27e9b5] hover:bg-[#20c49a] text-black font-medium"
        >
          <Coins className="w-4 h-4 mr-2" />
          {payLoading ? "Processing..." : "Pay with Crypto"}
        </Button>

        {/* Hint de validación */}
        {!isFormValid && (
          <p className="text-xs text-gray-400">
            You must connect your wallet, enter a valid Seller ID, and set an amount &gt; 0.
          </p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="signDelivery"
          checked={state?.web3?.signDelivery}
          onCheckedChange={(checked) => updateState("web3.signDelivery", checked)}
        />
        <Label htmlFor="signDelivery" className="text-sm text-gray-300">
          Sign on-chain proof of delivery after courier confirms
        </Label>
      </div>
    </div>
  )
}
