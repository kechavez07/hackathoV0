import { Check } from "lucide-react"
import { Button } from "./ui/button"
import { useRouter } from "next/navigation"

export function PaymentHeader() {
  const steps = ["Main", "Shipping details", "Payment method"]
  const activeStep = "Payment method"
  const router = useRouter()
  return (
    <header className="border-b border-gray-700 p-6" style={{ backgroundColor: "#051824" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <h1 className="text-2xl font-bold text-white">PayGate</h1>
          
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => {
              const isActive = step === activeStep
              const isCompleted = steps.indexOf(activeStep) > index

              return (
                <div key={step} className="flex items-center space-x-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                      isCompleted
                        ? "bg-[#27e9b5] text-black"
                        : isActive
                          ? "bg-[#27e9b5] text-black"
                          : "bg-gray-600 text-gray-300"
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                  </div>
                  <span className={`text-sm ${isActive ? "text-[#27e9b5]" : "text-gray-400"}`}>{step}</span>
                  {index < steps.length - 1 && <div className="w-8 h-px bg-gray-600 ml-2" />}
                </div>
              )
            })}
          </div>
            
          <Button onClick={() => {
            fetch("/api/auth/logout").then(() => {
              router.push("/login")
            }).catch((error) => {
              console.error("Error logging out:", error)
            })
          }}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
