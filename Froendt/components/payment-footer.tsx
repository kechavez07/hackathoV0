import { Shield, Lock, Globe, CheckCircle } from "lucide-react"

export function PaymentFooter() {
  return (
    <footer className="border-t border-gray-700 p-6" style={{ backgroundColor: "#051824" }}>
      <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-[#27e9b5]" />
          <span>Secure</span>
        </div>
        <div className="flex items-center space-x-2">
          <Lock className="w-4 h-4 text-[#27e9b5]" />
          <span>PCI DSS</span>
        </div>
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-[#27e9b5]" />
          <span>3DS</span>
        </div>
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4 text-[#27e9b5]" />
          <span>On-chain proof</span>
        </div>
      </div>
    </footer>
  )
}
