import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const requestId = params.id
  const { status, adminNotes } = await request.json() // status will be 'approved' or 'rejected'
  const supabase = createServerClient()

  // Check if the current admin has permission to enter hours (or manage leave requests)
  const { data: currentAdmin, error: adminError } = await supabase
    .from("administrators")
    .select("can_enter_hours")
    .eq("id", session.userId)
    .single()

  if (adminError || !currentAdmin?.can_enter_hours) {
    return NextResponse.json({ error: "Você não tem permissão para gerenciar solicitações de folga." }, { status: 403 })
  }

  try {
    // Start a transaction-like operation (Supabase doesn't have native transactions for RLS, so we sequence)
    // 1. Get the leave request details
    const { data: leaveRequest, error: fetchRequestError } = await supabase
      .from("leave_requests")
      .select("collaborator_id, hours_requested, status, request_date")
      .eq("id", requestId)
      .single()

    if (fetchRequestError || !leaveRequest) {
      return NextResponse.json({ error: "Solicitação de folga não encontrada." }, { status: 404 })
    }

    if (leaveRequest.status !== "pending") {
      return NextResponse.json({ error: "Esta solicitação já foi processada." }, { status: 400 })
    }

    // 2. Update the leave request status
    const { error: updateRequestError } = await supabase
      .from("leave_requests")
      .update({
        status: status,
        admin_id: session.userId,
        admin_notes: adminNotes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId)

    if (updateRequestError) {
      console.error("Erro ao atualizar status da solicitação de folga:", updateRequestError.message)
      return NextResponse.json({ error: "Falha ao atualizar status da solicitação." }, { status: 500 })
    }

    // 3. If approved, deduct hours from collaborator's balance and record time entry
    if (status === "approved") {
      const hoursToDeduct = leaveRequest.hours_requested * -1 // Make it negative for deduction

      // Fetch current collaborator balance
      const { data: collaborator, error: fetchCollabError } = await supabase
        .from("collaborators")
        .select("balance")
        .eq("id", leaveRequest.collaborator_id)
        .single()

      if (fetchCollabError || !collaborator) {
        // This is a critical error, request was approved but collaborator not found/balance not fetched
        console.error("Erro crítico: Colaborador não encontrado ao deduzir horas após aprovação de folga.")
        return NextResponse.json(
          { error: "Erro crítico ao deduzir horas. Colaborador não encontrado." },
          { status: 500 },
        )
      }

      const newBalance = collaborator.balance + hoursToDeduct // hoursToDeduct is already negative
      let newBalanceType = "none"
      if (newBalance > 0) {
        newBalanceType = "positive"
      } else if (newBalance < 0) {
        newBalanceType = "negative"
      }

      // Update collaborator's balance
      const { error: updateBalanceError } = await supabase
        .from("collaborators")
        .update({ balance: newBalance, balance_type: newBalanceType })
        .eq("id", leaveRequest.collaborator_id)

      if (updateBalanceError) {
        console.error("Erro ao atualizar saldo do colaborador após aprovação de folga:", updateBalanceError.message)
        return NextResponse.json(
          { error: "Falha ao atualizar saldo do colaborador após aprovação de folga." },
          { status: 500 },
        )
      }

      // Record the time entry for history
      const { error: entryError } = await supabase.from("time_entries").insert([
        {
          collaborator_id: leaveRequest.collaborator_id,
          admin_id: session.userId,
          hours_change: hoursToDeduct,
          new_balance: newBalance,
          entry_type: "leave_approved",
          description: `Folga aprovada para ${format(new Date(leaveRequest.request_date), "dd/MM/yyyy", { locale: ptBR })}. ${adminNotes ? `Notas do Admin: ${adminNotes}` : ""}`,
        },
      ])

      if (entryError) {
        console.error("Erro ao registrar lançamento de horas de folga:", entryError.message)
        // This is also a critical error, balance updated but history not recorded
        return NextResponse.json(
          { error: "Falha ao registrar lançamento de horas de folga. Saldo atualizado, mas histórico incompleto." },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({ message: "Solicitação processada com sucesso." })
  } catch (error: any) {
    console.error("Erro interno do servidor ao processar solicitação de folga:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}
