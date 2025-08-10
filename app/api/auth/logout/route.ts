import { NextResponse } from "next/server"
import { deleteSession } from "@/lib/session"

export async function POST() {
  try {
    await deleteSession()
    return NextResponse.json({ message: "Logout bem-sucedido." })
  } catch (error: any) {
    console.error("Erro ao fazer logout:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}
