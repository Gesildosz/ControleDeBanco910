import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

export async function GET(request: Request) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

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
    const { data: requests, error } = await supabase
      .from("leave_requests")
      .select(
        `
        *,
        collaborators (
          full_name,
          badge_number,
          supervisor,
          balance,
          balance_type
        )
      `,
      )
      .eq("status", "pending")
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Erro ao buscar solicitações de folga pendentes:", error.message)
      return NextResponse.json({ error: "Falha ao carregar solicitações de folga." }, { status: 500 })
    }

    return NextResponse.json({ requests })
  } catch (error: any) {
    console.error("Erro interno do servidor ao buscar solicitações de folga:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}
