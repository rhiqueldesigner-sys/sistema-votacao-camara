import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { billId, format } = body

    if (!billId || !format) {
      return NextResponse.json({ error: "Bill ID and format are required" }, { status: 400 })
    }

    if (!["csv", "pdf"].includes(format)) {
      return NextResponse.json({ error: "Invalid format" }, { status: 400 })
    }

    // Fetch bill with votes
    const bill = await db.bill.findUnique({
      where: { id: billId },
      include: {
        author: {
          select: {
            name: true
          }
        },
        votes: {
          select: {
            option: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        }
      }
    })

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 })
    }

    if (format === "csv") {
      return generateCSV(bill)
    } else {
      return generatePDF(bill)
    }
  } catch (error) {
    console.error("Error generating export:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

function generateCSV(bill: any) {
  const headers = ["Nome", "E-mail", "Voto", "Data/Hora"]
  
  const rows = bill.votes.map((vote: any) => [
    vote.user.name,
    vote.user.email,
    vote.option === "YES" ? "Sim" : vote.option === "NO" ? "Não" : "Abstenção",
    new Date(vote.createdAt).toLocaleString("pt-BR")
  ])

  // Add summary row
  const stats = {
    YES: bill.votes.filter((v: any) => v.option === "YES").length,
    NO: bill.votes.filter((v: any) => v.option === "NO").length,
    ABSTENTION: bill.votes.filter((v: any) => v.option === "ABSTENTION").length,
    total: bill.votes.length
  }

  rows.push([])
  rows.push(["RESUMO", "", "", ""])
  rows.push(["Total de votos:", stats.total, "", ""])
  rows.push(["Sim:", stats.YES, "", ""])
  rows.push(["Não:", stats.NO, "", ""])
  rows.push(["Abstenção:", stats.ABSTENTION, "", ""])

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n")

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="votacao-${bill.title.replace(/[^a-zA-Z0-9]/g, "-")}.csv"`
    }
  })
}

function generatePDF(bill: any) {
  // For PDF generation, we'll return HTML content that can be converted to PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Resultado da Votação - ${bill.title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .subtitle { font-size: 16px; color: #666; margin-bottom: 20px; }
        .info { margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .summary { background-color: #f9f9f9; padding: 15px; border-radius: 5px; }
        .vote-yes { color: #22c55e; font-weight: bold; }
        .vote-no { color: #ef4444; font-weight: bold; }
        .vote-abstention { color: #6b7280; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">Câmara de Vereadores de Ubaporanga</div>
        <div class="subtitle">Sistema de Votação Eletrônica</div>
      </div>

      <div class="section">
        <div class="section-title">Projeto de Lei</div>
        <div class="info">
          <strong>Título:</strong> ${bill.title}<br>
          <strong>Descrição:</strong> ${bill.description}<br>
          <strong>Autor:</strong> ${bill.author.name}<br>
          <strong>Status:</strong> ${bill.status}<br>
          <strong>Período de Votação:</strong> ${
            bill.votingStart && bill.votingEnd 
              ? `${new Date(bill.votingStart).toLocaleDateString("pt-BR")} a ${new Date(bill.votingEnd).toLocaleDateString("pt-BR")}`
              : "Não definido"
          }
        </div>
      </div>

      <div class="section">
        <div class="section-title">Resultados</div>
        <div class="summary">
          ${(() => {
            const stats = {
              YES: bill.votes.filter((v: any) => v.option === "YES").length,
              NO: bill.votes.filter((v: any) => v.option === "NO").length,
              ABSTENTION: bill.votes.filter((v: any) => v.option === "ABSTENTION").length,
              total: bill.votes.length
            }
            
            return `
              <p><strong>Total de votos:</strong> ${stats.total}</p>
              <p><span class="vote-yes">Sim:</span> ${stats.YES} (${stats.total > 0 ? Math.round((stats.YES / stats.total) * 100) : 0}%)</p>
              <p><span class="vote-no">Não:</span> ${stats.NO} (${stats.total > 0 ? Math.round((stats.NO / stats.total) * 100) : 0}%)</p>
              <p><span class="vote-abstention">Abstenção:</span> ${stats.ABSTENTION} (${stats.total > 0 ? Math.round((stats.ABSTENTION / stats.total) * 100) : 0}%)</p>
            `
          })()}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Votos Registrados</div>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Voto</th>
              <th>Data/Hora</th>
            </tr>
          </thead>
          <tbody>
            ${bill.votes.map((vote: any) => `
              <tr>
                <td>${vote.user.name}</td>
                <td>${vote.user.email}</td>
                <td class="${
                  vote.option === "YES" ? "vote-yes" : 
                  vote.option === "NO" ? "vote-no" : "vote-abstention"
                }">
                  ${vote.option === "YES" ? "Sim" : vote.option === "NO" ? "Não" : "Abstenção"}
                </td>
                <td>${new Date(vote.createdAt).toLocaleString("pt-BR")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div style="text-align: center; margin-top: 50px; color: #666; font-size: 12px;">
        Gerado em ${new Date().toLocaleString("pt-BR")}
      </div>
    </body>
    </html>
  `

  return new NextResponse(htmlContent, {
    headers: {
      "Content-Type": "text/html",
      "Content-Disposition": `attachment; filename="votacao-${bill.title.replace(/[^a-zA-Z0-9]/g, "-")}.html"`
    }
  })
}