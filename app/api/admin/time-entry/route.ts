import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const supabase = createServerClient()
  const { collaboratorId, hoursChange, description } = await request.json()

  // Check if the current admin has permission to enter hours
  const { data: currentAdmin, error: adminError } = await supabase
    .from("administrators")
    .select("can_enter_hours")
    .eq("id", session.userId)
    .single()

  if (adminError || !currentAdmin?.can_enter_hours) {
    return NextResponse.json({ error: "Você não tem permissão para lançar horas." }, { status: 403 })
  }

  try {
    // Fetch current collaborator balance
    const { data: collaborator, error: fetchError } = await supabase
      .from("collaborators")
      .select("balance")
      .eq("id", collaboratorId)
      .single()

    if (fetchError || !collaborator) {
      return NextResponse.json({ error: "Colaborador não encontrado." }, { status: 404 })
    }

    const newBalance = collaborator.balance + hoursChange
    let newBalanceType = "none"
    if (newBalance > 0) {
      newBalanceType = "positive"
    } else if (newBalance < 0) {
      newBalanceType = "negative"
    }

    // Update collaborator's balance
    const { error: updateError } = await supabase
      .from("collaborators")
      .update({ balance: newBalance, balance_type: newBalanceType })
      .eq("id", collaboratorId)

    if (updateError) {
      console.error("Erro ao atualizar saldo do colaborador:", updateError.message)
      return NextResponse.json({ error: "Falha ao atualizar saldo do colaborador." }, { status: 500 })
    }

    // Record the time entry for history
    const { error: entryError } = await supabase.from("time_entries").insert([
      {
        collaborator_id: collaboratorId,
        admin_id: session.userId,
        hours_change: hoursChange,
        new_balance: newBalance,
        entry_type: "manual_adjustment",
        description: description || null,
      },
    ])

    if (entryError) {
      console.error("Erro ao registrar lançamento de horas:", entryError.message)
      return NextResponse.json({ error: "Falha ao registrar lançamento de horas." }, { status: 500 })
    }

    return NextResponse.json({ message: "Lançamento de horas realizado com sucesso." })
  } catch (error: any) {
    console.error("Erro interno do servidor ao lançar horas:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}
