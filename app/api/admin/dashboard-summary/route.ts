import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

export async function GET(request: Request) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const supabase = createServerClient()

  try {
    const { data: collaborators, error } = await supabase
      .from("collaborators")
      .select("full_name, badge_number, balance, balance_type")
      .order("full_name", { ascending: true })

    if (error) {
      console.error("Erro ao buscar dados dos colaboradores para o dashboard:", error.message)
      return NextResponse.json({ error: "Falha ao carregar dados do dashboard." }, { status: 500 })
    }

    let totalPositiveHours = 0
    let totalNegativeHours = 0
    const positiveCollaborators: { full_name: string; badge_number: string; balance: number }[] = []
    const negativeCollaborators: { full_name: string; badge_number: string; balance: number }[] = []

    collaborators.forEach((collab) => {
      if (collab.balance > 0) {
        totalPositiveHours += collab.balance
        positiveCollaborators.push({
          full_name: collab.full_name,
          badge_number: collab.badge_number,
          balance: collab.balance,
        })
      } else if (collab.balance < 0) {
        totalNegativeHours += Math.abs(collab.balance) // Store as positive for display
        negativeCollaborators.push({
          full_name: collab.full_name,
          badge_number: collab.badge_number,
          balance: collab.balance,
        })
      }
    })

    return NextResponse.json({
      totalPositiveHours,
      totalNegativeHours,
      positiveCollaborators,
      negativeCollaborators,
    })
  } catch (error: any) {
    console.error("Erro interno do servidor ao buscar dados do dashboard:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}
