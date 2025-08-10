import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

export async function GET(request: Request, { params }: { params: { leaderName: string } }) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const leaderName = decodeURIComponent(params.leaderName)
  const supabase = createServerClient()

  // Check if the current admin has permission to enter hours (or generate reports)
  const { data: currentAdmin, error: adminError } = await supabase
    .from("administrators")
    .select("can_enter_hours") // Reusing can_enter_hours for report generation permission
    .eq("id", session.userId)
    .single()

  if (adminError || !currentAdmin?.can_enter_hours) {
    return NextResponse.json({ error: "Você não tem permissão para gerar relatórios." }, { status: 403 })
  }

  try {
    // Fetch collaborators under this leader
    const { data: collaborators, error: collabError } = await supabase
      .from("collaborators")
      .select("id, full_name, badge_number, position, balance, balance_type")
      .eq("supervisor", leaderName)
      .order("full_name", { ascending: true })

    if (collabError) {
      console.error("Erro ao buscar colaboradores para o relatório:", collabError.message)
      return NextResponse.json({ error: "Falha ao carregar dados dos colaboradores." }, { status: 500 })
    }

    // Fetch time entries for each collaborator
    const collaboratorsWithHistory = await Promise.all(
      collaborators.map(async (collab) => {
        const { data: history, error: historyError } = await supabase
          .from("time_entries")
          .select("date, hours_change, new_balance, entry_type, description")
          .eq("collaborator_id", collab.id)
          .order("date", { ascending: true })

        if (historyError) {
          console.error(`Erro ao buscar histórico para ${collab.full_name}:`, historyError.message)
          // Continue without history for this collaborator if there's an error
          return { ...collab, history: [] }
        }
        return { ...collab, history: history || [] }
      }),
    )

    // Calculate summary for the leader's team
    let totalPositiveHoursLeader = 0
    let totalNegativeHoursLeader = 0
    collaboratorsWithHistory.forEach((collab) => {
      if (collab.balance > 0) {
        totalPositiveHoursLeader += collab.balance
      } else if (collab.balance < 0) {
        totalNegativeHoursLeader += Math.abs(collab.balance)
      }
    })

    return NextResponse.json({
      leaderName,
      totalPositiveHoursLeader,
      totalNegativeHoursLeader,
      collaborators: collaboratorsWithHistory,
    })
  } catch (error: any) {
    console.error("Erro interno do servidor ao gerar relatório por líder:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}
