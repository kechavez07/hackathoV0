interface PaymentCardPreviewProps {
  cardholder: string
  number: string
  expMonth: string
  expYear: string
}

export function PaymentCardPreview({ cardholder, number, expMonth, expYear }: PaymentCardPreviewProps) {
  const formatCardNumber = (num: string) => {
    return num
      .replace(/\s/g, "")
      .replace(/(.{4})/g, "$1 ")
      .trim()
  }

  return (
    <div className="relative">
      <div
        className="w-full h-56 rounded-2xl p-6 text-white relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #27e9b5 0%, #3b5265 100%)",
          borderRadius: "1rem",
        }}
      >
        {/* Card chip */}
        <div className="w-12 h-9 bg-yellow-400 rounded-md mb-8 opacity-80" />

        {/* Card number */}
        <div className="text-xl font-mono tracking-wider mb-6">{formatCardNumber(number)}</div>

        {/* Cardholder and expiry */}
        <div className="flex justify-between items-end">
          <div>
            <div className="text-xs opacity-70 mb-1">CARDHOLDER NAME</div>
            <div className="text-sm font-medium uppercase">{cardholder || "CARDHOLDER NAME"}</div>
          </div>
          <div>
            <div className="text-xs opacity-70 mb-1">EXPIRES</div>
            <div className="text-sm font-medium">
              {expMonth || "08"}/{expYear || "24"}
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-white opacity-10" />
        <div className="absolute bottom-4 right-8 w-8 h-8 rounded-full bg-white opacity-20" />
      </div>
    </div>
  )
}
