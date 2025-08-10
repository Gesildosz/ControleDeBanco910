"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { UserPlus, Users, Clock, KeyRound, CalendarCheck, Megaphone, Printer } from "lucide-react" // Added Printer icon
import { toast } from "@/hooks/use-toast"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select" // Import Select components

interface AdminData {
  id: string
  full_name: string
  can_create_collaborator: boolean
  can_create_admin: boolean
  can_enter_hours: boolean
  can_change_access_code: boolean
}

interface CollaboratorSummary {
  full_name: string
  badge_number: string
  balance: number
}

interface DashboardSummary {
  totalPositiveHours: number
  totalNegativeHours: number
  positiveCollaborators: CollaboratorSummary[]
  negativeCollaborators: CollaboratorSummary[]
}

export default function AdminDashboardPage() {
  const [admin, setAdmin] = useState<AdminData | null>(null)
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null)
  const [announcementText, setAnnouncementText] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false)
  const [selectedLeader, setSelectedLeader] = useState<string>("") // New state for selected leader
  const router = useRouter()

  // Define the list of supervisors (Lider Direto) - copied from collaborators/page.tsx
  const supervisors = ["Osmar Pereira", "Gesildo Silva", "Edvaldo Oliveira", "Raimundo"]

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch session data
        const sessionRes = await fetch("/api/auth/get-session")
        if (!sessionRes.ok) {
          toast({ title: "Erro", description: "Sessão expirada ou inválida. Por favor, faça login novamente." })
          router.push("/login")
          return
        }
        const sessionData = await sessionRes.json()

        if (sessionData.role !== "admin") {
          toast({ title: "Erro", description: "Acesso negado. Você não é um administrador." })
          router.push("/login")
          return
        }

        // Fetch admin specific data
        const adminRes = await fetch(`/api/admin/get-admin-data?id=${sessionData.userId}`)
        if (adminRes.ok) {
          const adminData = await adminRes.json()
          setAdmin(adminData)
        } else {
          const errorData = await adminRes.json()
          toast({ title: "Erro", description: errorData.error || "Falha ao carregar dados do administrador." })
          router.push("/login")
          return
        }

        // Fetch dashboard summary data
        const summaryRes = await fetch("/api/admin/dashboard-summary")
        if (summaryRes.ok) {
          const summaryData = await summaryRes.json()
          setDashboardSummary(summaryData)
        } else {
          const errorData = await summaryRes.json()
          toast({ title: "Erro", description: errorData.error || "Falha ao carregar resumo do dashboard." })
        }

        // Fetch current announcement
        const announcementRes = await fetch("/api/admin/announcement")
        if (announcementRes.ok) {
          const announcementData = await announcementRes.json()
          if (announcementData && announcementData.content) {
            setAnnouncementText(announcementData.content)
          }
        } else {
          const errorData = await announcementRes.json()
          toast({ title: "Erro", description: errorData.error || "Falha ao carregar aviso." })
        }
      } catch (error) {
        console.error("Erro ao carregar dados do painel:", error)
        toast({ title: "Erro", description: "Ocorreu um erro inesperado ao carregar o painel." })
        router.push("/login") // Redirect on unexpected errors
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

  const handleSaveAnnouncement = async () => {
    setIsSavingAnnouncement(true)
    try {
      const response = await fetch("/api/admin/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: announcementText }),
      })

      if (response.ok) {
        toast({ title: "Sucesso", description: "Aviso salvo com sucesso e fixado para colaboradores!" })
      } else {
        const errorData = await response.json()
        toast({ title: "Erro", description: errorData.error || "Falha ao salvar aviso." })
      }
    } catch (error) {
      console.error("Erro ao salvar aviso:", error)
      toast({ title: "Erro", description: "Ocorreu um erro inesperado ao salvar o aviso." })
    } finally {
      setIsSavingAnnouncement(false)
    }
  }

  const handleGenerateLeaderReport = () => {
    if (selectedLeader) {
      router.push(`/admin/reports/leader/${encodeURIComponent(selectedLeader)}`)
    } else {
      toast({ title: "Erro", description: "Por favor, selecione um Líder Direto para gerar o relatório." })
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
        <p>Carregando painel...</p>
      </div>
    )
  }

  if (!admin) {
    return null
  }

  const totalHours = (dashboardSummary?.totalPositiveHours || 0) + (dashboardSummary?.totalNegativeHours || 0)
  const positivePercentage = totalHours > 0 ? (dashboardSummary?.totalPositiveHours || 0) / totalHours : 0
  const negativePercentage = totalHours > 0 ? (dashboardSummary?.totalNegativeHours || 0) / totalHours : 0

  const chartData = [
    {
      name: "Horas Positivas",
      value: dashboardSummary?.totalPositiveHours || 0,
      percentage: positivePercentage * 100,
      color: "#22c55e",
    },
    {
      name: "Horas Negativas",
      value: dashboardSummary?.totalNegativeHours || 0,
      percentage: negativePercentage * 100,
      color: "#ef4444",
    },
  ]

  const netBalance = (dashboardSummary?.totalPositiveHours || 0) - (dashboardSummary?.totalNegativeHours || 0)
  const netBalanceColor = netBalance > 0 ? "text-green-600" : netBalance < 0 ? "text-red-600" : "text-gray-500"

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-100 p-4 dark:bg-gray-950">
      <Card className="w-full max-w-6xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Painel do Administrador</CardTitle>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Sair
          </Button>
        </CardHeader>
        <CardContent className="space-y-8">
          <p className="text-lg">Bem-vindo, {admin.full_name}!</p>

          {/* Quick Access Links */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {admin.can_create_collaborator && (
              <Link href="/admin/collaborators" className="block">
                <Card className="flex flex-col items-center justify-center p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <UserPlus className="h-10 w-10 text-primary mb-3" />
                  <h3 className="text-lg font-semibold">Cadastrar Colaboradores</h3>
                  <p className="text-sm text-muted-foreground">Adicionar novos colaboradores ao sistema.</p>
                </Card>
              </Link>
            )}
            {admin.can_create_admin && (
              <Link href="/admin/administrators" className="block">
                <Card className="flex flex-col items-center justify-center p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <Users className="h-10 w-10 text-primary mb-3" />
                  <h3 className="text-lg font-semibold">Cadastrar Administradores</h3>
                  <p className="text-sm text-muted-foreground">Gerenciar contas de administradores.</p>
                </Card>
              </Link>
            )}
            {admin.can_enter_hours && (
              <Link href="/admin/time-entry" className="block">
                <Card className="flex flex-col items-center justify-center p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <Clock className="h-10 w-10 text-primary mb-3" />
                  <h3 className="text-lg font-semibold">Lançamento de Horas</h3>
                  <p className="text-sm text-muted-foreground">Atualizar o banco de horas dos colaboradores.</p>
                </Card>
              </Link>
            )}
            {admin.can_change_access_code && (
              <Link href="/admin/change-access-code" className="block">
                <Card className="flex flex-col items-center justify-center p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <KeyRound className="h-10 w-10 text-primary mb-3" />
                  <h3 className="text-lg font-semibold">Alterar Código de Acesso</h3>
                  <p className="text-sm text-muted-foreground">Modificar códigos de acesso de colaboradores.</p>
                </Card>
              </Link>
            )}
            {admin.can_enter_hours && ( // Assuming admins who can enter hours can manage leave requests
              <Link href="/admin/leave-requests" className="block">
                <Card className="flex flex-col items-center justify-center p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <CalendarCheck className="h-10 w-10 text-primary mb-3" />
                  <h3 className="text-lg font-semibold">Gerenciar Solicitações de Folga</h3>
                  <p className="text-sm text-muted-foreground">Aprovar ou rejeitar pedidos de folga.</p>
                </Card>
              </Link>
            )}
          </div>

          <Separator />

          {/* Announcement Area */}
          {admin.can_enter_hours && ( // Assuming admins who can enter hours can manage announcements
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-6 w-6" /> Gerenciar Aviso para Colaboradores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="announcement-text">Aviso Fixo para o Painel do Colaborador</Label>
                  <Textarea
                    id="announcement-text"
                    placeholder="Digite o aviso que deseja fixar para os colaboradores..."
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button onClick={handleSaveAnnouncement} disabled={isSavingAnnouncement}>
                  {isSavingAnnouncement ? "Salvando..." : "Salvar Aviso"}
                </Button>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Report by Leader Section */}
          {admin.can_enter_hours && ( // Assuming admins who can enter hours can generate reports
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Printer className="h-6 w-6" /> Gerar Relatório por Líder Direto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="leader-select">Selecione o Líder Direto</Label>
                  <Select value={selectedLeader} onValueChange={setSelectedLeader}>
                    <SelectTrigger id="leader-select">
                      <SelectValue placeholder="Selecione um Líder" />
                    </SelectTrigger>
                    <SelectContent>
                      {supervisors.map((leader) => (
                        <SelectItem key={leader} value={leader}>
                          {leader}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleGenerateLeaderReport} disabled={!selectedLeader}>
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Overview and Chart Section */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Resumo Geral do Banco de Horas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg">
                  Total de Horas Positivas:{" "}
                  <span className="font-bold text-green-600">
                    {dashboardSummary?.totalPositiveHours.toFixed(2) || "0.00"}
                  </span>{" "}
                  horas
                </p>
                <p className="text-lg">
                  Total de Horas Negativas:{" "}
                  <span className="font-bold text-red-600">
                    {dashboardSummary?.totalNegativeHours.toFixed(2) || "0.00"}
                  </span>{" "}
                  horas
                </p>
                <div className="flex items-center justify-center">
                  <div className="text-4xl font-bold">
                    Saldo Líquido: <span className={netBalanceColor}>{netBalance.toFixed(2)}</span> horas
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Horas</CardTitle>
              </CardHeader>
              <CardContent className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={120} />
                    <Tooltip
                      formatter={(value: number, name: string, props: any) => [`${value.toFixed(2)} horas`, name]}
                    />
                    <Bar dataKey="value" barSize={50}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                      <LabelList
                        dataKey="percentage"
                        position="right"
                        formatter={(value: number) => `${value.toFixed(1)}%`}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Collaborator Tables */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Colaboradores com Saldo Positivo</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardSummary?.positiveCollaborators && dashboardSummary.positiveCollaborators.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Crachá</TableHead>
                          <TableHead className="text-right">Saldo (horas)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dashboardSummary.positiveCollaborators.map((collab) => (
                          <TableRow key={collab.badge_number}>
                            <TableCell>{collab.full_name}</TableCell>
                            <TableCell>{collab.badge_number}</TableCell>
                            <TableCell className="text-right text-green-600">{collab.balance.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhum colaborador com saldo positivo.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Colaboradores com Saldo Negativo</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardSummary?.negativeCollaborators && dashboardSummary.negativeCollaborators.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Crachá</TableHead>
                          <TableHead className="text-right">Saldo (horas)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dashboardSummary.negativeCollaborators.map((collab) => (
                          <TableRow key={collab.badge_number}>
                            <TableCell>{collab.full_name}</TableCell>
                            <TableCell>{collab.badge_number}</TableCell>
                            <TableCell className="text-right text-red-600">{collab.balance.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhum colaborador com saldo negativo.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
