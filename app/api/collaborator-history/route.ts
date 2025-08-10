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
    const { data: history, error } = await supabase
      .from("time_entries")
      .select("*")
      .eq("collaborator_id", session.userId)
      .order("date", { ascending: true }) // Order by date for the graph

    if (error) {
      console.error("Erro ao buscar histórico:", error.message)
      return NextResponse.json({ error: "Falha ao carregar histórico." }, { status: 500 })
    }

    return NextResponse.json({ history })
  } catch (error: any) {
    console.error("Erro interno do servidor ao buscar histórico:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}
