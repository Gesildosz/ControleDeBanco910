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
    const { data: collaborator, error } = await supabase
      .from("collaborators")
      .select("id, full_name, badge_number, position, shift, supervisor, balance, balance_type, is_active") // Select is_active
      .eq("id", session.userId)
      .single()

    if (error || !collaborator) {
      console.error("Erro ao buscar dados do colaborador:", error?.message)
      return NextResponse.json({ error: "Colaborador não encontrado." }, { status: 404 })
    }

    if (!collaborator.is_active) {
      // Check if the collaborator is active
      return NextResponse.json(
        { error: "Sua conta está inativa. Por favor, contate o administrador." },
        { status: 403 },
      )
    }

    return NextResponse.json(collaborator)
  } catch (error: any) {
    console.error("Erro interno do servidor ao buscar dados do colaborador:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}
