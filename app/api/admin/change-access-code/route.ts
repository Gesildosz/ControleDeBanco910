import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const supabase = createServerClient()
  const { collaboratorId, newAccessCode } = await request.json()

  // Check if the current admin has permission to change access codes
  const { data: currentAdmin, error: adminError } = await supabase
    .from("administrators")
    .select("can_change_access_code")
    .eq("id", session.userId)
    .single()

  if (adminError || !currentAdmin?.can_change_access_code) {
    return NextResponse.json({ error: "Você não tem permissão para alterar códigos de acesso." }, { status: 403 })
  }

  // Validate new access code format
  if (newAccessCode.length < 6 || newAccessCode.length > 10 || !/^\d+$/.test(newAccessCode)) {
    return NextResponse.json({ error: "O código de acesso deve ter entre 6 e 10 dígitos numéricos." }, { status: 400 })
  }

  try {
    const { error } = await supabase
      .from("collaborators")
      .update({ access_code: newAccessCode })
      .eq("id", collaboratorId)

    if (error) {
      return NextResponse.json(
        {
          error: error.message.includes("duplicate key")
            ? "Este código de acesso já está em uso."
            : "Falha ao atualizar código de acesso.",
        },
        { status: 400 },
      )
    }

    return NextResponse.json({ message: "Código de acesso atualizado com sucesso." })
  } catch (error: any) {
    console.error("Erro ao alterar código de acesso:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}
