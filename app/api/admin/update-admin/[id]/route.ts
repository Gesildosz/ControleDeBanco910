import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const adminIdToUpdate = params.id
  const updates = await request.json()
  const supabase = createServerClient()

  // Check if the current admin has permission to create/update admins
  const { data: currentAdmin, error: adminError } = await supabase
    .from("administrators")
    .select("can_create_admin")
    .eq("id", session.userId)
    .single()

  if (adminError || !currentAdmin?.can_create_admin) {
    return NextResponse.json({ error: "Você não tem permissão para atualizar administradores." }, { status: 403 })
  }

  // Prevent updating the hardcoded admin's permissions via this route
  const { data: targetAdmin, error: targetAdminError } = await supabase
    .from("administrators")
    .select("username")
    .eq("id", adminIdToUpdate)
    .single()

  if (targetAdminError || !targetAdmin) {
    return NextResponse.json({ error: "Administrador não encontrado." }, { status: 404 })
  }

  if (targetAdmin.username === "GDSSOUZ5") {
    return NextResponse.json(
      { error: "Não é possível alterar as permissões do administrador padrão por aqui." },
      { status: 400 },
    )
  }

  try {
    const { error } = await supabase.from("administrators").update(updates).eq("id", adminIdToUpdate)

    if (error) {
      return NextResponse.json(
        {
          error: error.message.includes("duplicate key")
            ? "Usuário ou crachá já existem."
            : "Falha ao atualizar administrador.",
        },
        { status: 400 },
      )
    }

    return NextResponse.json({ message: "Administrador atualizado com sucesso." })
  } catch (error: any) {
    console.error("Erro ao atualizar administrador:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}
