"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"

interface CollaboratorData {
  id: string
  full_name: string
  badge_number: string
  position: string
  shift: string
  supervisor: string
  balance: number
  balance_type: string
  is_active: boolean // Added is_active
}

interface LeaveRequest {
  id: string
  request_date: string
  hours_requested: number
  reason: string | null
  status: "pending" | "approved" | "rejected"
  admin_notes: string | null
  created_at: string
}

export default function CollaboratorDashboardPage() {
  const [collaborator, setCollaborator] = useState<CollaboratorData | null>(null)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [announcement, setAnnouncement] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [requestDate, setRequestDate] = useState("")
  const [hoursRequested, setHoursRequested] = useState("")
  const [reason, setReason] = useState("")
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch collaborator data
        const collabRes = await fetch("/api/collaborator-data") // New API route to get collaborator data
        if (!collabRes.ok) {
          toast({ title: "Erro", description: "Sessão expirada ou inválida. Por favor, faça login novamente." })
          router.push("/login")
          return
        }
        const collabData = await collabRes.json()
        setCollaborator(collabData)

        // If collaborator is inactive, show message and prevent further loading
        if (!collabData.is_active) {
          toast({ title: "Acesso Negado", description: "Sua conta está inativa. Por favor, contate o administrador." })
          setLoading(false)
          return
        }

        // Fetch leave requests
        const leaveRes = await fetch("/api/collaborator/leave-requests")
        if (leaveRes.ok) {
          const leaveData = await leaveRes.json()
          setLeaveRequests(leaveData.requests)
        } else {
          const errorData = await leaveRes.json()
          toast({ title: "Erro", description: errorData.error || "Falha ao carregar solicitações de folga." })
        }

        // Fetch active announcement
        const announcementRes = await fetch("/api/collaborator/announcement")
        if (announcementRes.ok) {
          const announcementData = await announcementRes.json()
          if (announcementData && announcementData.content) {
            setAnnouncement(announcementData.content)
          }
        } else {
          const errorData = await announcementRes.json()
          toast({ title: "Erro", description: errorData.error || "Falha ao carregar aviso." })
        }
      } catch (error) {
        console.error("Erro ao carregar dados do colaborador:", error)
        toast({ title: "Erro", description: "Ocorreu um erro inesperado ao carregar o painel." })
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleLogout = async () => {
    const response = await fetch("/api/auth/logout", { method: "POST" })
    if (response.ok) {
      router.push("/login")
    } else {
      toast({ title: "Erro", description: "Falha ao fazer logout." })
    }
  }

  const handleLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!collaborator) {
      toast({ title: "Erro", description: "Dados do colaborador não carregados." })
      return
    }

    // Prevent requesting leave if inactive
    if (!collaborator.is_active) {
      toast({ title: "Erro", description: "Sua conta está inativa e não pode solicitar folgas." })
      return
    }

    const requestedHoursNum = Number.parseFloat(hoursRequested)
    if (isNaN(requestedHoursNum) || requestedHoursNum <= 0) {
      toast({ title: "Erro", description: "Por favor, insira um número válido de horas para a folga." })
      return
    }

    if (collaborator.balance < 3) {
      toast({
        title: "Erro",
        description: "Você precisa ter um saldo positivo de pelo menos 3 horas para solicitar uma folga.",
      })
      return
    }

    const response = await fetch("/api/collaborator/leave-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestDate,
        hoursRequested: requestedHoursNum,
        reason,
      }),
    })

    if (response.ok) {
      toast({ title: "Sucesso", description: "Solicitação de folga enviada com sucesso!" })
      setRequestDate("")
      setHoursRequested("")
      setReason("")
      // Re-fetch leave requests to update the list
      const leaveRes = await fetch("/api/collaborator/leave-requests")
      if (leaveRes.ok) {
        const leaveData = await leaveRes.json()
        setLeaveRequests(leaveData.requests)
      }
    } else {
      const errorData = await response.json()
      toast({ title: "Erro", description: errorData.error || "Falha ao enviar solicitação de folga." })
      console.error("Error sending leave request:", errorData)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
        <p>Carregando painel...</p>
      </div>
    )
  }

  if (!collaborator) {
    return null // Should redirect to login if data is not loaded
  }

  // Display message if collaborator is inactive
  if (!collaborator.is_active) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 dark:bg-gray-950">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-red-600">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg">Sua conta está inativa.</p>
            <p className="text-muted-foreground">Por favor, contate o administrador para mais informações.</p>
            <Button onClick={handleLogout}>Voltar para o Login</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const now = new Date()

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-100 p-4 dark:bg-gray-950">
      <Card className="w-full max-w-3xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Painel do Colaborador</CardTitle>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Sair
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dashboard">Painel</TabsTrigger>
              <TabsTrigger value="schedule">Escala</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-4 space-y-6">
              {announcement && (
                <div className="bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500 p-4 text-blue-700 dark:text-blue-300 mb-4 rounded-md shadow-sm">
                  <p className="font-semibold">Aviso:</p>
                  <p>{announcement}</p>
                </div>
              )}

              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Meu Banco de Horas</h2>
                <p className="text-sm text-muted-foreground">
                  Data: {format(now, "dd/MM/yyyy", { locale: ptBR })} | Hora:{" "}
                  {format(now, "HH:mm:ss", { locale: ptBR })}
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Informações do Colaborador</h3>
                  <p>
                    <span className="font-semibold">Nome Completo:</span> {collaborator.full_name}
                  </p>
                  <p>
                    <span className="font-semibold">Crachá:</span> {collaborator.badge_number}
                  </p>
                  <p>
                    <span className="font-semibold">Cargo:</span> {collaborator.position}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Detalhes das Horas</h3>
                  {collaborator.balance_type === "positive" && (
                    <p className="text-green-600 dark:text-green-400">
                      <span className="font-semibold">Saldo Positivo:</span> {collaborator.balance.toFixed(2)} horas
                    </p>
                  )}
                  {collaborator.balance_type === "negative" && (
                    <p className="text-red-600 dark:text-red-400">
                      <span className="font-semibold">Saldo Negativo:</span> {Math.abs(collaborator.balance).toFixed(2)}{" "}
                      horas
                    </p>
                  )}
                  {collaborator.balance_type === "none" && (
                    <p className="text-muted-foreground">
                      <span className="font-semibold">Saldo:</span> 0.00 horas
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button asChild>
                  <Link href="/collaborator/history">
                    Histórico <span className="ml-2">➡️</span>
                  </Link>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="mt-4 space-y-6">
              <h2 className="text-xl font-semibold">Solicitar / Agendar Folga</h2>
              <p className="text-sm text-muted-foreground">
                Seu saldo atual:{" "}
                <span className={collaborator.balance > 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                  {collaborator.balance.toFixed(2)} horas
                </span>
              </p>
              {collaborator.balance < 3 && (
                <p className="text-red-500 text-sm">
                  Você precisa ter um saldo positivo de pelo menos 3 horas para solicitar uma folga.
                </p>
              )}

              <form onSubmit={handleLeaveRequest} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="request-date">Data da Folga</Label>
                  <Input
                    id="request-date"
                    type="date"
                    value={requestDate}
                    onChange={(e) => setRequestDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hours-requested">Horas de Folga (Ex: 8 para um dia inteiro)</Label>
                  <Input
                    id="hours-requested"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 8"
                    value={hoursRequested}
                    onChange={(e) => setHoursRequested(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Motivo da Folga (Opcional)</Label>
                  <Textarea
                    id="reason"
                    placeholder="Descreva o motivo da sua solicitação..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={collaborator.balance < 3 || !requestDate || !hoursRequested}
                >
                  Enviar Solicitação
                </Button>
              </form>

              <Separator />

              <h3 className="text-lg font-semibold">Minhas Solicitações de Folga</h3>
              {leaveRequests.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma solicitação de folga encontrada.</p>
              ) : (
                <div className="grid gap-2">
                  {leaveRequests.map((request) => (
                    <div key={request.id} className="rounded-md border p-3">
                      <p className="text-sm font-medium">
                        Data: {format(new Date(request.request_date), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                      <p className="text-sm">Horas Solicitadas: {request.hours_requested.toFixed(2)}</p>
                      <p className="text-sm">
                        Status:{" "}
                        <span
                          className={
                            request.status === "approved"
                              ? "text-green-600"
                              : request.status === "rejected"
                                ? "text-red-600"
                                : "text-yellow-600"
                          }
                        >
                          {request.status === "pending"
                            ? "Pendente"
                            : request.status === "approved"
                              ? "Aprovada"
                              : "Rejeitada"}
                        </span>
                      </p>
                      {request.reason && <p className="text-xs text-muted-foreground">Motivo: {request.reason}</p>}
                      {request.admin_notes && (
                        <p className="text-xs text-muted-foreground">Notas do Admin: {request.admin_notes}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Enviado em: {format(new Date(request.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
