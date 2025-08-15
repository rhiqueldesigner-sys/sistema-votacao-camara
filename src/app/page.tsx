"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    if (session) {
      if (session.user.role === "ADMIN") {
        router.push("/admin")
      } else {
        router.push("/dashboard")
      }
    } else {
      router.push("/login")
    }
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Sistema de Votação
          </CardTitle>
          <CardDescription>
            Câmara de Vereadores de Ubaporanga
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600">Redirecionando...</p>
        </CardContent>
      </Card>
    </div>
  )
}