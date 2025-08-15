"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, MinusCircle, Users, FileText, BarChart3 } from "lucide-react"
import { useSocket } from "@/hooks/useSocket"

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
    }
  }[]
}

interface VoteStats {
  YES: number
  NO: number
  ABSTENTION: number
  total: number
}

export default function PublicResults() {
  const [bills, setBills] = useState<Bill[]>([])
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { joinBill, leaveBill, onVoteUpdate, offVoteUpdate } = useSocket()

  useEffect(() => {
    fetchBills()
    
    // Set up periodic refresh for real-time updates
    const interval = setInterval(fetchBills, 30000) // Refresh every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Set up socket event listeners
    const handleVoteUpdate = (data: any) => {
      console.log("Vote update received:", data)
      fetchBills() // Refresh data when vote is updated
      
      // Update selected bill if it's the one that was updated
      if (selectedBill && selectedBill.id === data.billId) {
        fetchBillDetails(data.billId)
      }
    }

    onVoteUpdate(handleVoteUpdate)

    return () => {
      offVoteUpdate(handleVoteUpdate)
    }
  }, [selectedBill, onVoteUpdate, offVoteUpdate])

  useEffect(() => {
    // Join/leave bill rooms when selected bill changes
    if (selectedBill) {
      joinBill(selectedBill.id)
    }

    return () => {
      if (selectedBill) {
        leaveBill(selectedBill.id)
      }
    }
  }, [selectedBill, joinBill, leaveBill])

  const fetchBills = async () => {
    try {
      const response = await fetch("/api/public/bills")
      if (response.ok) {
        const data = await response.json()
        setBills(data)
      }
    } catch (error) {
      console.error("Error fetching bills:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchBillDetails = async (billId: string) => {
    try {
      const response = await fetch(`/api/public/bills/${billId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedBill(data)
      }
    } catch (error) {
      console.error("Error fetching bill details:", error)
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

  const isVotingActive = (bill: Bill) => {
    if (bill.status !== "ACTIVE") return false
    if (!bill.votingStart || !bill.votingEnd) return false
    
    const now = new Date()
    const start = new Date(bill.votingStart)
    const end = new Date(bill.votingEnd)
    
    return now >= start && now <= end
  }

  const activeBills = bills.filter(bill => isVotingActive(bill))
  const completedBills = bills.filter(bill => bill.status === "COMPLETED")

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Resultados das Votações
              </h1>
              <p className="text-sm text-gray-600">
                Câmara de Vereadores de Ubaporanga
              </p>
              <div className="flex items-center mt-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm text-green-600">Atualizações em tempo real</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Votações em Andamento
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeBills.length}</div>
              <p className="text-xs text-muted-foreground">
                Projetos ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Votações Concluídas
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedBills.length}</div>
              <p className="text-xs text-muted-foreground">
                Total concluído
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Votos
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {bills.reduce((total, bill) => total + bill.votes.length, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Votos registrados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Active Voting Bills */}
        {activeBills.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Votações em Andamento
              </CardTitle>
              <CardDescription>
                Projetos de lei com votação ativa no momento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {activeBills.map((bill) => {
                  const stats = calculateVoteStats(bill.votes)
                  return (
                    <Card key={bill.id} className="border-green-200">
                      <CardHeader>
                        <CardTitle className="text-lg">{bill.title}</CardTitle>
                        <CardDescription>
                          {bill.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Vote Progress */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-green-600">Sim</span>
                              <span className="text-sm text-gray-600">
                                {stats.YES} ({getVotePercentage(stats, "YES")}%)
                              </span>
                            </div>
                            <Progress value={getVotePercentage(stats, "YES")} className="h-2" />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-red-600">Não</span>
                              <span className="text-sm text-gray-600">
                                {stats.NO} ({getVotePercentage(stats, "NO")}%)
                              </span>
                            </div>
                            <Progress value={getVotePercentage(stats, "NO")} className="h-2" />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-600">Abstenção</span>
                              <span className="text-sm text-gray-600">
                                {stats.ABSTENTION} ({getVotePercentage(stats, "ABSTENTION")}%)
                              </span>
                            </div>
                            <Progress value={getVotePercentage(stats, "ABSTENTION")} className="h-2" />
                          </div>
                          
                          <div className="pt-2 border-t">
                            <div className="flex justify-between text-sm">
                              <span>Total de votos:</span>
                              <span className="font-medium">{stats.total}</span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => setSelectedBill(bill)}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            Ver Detalhes
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Bills Table */}
        <Card>
          <CardHeader>
            <CardTitle>Todos os Projetos</CardTitle>
            <CardDescription>
              Lista completa de projetos de lei e seus resultados
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
                          <div className="flex items-center space-x-2">
                            {isVotingActive(bill) && (
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            )}
                            <Badge className={getStatusColor(bill.status)}>
                              {bill.status === "DRAFT" && "Rascunho"}
                              {bill.status === "ACTIVE" && "Ativo"}
                              {bill.status === "COMPLETED" && "Concluído"}
                              {bill.status === "CANCELLED" && "Cancelado"}
                            </Badge>
                          </div>
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
                          <button
                            onClick={() => setSelectedBill(bill)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            Ver Resultados
                          </button>
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

        {/* Vote Details Modal */}
        {selectedBill && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedBill.title}</h2>
                    <p className="text-gray-600 mt-2">{selectedBill.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedBill(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ✕
                  </button>
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
                            <div className="flex justify-between">
                              <span className="font-medium">Total de votos:</span>
                              <span className="font-bold">{stats.total}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Vote List */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Votos Registrados</h3>
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
                              <TableCell>{vote.user.name}</TableCell>
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