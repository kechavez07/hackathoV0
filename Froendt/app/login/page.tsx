"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Lock, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get("next") || "/"
  const { toast } = useToast()

  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: "", password: "" })

  const onChange = (k: "email" | "password") => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((s) => ({ ...s, [k]: e.target.value }))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const { message } = await res.json().catch(() => ({ message: "Invalid credentials" }))
        throw new Error(message || "Invalid credentials")
      }
      router.replace(next)
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Login failed", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#162936" }}>
      <div className="max-w-[980px] mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Image src="/placeholder-logo.svg" alt="PayGate" width={28} height={28} />
          <span className="text-xl font-semibold text-white">PayGate Omni</span>
        </div>

        <Card className="border-gray-700 mx-auto max-w-md" style={{ backgroundColor: "#051824" }}>
          <CardHeader>
            <CardTitle className="text-white">Sign in</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={onChange("email")}
                    className="pl-10 bg-gray-800 border-gray-600 text-white"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={onChange("password")}
                    className="pl-10 pr-10 bg-gray-800 border-gray-600 text-white"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    className="absolute right-3 top-2.5"
                    aria-label={showPwd ? "Hide password" : "Show password"}
                  >
                    {showPwd ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#27e9b5] hover:bg-[#20c49a] text-black font-medium"
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>

              <p className="text-xs text-gray-400 text-center">
                By continuing you agree to our Terms and Privacy.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
