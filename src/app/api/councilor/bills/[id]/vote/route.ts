import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Server } from "socket.io"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "COUNCILOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { option } = body

    if (!option || !["YES", "NO", "ABSTENTION"].includes(option)) {
      return NextResponse.json({ error: "Invalid vote option" }, { status: 400 })
    }

    // Check if bill exists and is active
    const bill = await db.bill.findUnique({
      where: { id: params.id }
    })

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 })
    }

    if (bill.status !== "ACTIVE") {
      return NextResponse.json({ error: "Bill is not active for voting" }, { status: 400 })
    }

    // Check if voting period is valid
    if (bill.votingStart && bill.votingEnd) {
      const now = new Date()
      const start = new Date(bill.votingStart)
      const end = new Date(bill.votingEnd)
      
      if (now < start || now > end) {
        return NextResponse.json({ error: "Voting period is not active" }, { status: 400 })
      }
    }

    // Check if user already voted
    const existingVote = await db.vote.findUnique({
      where: {
        userId_billId: {
          userId: session.user.id,
          billId: params.id
        }
      }
    })

    if (existingVote) {
      return NextResponse.json({ error: "You have already voted on this bill" }, { status: 400 })
    }

    // Create vote
    const vote = await db.vote.create({
      data: {
        option,
        userId: session.user.id,
        billId: params.id
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Emit socket event for real-time updates
    // Note: In a real implementation, you would access the socket.io server instance
    // For now, we'll just return the vote data
    // The socket event would be emitted like this:
    // io.to(`bill-${params.id}`).emit('vote-update', {
    //   billId: params.id,
    //   vote: vote,
    //   timestamp: new Date().toISOString(),
    // })

    return NextResponse.json(vote)
  } catch (error) {
    console.error("Error casting vote:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}