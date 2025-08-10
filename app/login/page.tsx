"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [collaboratorAccessCode, setCollaboratorAccessCode] = useState("")
  const [adminUsername, setAdminUsername] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleCollaboratorLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch("/api/auth/collaborator-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode: collaboratorAccessCode }),
      })

      if (response.ok) {
        toast({ title: "Sucesso", description: "Login do colaborador bem-sucedido!" })
        router.push("/collaborator")
      } else {
        const errorData = await response.json()
        toast({ title: "Erro", description: errorData.error || "Código de acesso inválido." })
      }
    } catch (error) {
      console.error("Erro ao fazer login do colaborador:", error)
      toast({ title: "Erro", description: "Ocorreu um erro inesperado." })
    } finally {
      setLoading(false)
    }
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: adminUsername, password: adminPassword }),
      })

      if (response.ok) {
        toast({ title: "Sucesso", description: "Login do administrador bem-sucedido!" })
        router.push("/admin")
      } else {
        const errorData = await response.json()
        toast({ title: "Erro", description: errorData.error || "Usuário ou senha inválidos." })
      }
    } catch (error) {
      console.error("Erro ao fazer login do administrador:", error)
      toast({ title: "Erro", description: "Ocorreu um erro inesperado." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Gerenciamento de Banco de Horas</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="collaborator" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="collaborator">Colaborador</TabsTrigger>
              <TabsTrigger value="admin">Administrador</TabsTrigger>
            </TabsList>
            <TabsContent value="collaborator" className="mt-4">
              <form onSubmit={handleCollaboratorLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="access-code">Código de Acesso</Label>
                  <Input
                    id="access-code"
                    type="text"
                    placeholder="Digite seu código de acesso"
                    required
                    value={collaboratorAccessCode}
                    onChange={(e) => setCollaboratorAccessCode(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar como Colaborador"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="admin" className="mt-4">
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Usuário</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Digite seu usuário"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite sua senha"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar como Administrador"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
