import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
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
          select: {
            id: true,
            option: true,
            user: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(bills)
  } catch (error) {
    console.error("Error fetching bills:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, votingStart, votingEnd, status } = body

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 })
    }

    const bill = await db.bill.create({
      data: {
        title,
        description,
        votingStart: votingStart ? new Date(votingStart) : null,
        votingEnd: votingEnd ? new Date(votingEnd) : null,
        status,
        authorId: session.user.id
      },
      include: {
        author: {
          select: {
            name: true
          }
        }
      }
    })

    return NextResponse.json(bill)
  } catch (error) {
    console.error("Error creating bill:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}