import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const supabase = createServerClient()

  try {
    const { data, error } = await supabase
      .from("announcements")
      .select("id, content, is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 means "no rows found"
      console.error("Erro ao buscar aviso:", error.message)
      return NextResponse.json({ error: "Falha ao carregar aviso." }, { status: 500 })
    }

    return NextResponse.json(data || null)
  } catch (error: any) {
    console.error("Erro interno do servidor ao buscar aviso:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const supabase = createServerClient()
  const { content } = await request.json()

  // Check if the current admin has permission to enter hours (or manage announcements)
  const { data: currentAdmin, error: adminError } = await supabase
    .from("administrators")
    .select("can_enter_hours") // Using can_enter_hours as a proxy for now
    .eq("id", session.userId)
    .single()

  if (adminError || !currentAdmin?.can_enter_hours) {
    return NextResponse.json({ error: "Você não tem permissão para gerenciar avisos." }, { status: 403 })
  }

  try {
    // Deactivate all existing announcements first
    await supabase
      .from("announcements")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("is_active", true)

    // Insert the new announcement as active
    const { data, error } = await supabase
      .from("announcements")
      .insert([
        {
          content,
          is_active: true,
          admin_id: session.userId,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar/atualizar aviso:", error.message)
      return NextResponse.json({ error: "Falha ao criar/atualizar aviso." }, { status: 500 })
    }

    return NextResponse.json({ message: "Aviso atualizado com sucesso.", announcement: data })
  } catch (error: any) {
    console.error("Erro interno do servidor ao criar/atualizar aviso:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}
