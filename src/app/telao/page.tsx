"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  CheckCircle, 
  XCircle, 
  MinusCircle, 
  Download, 
  Monitor, 
  Maximize,
  Users,
  FileText,
  Calendar,
  Clock
} from "lucide-react"
import { toast } from "sonner"
import { Navigation } from "@/components/navigation"
import { io } from "socket.io-client"

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
  _count?: {
    votes: number
  }
}

interface Vote {
  id: string
  option: string
  createdAt: string
  user: {
    name: string
    email: string
  }
}

interface VoteStats {
  YES: number
  NO: number
  ABSTENTION: number
  total: number
}

export default function TelaoPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bills, setBills] = useState<Bill[]>([])
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [votes, setVotes] = useState<Vote[]>([])
  const [voteStats, setVoteStats] = useState<VoteStats>({ YES: 0, NO: 0, ABSTENTION: 0, total: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [socket, setSocket] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/login")
    } else {
      fetchBills()
      // Initialize Socket.io
      const socketInstance = io({
        path: '/api/socketio',
      })

      setSocket(socketInstance)

      socketInstance.on('connect', () => {
        setIsConnected(true)
        console.log('Connected to WebSocket')
      })

      socketInstance.on('disconnect', () => {
        setIsConnected(false)
        console.log('Disconnected from WebSocket')
      })

      // Listen for vote updates
      socketInstance.on('vote-update', (data: any) => {
        if (selectedBill && data.billId === selectedBill.id) {
          // Refresh votes when a new vote is cast
          fetchVotes(selectedBill.id)
          toast.success('Novo voto registrado!')
        }
      })

      // Listen for bill status updates
      socketInstance.on('bill-status-update', (data: any) => {
        if (selectedBill && data.billId === selectedBill.id) {
          // Refresh bills to get updated status
          fetchBills()
          toast.info('Status do projeto atualizado!')
        }
      })

      return () => {
        socketInstance.disconnect()
      }
    }
  }, [session, status, router])

  useEffect(() => {
    if (selectedBill && socket) {
      // Join the bill room for real-time updates
      socket.emit('join-bill', selectedBill.id)
      fetchVotes(selectedBill.id)
    }

    return () => {
      if (selectedBill && socket) {
        socket.emit('leave-bill', selectedBill.id)
      }
    }
  }, [selectedBill, socket])

  const fetchBills = async () => {
    try {
      const response = await fetch("/api/telao/bills")
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

  const fetchVotes = async (billId: string) => {
    try {
      const response = await fetch(`/api/telao/bills/${billId}/votes`)
      if (response.ok) {
        const data = await response.json()
        setVotes(data.votes)
        setVoteStats(data.stats)
      }
    } catch (error) {
      toast.error("Erro ao carregar votos")
    }
  }

  const exportToCSV = () => {
    if (!selectedBill || votes.length === 0) return

    const headers = ["Nome do Vereador", "Voto", "Data", "Hora"]
    const csvContent = [
      headers.join(","),
      ...votes.map(vote => [
        vote.user.name,
        getVoteText(vote.option),
        new Date(vote.createdAt).toLocaleDateString("pt-BR"),
        new Date(vote.createdAt).toLocaleTimeString("pt-BR")
      ].join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `votacao_${selectedBill.title.replace(/[^a-zA-Z0-9]/g, "_")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success("CSV exportado com sucesso!")
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
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

  const getVoteIcon = (option: string) => {
    switch (option) {
      case "YES": return <CheckCircle className="h-5 w-5 text-green-600" />
      case "NO": return <XCircle className="h-5 w-5 text-red-600" />
      case "ABSTENTION": return <MinusCircle className="h-5 w-5 text-gray-600" />
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

  const getStatusText = (status: string) => {
    switch (status) {
      case "DRAFT": return "Rascunho"
      case "ACTIVE": return "Ativo"
      case "COMPLETED": return "Concluído"
      case "CANCELLED": return "Cancelado"
      default: return status
    }
  }

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

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation title="Telão de Votação" showTelao={false} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Connection Status */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Conectado em tempo real' : 'Desconectado'}
            </span>
          </div>
        </div>
        {!isFullscreen && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Projetos Disponíveis
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bills.length}</div>
                <p className="text-xs text-muted-foreground">
                  Total de projetos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Votos Registrados
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{voteStats.total}</div>
                <p className="text-xs text-muted-foreground">
                  No projeto selecionado
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Status do Projeto
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                  {selectedBill ? (
                    <Badge className={getStatusColor(selectedBill.status)}>
                      {getStatusText(selectedBill.status)}
                    </Badge>
                  ) : (
                    <span className="text-gray-500">Nenhum</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {!isFullscreen && (
            <Card className="xl:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Selecionar Projeto
                </CardTitle>
                <CardDescription>
                  Escolha um projeto de lei para exibir os resultados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select onValueChange={(value) => {
                  const bill = bills.find(b => b.id === value)
                  setSelectedBill(bill || null)
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    {bills.map((bill) => (
                      <SelectItem key={bill.id} value={bill.id}>
                        {bill.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedBill && (
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-medium">{selectedBill.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedBill.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(selectedBill.status)}>
                        {getStatusText(selectedBill.status)}
                      </Badge>
                    </div>

                    {selectedBill.votingStart && selectedBill.votingEnd && (
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Período: {new Date(selectedBill.votingStart).toLocaleDateString("pt-BR")} até {new Date(selectedBill.votingEnd).toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Button 
                        onClick={toggleFullscreen}
                        className="flex-1"
                        variant="outline"
                      >
                        <Maximize className="h-4 w-4 mr-2" />
                        Tela Cheia
                      </Button>
                      
                      <Button 
                        onClick={exportToCSV}
                        className="flex-1"
                        disabled={votes.length === 0}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exportar CSV
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className={isFullscreen ? "xl:col-span-3" : "xl:col-span-2"}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Monitor className="h-5 w-5 mr-2" />
                    Resultados da Votação
                  </CardTitle>
                  <CardDescription>
                    {selectedBill ? selectedBill.title : "Selecione um projeto para ver os resultados"}
                  </CardDescription>
                </div>
                {isFullscreen && (
                  <Button onClick={toggleFullscreen} variant="outline">
                    Sair da Tela Cheia
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedBill ? (
                <div className="space-y-6">
                  {/* Estatísticas de Votação */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-600">{voteStats.YES}</div>
                      <div className="text-sm text-gray-600">Sim</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-3xl font-bold text-red-600">{voteStats.NO}</div>
                      <div className="text-sm text-gray-600">Não</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-3xl font-bold text-gray-600">{voteStats.ABSTENTION}</div>
                      <div className="text-sm text-gray-600">Abstenção</div>
                    </div>
                  </div>

                  {/* Tabela de Votos */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Votos Individuais</h3>
                    {votes.length > 0 ? (
                      <div className="max-h-96 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Vereador</TableHead>
                              <TableHead>Voto</TableHead>
                              <TableHead>Data</TableHead>
                              <TableHead>Hora</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {votes.map((vote) => (
                              <TableRow key={vote.id}>
                                <TableCell className="font-medium">
                                  {vote.user.name}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    {getVoteIcon(vote.option)}
                                    <span>{getVoteText(vote.option)}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {new Date(vote.createdAt).toLocaleDateString("pt-BR")}
                                </TableCell>
                                <TableCell>
                                  {new Date(vote.createdAt).toLocaleTimeString("pt-BR")}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">Nenhum voto registrado para este projeto</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Selecione um projeto de lei para exibir os resultados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}