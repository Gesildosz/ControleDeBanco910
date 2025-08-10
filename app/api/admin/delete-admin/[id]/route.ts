import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const adminIdToDelete = params.id
  const supabase = createServerClient()

  // Check if the current admin has permission to create/delete admins
  const { data: currentAdmin, error: adminError } = await supabase
    .from("administrators")
    .select("can_create_admin")
    .eq("id", session.userId)
    .single()

  if (adminError || !currentAdmin?.can_create_admin) {
    return NextResponse.json({ error: "Você não tem permissão para excluir administradores." }, { status: 403 })
  }

  // Prevent deleting the hardcoded admin
  const { data: targetAdmin, error: targetAdminError } = await supabase
    .from("administrators")
    .select("username")
    .eq("id", adminIdToDelete)
    .single()

  if (targetAdminError || !targetAdmin) {
    return NextResponse.json({ error: "Administrador não encontrado." }, { status: 404 })
  }

  if (targetAdmin.username === "GDSSOUZ5") {
    return NextResponse.json({ error: "Não é possível excluir o administrador padrão." }, { status: 400 })
  }

  try {
    const { error } = await supabase.from("administrators").delete().eq("id", adminIdToDelete)

    if (error) {
      return NextResponse.json({ error: "Falha ao excluir administrador." }, { status: 400 })
    }

    return NextResponse.json({ message: "Administrador excluído com sucesso." })
  } catch (error: any) {
    console.error("Erro ao excluir administrador:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}
