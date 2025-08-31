"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirigir automáticamente al login al cargar la página
    router.replace("/login")
  }, [router])

  // Mostrar una pantalla de carga mientras redirige
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#162936" }}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#27e9b5] mx-auto mb-4"></div>
        <p className="text-white">Redirecting to login...</p>
      </div>
    </div>
  )
}
