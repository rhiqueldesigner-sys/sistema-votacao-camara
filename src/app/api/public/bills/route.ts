import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
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
            createdAt: true,
            user: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(bills)
  } catch (error) {
    console.error("Error fetching public bills:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}