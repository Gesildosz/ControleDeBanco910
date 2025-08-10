import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

export async function GET(request: Request) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const adminId = searchParams.get("id")

  if (!adminId || adminId !== session.userId) {
    return NextResponse.json({ error: "ID de administrador inválido ou não autorizado." }, { status: 403 })
  }

  const supabase = createServerClient()
  const { data: admin, error } = await supabase.from("administrators").select("*").eq("id", adminId).single()

  if (error || !admin) {
    console.error("Erro ao buscar dados do administrador:", error?.message)
    return NextResponse.json({ error: "Administrador não encontrado." }, { status: 404 })
  }

  // Return only necessary data, exclude password_hash
  const { password_hash, ...adminData } = admin
  return NextResponse.json(adminData)
}
