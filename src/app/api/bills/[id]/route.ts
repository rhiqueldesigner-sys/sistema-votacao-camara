import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, votingStart, votingEnd, status } = body

    const bill = await db.bill.update({
      where: { id: params.id },
      data: {
        title,
        description,
        votingStart: votingStart ? new Date(votingStart) : null,
        votingEnd: votingEnd ? new Date(votingEnd) : null,
        status
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
    console.error("Error updating bill:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db.bill.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Bill deleted successfully" })
  } catch (error) {
    console.error("Error deleting bill:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}