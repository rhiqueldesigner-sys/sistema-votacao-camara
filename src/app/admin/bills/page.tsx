"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, ArrowLeft, Calendar } from "lucide-react"
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
}

export default function BillsManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bills, setBills] = useState<Bill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBill, setEditingBill] = useState<Bill | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    votingStart: "",
    votingEnd: "",
    status: "DRAFT"
  })

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingBill ? `/api/bills/${editingBill.id}` : "/api/bills"
      const method = editingBill ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success(editingBill ? "Projeto atualizado com sucesso!" : "Projeto criado com sucesso!")
        setIsDialogOpen(false)
        setEditingBill(null)
        setFormData({
          title: "",
          description: "",
          votingStart: "",
          votingEnd: "",
          status: "DRAFT"
        })
        fetchBills()
      } else {
        toast.error("Erro ao salvar projeto")
      }
    } catch (error) {
      toast.error("Erro ao salvar projeto")
    }
  }

  const handleEdit = (bill: Bill) => {
    setEditingBill(bill)
    setFormData({
      title: bill.title,
      description: bill.description,
      votingStart: bill.votingStart ? new Date(bill.votingStart).toISOString().slice(0, 16) : "",
      votingEnd: bill.votingEnd ? new Date(bill.votingEnd).toISOString().slice(0, 16) : "",
      status: bill.status
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este projeto?")) return

    try {
      const response = await fetch(`/api/bills/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Projeto excluído com sucesso!")
        fetchBills()
      } else {
        toast.error("Erro ao excluir projeto")
      }
    } catch (error) {
      toast.error("Erro ao excluir projeto")
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
                  Gerenciar Projetos de Lei
                </h1>
                <p className="text-sm text-gray-600">
                  Crie, edite e exclua projetos de lei
                </p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingBill(null)
                  setFormData({
                    title: "",
                    description: "",
                    votingStart: "",
                    votingEnd: "",
                    status: "DRAFT"
                  })
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Projeto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingBill ? "Editar Projeto" : "Novo Projeto de Lei"}
                  </DialogTitle>
                  <DialogDescription>
                    Preencha as informações do projeto de lei
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="votingStart">Início da Votação</Label>
                      <Input
                        id="votingStart"
                        type="datetime-local"
                        value={formData.votingStart}
                        onChange={(e) => setFormData({ ...formData, votingStart: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="votingEnd">Fim da Votação</Label>
                      <Input
                        id="votingEnd"
                        type="datetime-local"
                        value={formData.votingEnd}
                        onChange={(e) => setFormData({ ...formData, votingEnd: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Rascunho</SelectItem>
                        <SelectItem value="ACTIVE">Ativo</SelectItem>
                        <SelectItem value="COMPLETED">Concluído</SelectItem>
                        <SelectItem value="CANCELLED">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingBill ? "Atualizar" : "Criar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2">Carregando projetos...</p>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Projetos de Lei</CardTitle>
              <CardDescription>
                Lista de todos os projetos de lei cadastrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Período de Votação</TableHead>
                    <TableHead>Criado em</TableHead>
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
                        {new Date(bill.createdAt).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(bill)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(bill.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {bills.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhum projeto de lei cadastrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}