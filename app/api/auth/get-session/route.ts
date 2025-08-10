import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Nenhuma sessão ativa." }, { status: 401 })
    }
    return NextResponse.json(session)
  } catch (error: any) {
    console.error("Erro ao obter sessão:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor ao obter sessão." }, { status: 500 })
  }
}
