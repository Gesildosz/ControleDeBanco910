import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

const secretKey = process.env.SESSION_SECRET
if (!secretKey) {
  throw new Error("SESSION_SECRET environment variable is not set.")
}
const encodedKey = new TextEncoder().encode(secretKey)

export async function encrypt(payload: any) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h") // Session expires in 2 hours
    .sign(encodedKey)
}

export async function decrypt(session: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    })
    return payload
  } catch (error) {
    console.log("Failed to verify session:", error)
    return null
  }
}

export async function createSession(userId: string, role: "collaborator" | "admin") {
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours
  const session = await encrypt({ userId, role, expiresAt })

  cookies().set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  })
}

export async function deleteSession() {
  cookies().delete("session")
}

export async function getSession() {
  const session = cookies().get("session")?.value
  if (!session) return null
  return await decrypt(session)
}

// Middleware for authentication and authorization
export async function middleware(request: NextRequest) {
  // Temporariamente, apenas permita todas as requisições passarem
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
}
