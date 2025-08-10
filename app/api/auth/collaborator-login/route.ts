import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { createSession } from "@/lib/session"

export async function POST(request: Request) {
  const { accessCode } = await request.json()
  const supabase = createServerClient()

  try {
    // Check for active collaborator with the given access code
    const { data, error } = await supabase
      .from("collaborators")
      .select("id, is_active") // Select is_active
      .eq("access_code", accessCode)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "Código de acesso inválido." }, { status: 401 })
    }

    if (!data.is_active) {
      // Check if the collaborator is active
      return NextResponse.json(
        { error: "Sua conta está inativa. Por favor, contate o administrador." },
        { status: 403 },
      )
    }

    await createSession(data.id, "collaborator")
    return NextResponse.json({ message: "Login bem-sucedido." })
  } catch (error: any) {
    console.error("Erro no login do colaborador:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}
