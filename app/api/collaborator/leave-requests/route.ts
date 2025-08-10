import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

export async function GET(request: Request) {
  const session = await getSession()
  if (!session || session.role !== "collaborator") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const supabase = createServerClient()

  try {
    const { data: requests, error } = await supabase
      .from("leave_requests")
      .select("*")
      .eq("collaborator_id", session.userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar solicitações de folga:", error.message)
      return NextResponse.json({ error: "Falha ao carregar solicitações de folga." }, { status: 500 })
    }

    return NextResponse.json({ requests })
  } catch (error: any) {
    console.error("Erro interno do servidor ao buscar solicitações de folga:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}
