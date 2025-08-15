import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "COUNCILOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const bills = await db.bill.findMany({
      include: {
        author: {
          select: {
            name: true
          }
        },
        votes: {
          where: {
            userId: session.user.id
          },
          select: {
            option: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    const billsWithUserVote = bills.map(bill => ({
      ...bill,
      userVote: bill.votes[0] || null
    }))

    return NextResponse.json(billsWithUserVote)
  } catch (error) {
    console.error("Error fetching bills:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}