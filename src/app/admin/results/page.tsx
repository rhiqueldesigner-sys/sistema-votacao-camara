"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Download, FileText, BarChart3, CheckCircle, XCircle, MinusCircle } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface Bill {
  id: string
  title: string
  description: string
  status: string
  votingStart?: string
  votingEnd?: string
  createdAt: string
  author: {
    name: string
  }
  votes: {
    id: string
    option: string
    createdAt: string
    user: {
      name: string
      email: string
    }
  }[]
}

interface VoteStats {
  YES: number
  NO: number
  ABSTENTION: number
  total: number
}

export default function AdminResults() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bills, setBills] = useState<Bill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv")
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/login")
    } else if (session.user.role !== "ADMIN") {
      router.push("/dashboard")
    } else {
      fetchBills()
    }
  }, [session, status, router])

  const fetchBills = async () => {
    try {
      const response = await fetch("/api/bills")
      if (response.ok) {
        const data = await response.json()
        setBills(data)
      }
    } catch (error) {
      toast.error("Erro ao carregar projetos de lei")
    } finally {
      setIsLoading(false)
    }
  }

  const calculateVoteStats = (votes: Bill["votes"]): VoteStats => {
    const stats: VoteStats = {
      YES: 0,
      NO: 0,
      ABSTENTION: 0,
      total: votes.length
    }

    votes.forEach(vote => {
      stats[vote.option as keyof VoteStats]++
    })

    return stats
  }

  const getVotePercentage = (stats: VoteStats, option: keyof VoteStats) => {
    if (stats.total === 0) return 0
    return Math.round((stats[option] / stats.total) * 100)
  }

  const handleExport = async (billId: string) => {
    setIsExporting(true)
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          billId,
          format: exportFormat
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.style.display = "none"
        a.href = url
        a.download = `votacao-${selectedBill?.title.replace(/[^a-zA-Z0-9]/g, "-")}.${exportFormat}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success("Exportação realizada com sucesso!")
      } else {
        toast.error("Erro ao exportar resultados")
      }
    } catch (error) {
      toast.error("Erro ao exportar resultados")
    } finally {
      setIsExporting(false)
    }
  }

  const getVoteIcon = (option: string) => {
    switch (option) {
      case "YES": return <CheckCircle className="h-4 w-4 text-green-600" />
      case "NO": return <XCircle className="h-4 w-4 text-red-600" />
      case "ABSTENTION": return <MinusCircle className="h-4 w-4 text-gray-600" />
      default: return null
    }
  }

  const getVoteText = (option: string) => {
    switch (option) {
      case "YES": return "Sim"
      case "NO": return "Não"
      case "ABSTENTION": return "Abstenção"
      default: return option
    }
  }

  const getVoteColor = (option: string) => {
    switch (option) {
      case "YES": return "text-green-600"
      case "NO": return "text-red-600"
      case "ABSTENTION": return "text-gray-600"
      default: return "text-gray-600"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT": return "bg-gray-100 text-gray-800"
      case "ACTIVE": return "bg-green-100 text-green-800"
      case "COMPLETED": return "bg-blue-100 text-blue-800"
      case "CANCELLED": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const completedBills = bills.filter(bill => bill.status === "COMPLETED")
  const activeBills = bills.filter(bill => bill.status === "ACTIVE")

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

  if (!session || session.user.role !== "ADMIN") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Resultados das Votações
                </h1>
                <p className="text-sm text-gray-600">
                  Visualize e exporte resultados das votações
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Projetos
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bills.length}</div>
              <p className="text-xs text-muted-foreground">
                Cadastrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Votações Ativas
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeBills.length}</div>
              <p className="text-xs text-muted-foreground">
                Em andamento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Votações Concluídas
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedBills.length}</div>
              <p className="text-xs text-muted-foreground">
                Finalizadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Votos
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {bills.reduce((total, bill) => total + bill.votes.length, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Registrados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Bills Table */}
        <Card>
          <CardHeader>
            <CardTitle>Projetos de Lei</CardTitle>
            <CardDescription>
              Selecione um projeto para visualizar detalhes e exportar resultados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2">Carregando projetos...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Votos</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.map((bill) => {
                    const stats = calculateVoteStats(bill.votes)
                    return (
                      <TableRow key={bill.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{bill.title}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {bill.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(bill.status)}>
                            {bill.status === "DRAFT" && "Rascunho"}
                            {bill.status === "ACTIVE" && "Ativo"}
                            {bill.status === "COMPLETED" && "Concluído"}
                            {bill.status === "CANCELLED" && "Cancelado"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center space-x-4">
                              <span className="text-green-600">{stats.YES} Sim</span>
                              <span className="text-red-600">{stats.NO} Não</span>
                              <span className="text-gray-600">{stats.ABSTENTION} Abstenção</span>
                            </div>
                            <div className="text-gray-500">Total: {stats.total}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {bill.votingStart && bill.votingEnd ? (
                            <div className="text-sm">
                              <div>{new Date(bill.votingStart).toLocaleDateString("pt-BR")}</div>
                              <div className="text-gray-500">até {new Date(bill.votingEnd).toLocaleDateString("pt-BR")}</div>
                            </div>
                          ) : (
                            <span className="text-gray-500">Não definido</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedBill(bill)}
                          >
                            Ver Resultados
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
            
            {!isLoading && bills.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum projeto de lei encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Modal */}
        {selectedBill && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{selectedBill.title}</h2>
                    <p className="text-gray-600 mb-4">{selectedBill.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Autor: {selectedBill.author.name}</span>
                      <Badge className={getStatusColor(selectedBill.status)}>
                        {selectedBill.status === "DRAFT" && "Rascunho"}
                        {selectedBill.status === "ACTIVE" && "Ativo"}
                        {selectedBill.status === "COMPLETED" && "Concluído"}
                        {selectedBill.status === "CANCELLED" && "Cancelado"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Select value={exportFormat} onValueChange={(value: "csv" | "pdf") => setExportFormat(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => handleExport(selectedBill.id)}
                      disabled={isExporting}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isExporting ? "Exportando..." : "Exportar"}
                    </Button>
                    <button
                      onClick={() => setSelectedBill(null)}
                      className="text-gray-400 hover:text-gray-600 text-xl"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Vote Results */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Resultados</h3>
                    {(() => {
                      const stats = calculateVoteStats(selectedBill.votes)
                      return (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-green-600">Sim</span>
                              <span className="text-sm text-gray-600">
                                {stats.YES} ({getVotePercentage(stats, "YES")}%)
                              </span>
                            </div>
                            <Progress value={getVotePercentage(stats, "YES")} className="h-3" />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-red-600">Não</span>
                              <span className="text-sm text-gray-600">
                                {stats.NO} ({getVotePercentage(stats, "NO")}%)
                              </span>
                            </div>
                            <Progress value={getVotePercentage(stats, "NO")} className="h-3" />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-600">Abstenção</span>
                              <span className="text-sm text-gray-600">
                                {stats.ABSTENTION} ({getVotePercentage(stats, "ABSTENTION")}%)
                              </span>
                            </div>
                            <Progress value={getVotePercentage(stats, "ABSTENTION")} className="h-3" />
                          </div>
                          
                          <div className="pt-4 border-t">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                                <div className="text-sm text-gray-600">Total de Votos</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                  {stats.total > 0 ? Math.round((stats.YES / stats.total) * 100) : 0}%
                                </div>
                                <div className="text-sm text-gray-600">Aprovação</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Vote List */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Votos Registrados ({selectedBill.votes.length})</h3>
                    <div className="max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Vereador</TableHead>
                            <TableHead>Voto</TableHead>
                            <TableHead>Data/Hora</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedBill.votes.map((vote) => (
                            <TableRow key={vote.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{vote.user.name}</div>
                                  <div className="text-sm text-gray-500">{vote.user.email}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  {getVoteIcon(vote.option)}
                                  <span className={getVoteColor(vote.option)}>
                                    {getVoteText(vote.option)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {new Date(vote.createdAt).toLocaleString("pt-BR")}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      
                      {selectedBill.votes.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-gray-500">Nenhum voto registrado</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}