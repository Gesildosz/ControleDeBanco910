import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const supabase = createServerClient()
  const { full_name, badge_number, position, shift, supervisor, access_code, is_active } = await request.json() // Added is_active

  // Check if the current admin has permission to create collaborators
  const { data: currentAdmin, error: adminError } = await supabase
    .from("administrators")
    .select("can_create_collaborator")
    .eq("id", session.userId)
    .single()

  if (adminError || !currentAdmin?.can_create_collaborator) {
    return NextResponse.json({ error: "Você não tem permissão para criar colaboradores." }, { status: 403 })
  }

  try {
    const { data, error } = await supabase.from("collaborators").insert([
      {
        full_name,
        badge_number,
        position,
        shift,
        supervisor,
        access_code,
        balance: 0, // Initial balance
        balance_type: "none",
        is_active: is_active ?? true, // Use provided status or default to true
      },
    ])

    if (error) {
      return NextResponse.json(
        {
          error: error.message.includes("duplicate key")
            ? "Crachá ou ID de acesso já existem."
            : "Falha ao adicionar colaborador.",
        },
        { status: 400 },
      )
    }

    return NextResponse.json({ message: "Colaborador adicionado com sucesso." })
  } catch (error: any) {
    console.error("Erro ao adicionar colaborador:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}
