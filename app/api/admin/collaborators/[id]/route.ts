import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const collaboratorId = params.id
  const updates = await request.json()
  const supabase = createServerClient()

  // Check if the current admin has permission to create/update collaborators
  const { data: currentAdmin, error: adminError } = await supabase
    .from("administrators")
    .select("can_create_collaborator")
    .eq("id", session.userId)
    .single()

  if (adminError || !currentAdmin?.can_create_collaborator) {
    return NextResponse.json({ error: "Você não tem permissão para atualizar colaboradores." }, { status: 403 })
  }

  try {
    const { error } = await supabase.from("collaborators").update(updates).eq("id", collaboratorId)

    if (error) {
      return NextResponse.json(
        {
          error: error.message.includes("duplicate key")
            ? "Crachá ou ID de acesso já existem."
            : "Falha ao atualizar colaborador.",
        },
        { status: 400 },
      )
    }

    return NextResponse.json({ message: "Colaborador atualizado com sucesso." })
  } catch (error: any) {
    console.error("Erro ao atualizar colaborador:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const collaboratorId = params.id
  const supabase = createServerClient()

  // Check if the current admin has permission to create/delete collaborators
  const { data: currentAdmin, error: adminError } = await supabase
    .from("administrators")
    .select("can_create_collaborator")
    .eq("id", session.userId)
    .single()

  if (adminError || !currentAdmin?.can_create_collaborator) {
    return NextResponse.json({ error: "Você não tem permissão para excluir colaboradores." }, { status: 403 })
  }

  try {
    const { error } = await supabase.from("collaborators").delete().eq("id", collaboratorId)

    if (error) {
      return NextResponse.json({ error: "Falha ao excluir colaborador." }, { status: 400 })
    }

    return NextResponse.json({ message: "Colaborador excluído com sucesso." })
  } catch (error: any) {
    console.error("Erro ao excluir colaborador:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}
