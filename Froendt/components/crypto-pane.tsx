"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Link, Coins, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CryptoPaneProps {
  state: any
  updateState: (path: string, value: any) => void
}

export function CryptoPane({ state, updateState }: CryptoPaneProps) {
  const { toast } = useToast()

  const chains = ["Ethereum", "Polygon", "Arbitrum", "BSC", "Solana"]
  const tokens = ["USDC", "USDT", "DAI", "ETH", "MATIC"]

  const connectWallet = () => {
    updateState("loading.wallet", true)

    // Simulate wallet connection
    setTimeout(() => {
      updateState("loading.wallet", false)
      updateState("web3.connected", true)
      updateState("web3.address", "0x1234...abcd")
      toast({
        title: "Wallet connected",
        description: "Your wallet has been successfully connected.",
        variant: "default",
      })
    }, 1500)
  }

  const payWithCrypto = () => {
    updateState("loading.crypto", true)

    // Simulate crypto payment
    setTimeout(() => {
      updateState("loading.crypto", false)
      updateState("web3.txHash", "0xabcd1234...")
      toast({
        title: "Payment successful!",
        description: "Your crypto payment has been processed.",
        variant: "default",
      })
    }, 2000)
  }

  const isFormValid = state.web3.connected && state.web3.chain && state.web3.token

  return (
    <div className="space-y-6">
      <Alert className="border-blue-500 bg-blue-500/10">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-blue-200">
          Connect your wallet to pay with stablecoins or tokens.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div>
          <Label htmlFor="network" className="text-gray-300">
            Network
          </Label>
          <Select value={state.web3.chain} onValueChange={(value) => updateState("web3.chain", value)}>
            <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
              <SelectValue placeholder="Select network" />
            </SelectTrigger>
            <SelectContent>
              {chains.map((chain) => (
                <SelectItem key={chain} value={chain}>
                  {chain}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="asset" className="text-gray-300">
            Asset
          </Label>
          <Select value={state.web3.token} onValueChange={(value) => updateState("web3.token", value)}>
            <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
              <SelectValue placeholder="Select asset" />
            </SelectTrigger>
            <SelectContent>
              {tokens.map((token) => (
                <SelectItem key={token} value={token}>
                  {token}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="merchantAddress" className="text-gray-300">
            Merchant address
          </Label>
          <Input
            id="merchantAddress"
            value="0xMerchantABCDEF..."
            readOnly
            className="bg-gray-800 border-gray-600 text-gray-400"
          />
        </div>
      </div>

      <div className="space-y-4">
        <Button
          onClick={connectWallet}
          disabled={state.web3.connected || state.loading.wallet}
          variant="outline"
          className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent"
        >
          <Link className="w-4 h-4 mr-2" />
          {state.loading.wallet ? "Connecting..." : state.web3.connected ? "Wallet Connected" : "Connect Wallet"}
        </Button>

        <Button
          onClick={payWithCrypto}
          disabled={!isFormValid || state.loading.crypto}
          className="w-full bg-[#27e9b5] hover:bg-[#20c49a] text-black font-medium"
        >
          <Coins className="w-4 h-4 mr-2" />
          {state.loading.crypto ? "Processing..." : "Pay with Crypto"}
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="signDelivery"
          checked={state.web3.signDelivery}
          onCheckedChange={(checked) => updateState("web3.signDelivery", checked)}
        />
        <Label htmlFor="signDelivery" className="text-sm text-gray-300">
          Sign on-chain proof of delivery after courier confirms
        </Label>
      </div>
    </div>
  )
}
