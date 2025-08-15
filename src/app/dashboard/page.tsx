"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CheckCircle, Clock, XCircle, MinusCircle, FileText, History } from "lucide-react"
import { toast } from "sonner"
import { Navigation } from "@/components/navigation"

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
  userVote?: {
    option: string
    createdAt: string
  }
}

export default function CouncilorDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bills, setBills] = useState<Bill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [voteOption, setVoteOption] = useState<string>("")
  const [isVoting, setIsVoting] = useState(false)

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/login")
    } else if (session.user.role === "ADMIN") {
      router.push("/admin")
    } else {
      fetchBills()
    }
  }, [session, status, router])

  const fetchBills = async () => {
    try {
      const response = await fetch("/api/councilor/bills")
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

  const handleVote = async () => {
    if (!selectedBill || !voteOption) return

    setIsVoting(true)
    try {
      const response = await fetch(`/api/councilor/bills/${selectedBill.id}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ option: voteOption }),
      })

      if (response.ok) {
        toast.success("Voto registrado com sucesso!")
        setSelectedBill(null)
        setVoteOption("")
        fetchBills()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao registrar voto")
      }
    } catch (error) {
      toast.error("Erro ao registrar voto")
    } finally {
      setIsVoting(false)
    }
  }

  const canVote = (bill: Bill) => {
    if (bill.userVote) return false
    if (bill.status !== "ACTIVE") return false
    if (!bill.votingStart || !bill.votingEnd) return false
    
    const now = new Date()
    const start = new Date(bill.votingStart)
    const end = new Date(bill.votingEnd)
    
    return now >= start && now <= end
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

  if (!session || session.user.role === "ADMIN") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation title="Painel do Vereador" showTelao={true} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Projetos para Votar
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {bills.filter(bill => canVote(bill)).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Aguardando seu voto
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Votos Realizados
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {bills.filter(bill => bill.userVote).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Total de votações
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Histórico
              </CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {bills.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Total de projetos
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Projetos de Lei</CardTitle>
            <CardDescription>
              Lista de projetos de lei disponíveis para votação
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
                    <TableHead>Período de Votação</TableHead>
                    <TableHead>Seu Voto</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.map((bill) => (
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
                        {bill.userVote ? (
                          <div className="flex items-center space-x-2">
                            {getVoteIcon(bill.userVote.option)}
                            <span className="text-sm">{getVoteText(bill.userVote.option)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500">Não votado</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {canVote(bill) ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm"
                                onClick={() => setSelectedBill(bill)}
                              >
                                Votar
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Votar em Projeto de Lei</DialogTitle>
                                <DialogDescription>
                                  {selectedBill?.title}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                  <p className="text-sm text-gray-600">
                                    {selectedBill?.description}
                                  </p>
                                </div>
                                <div>
                                  <Label>Selecione sua opção:</Label>
                                  <RadioGroup
                                    value={voteOption}
                                    onValueChange={setVoteOption}
                                    className="mt-2 space-y-2"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="YES" id="yes" />
                                      <Label htmlFor="yes" className="flex items-center">
                                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                        Sim
                                      </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="NO" id="no" />
                                      <Label htmlFor="no" className="flex items-center">
                                        <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                        Não
                                      </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="ABSTENTION" id="abstention" />
                                      <Label htmlFor="abstention" className="flex items-center">
                                        <MinusCircle className="h-4 w-4 mr-2 text-gray-600" />
                                        Abstenção
                                      </Label>
                                    </div>
                                  </RadioGroup>
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <Button variant="outline" onClick={() => setSelectedBill(null)}>
                                    Cancelar
                                  </Button>
                                  <Button 
                                    onClick={handleVote}
                                    disabled={!voteOption || isVoting}
                                  >
                                    {isVoting ? "Registrando..." : "Confirmar Voto"}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <Button size="sm" disabled>
                            {bill.userVote ? "Voto Registrado" : "Indisponível"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            
            {!isLoading && bills.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum projeto de lei disponível</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}