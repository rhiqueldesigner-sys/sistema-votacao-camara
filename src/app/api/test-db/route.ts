import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    console.log("Testing database connection...")
    
    // Testar conexão com o banco de dados
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      },
      take: 5
    })
    
    console.log("Users found:", users)
    
    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      users: users,
      count: users.length
    })
  } catch (error) {
    console.error("Database connection error:", error)
    return NextResponse.json({
      success: false,
      message: "Database connection failed",
      error: error.message
    }, { status: 500 })
  }
}