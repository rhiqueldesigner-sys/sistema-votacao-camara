import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const bills = await db.bill.findMany({
      include: {
        author: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            votes: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(bills)
  } catch (error) {
    console.error("Erro ao buscar projetos:", error)
    return NextResponse.json({ error: "Erro ao buscar projetos" }, { status: 500 })
  }
}