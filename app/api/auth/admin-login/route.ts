import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { createSession } from "@/lib/session"
import bcrypt from "bcryptjs" // Alterado de "bcrypt" para "bcryptjs"

export async function POST(request: Request) {
  const { username, password } = await request.json()
  const supabase = createServerClient()

  try {
    // Check against database for admins
    const { data, error } = await supabase
      .from("administrators")
      .select("id, password_hash")
      .eq("username", username)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "Usuário ou senha inválidos." }, { status: 401 })
    }

    const passwordMatch = await bcrypt.compare(password, data.password_hash)

    if (!passwordMatch) {
      return NextResponse.json({ error: "Usuário ou senha inválidos." }, { status: 401 })
    }

    await createSession(data.id, "admin")
    return NextResponse.json({ message: "Login bem-sucedido." })
  } catch (error: any) {
    console.error("Erro no login do administrador:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}
