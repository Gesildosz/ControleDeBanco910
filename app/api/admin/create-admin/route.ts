import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import bcrypt from "bcryptjs" // Alterado de "bcrypt" para "bcryptjs"
import { getSession } from "@/lib/session"

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const supabase = createServerClient()
  const {
    full_name,
    badge_number,
    username,
    password,
    can_create_collaborator,
    can_create_admin,
    can_enter_hours,
    can_change_access_code,
  } = await request.json()

  // Check if the current admin has permission to create new admins
  const { data: currentAdmin, error: adminError } = await supabase
    .from("administrators")
    .select("can_create_admin")
    .eq("id", session.userId)
    .single()

  if (adminError || !currentAdmin?.can_create_admin) {
    return NextResponse.json({ error: "Você não tem permissão para criar novos administradores." }, { status: 403 })
  }

  if (username === "GDSSOUZ5") {
    return NextResponse.json({ error: "Não é possível criar um administrador com o usuário padrão." }, { status: 400 })
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)

    const { data, error } = await supabase.from("administrators").insert([
      {
        full_name,
        badge_number,
        username,
        password_hash: hashedPassword,
        can_create_collaborator,
        can_create_admin,
        can_enter_hours,
        can_change_access_code,
      },
    ])

    if (error) {
      return NextResponse.json(
        {
          error: error.message.includes("duplicate key")
            ? "Usuário ou crachá já existem."
            : "Falha ao adicionar administrador.",
        },
        { status: 400 },
      )
    }

    return NextResponse.json({ message: "Administrador adicionado com sucesso." })
  } catch (error: any) {
    console.error("Erro ao adicionar administrador:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}
