"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, LayoutDashboard, Settings, Monitor } from "lucide-react"
import Link from "next/link"

interface NavigationProps {
  title: string
  showTelao?: boolean
}

export function Navigation({ title, showTelao = false }: NavigationProps) {
  const { data: session } = useSession()
  const router = useRouter()

  const handleLogout = () => {
    router.push("/api/auth/signout")
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {session && (
                <p className="text-sm text-gray-600">
                  Bem-vindo(a), {session.user.name}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {showTelao && session && (
              <Link href="/telao">
                <Button variant="outline">
                  <Monitor className="h-4 w-4 mr-2" />
                  Telão
                </Button>
              </Link>
            )}
            
            {session?.user.role === "ADMIN" && (
              <Link href="/admin">
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              </Link>
            )}
            
            {session?.user.role === "COUNCILOR" && (
              <Link href="/dashboard">
                <Button variant="outline">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Painel
                </Button>
              </Link>
            )}
            
            <Button
              variant="outline"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}