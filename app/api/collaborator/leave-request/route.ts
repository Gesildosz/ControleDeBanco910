import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || session.role !== "collaborator") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const supabase = createServerClient()
  const { requestDate, hoursRequested, reason } = await request.json()

  try {
    // 1. Check collaborator's current balance
    const { data: collaborator, error: collabError } = await supabase
      .from("collaborators")
      .select("balance")
      .eq("id", session.userId)
      .single()

    if (collabError || !collaborator) {
      return NextResponse.json({ error: "Colaborador não encontrado." }, { status: 404 })
    }

    if (collaborator.balance < 3) {
      return NextResponse.json(
        { error: "Você precisa ter um saldo positivo de pelo menos 3 horas para solicitar uma folga." },
        { status: 400 },
      )
    }

    // 2. Insert the leave request
    const { error: insertError } = await supabase.from("leave_requests").insert([
      {
        collaborator_id: session.userId,
        request_date: requestDate,
        hours_requested: hoursRequested,
        reason: reason || null,
        status: "pending",
      },
    ])

    if (insertError) {
      console.error("Erro ao inserir solicitação de folga:", insertError.message)
      return NextResponse.json({ error: "Falha ao enviar solicitação de folga." }, { status: 500 })
    }

    return NextResponse.json({ message: "Solicitação de folga enviada com sucesso." })
  } catch (error: any) {
    console.error("Erro interno do servidor ao enviar solicitação de folga:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}
