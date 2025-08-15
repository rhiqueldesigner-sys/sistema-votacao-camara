import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const billId = params.id

    // Buscar a votação e seus votos
    const votes = await db.vote.findMany({
      where: {
        billId: billId
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    })

    // Calcular estatísticas
    const stats = {
      YES: votes.filter(v => v.option === "YES").length,
      NO: votes.filter(v => v.option === "NO").length,
      ABSTENTION: votes.filter(v => v.option === "ABSTENTION").length,
      total: votes.length
    }

    return NextResponse.json({
      votes,
      stats
    })
  } catch (error) {
    console.error("Erro ao buscar votos:", error)
    return NextResponse.json({ error: "Erro ao buscar votos" }, { status: 500 })
  }
}