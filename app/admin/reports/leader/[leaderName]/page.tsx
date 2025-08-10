"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"
import { ArrowLeft, Printer } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface TimeEntry {
  date: string
  hours_change: number
  new_balance: number
  entry_type: string
  description: string | null
}

interface CollaboratorReportData {
  id: string
  full_name: string
  badge_number: string
  position: string
  balance: number
  balance_type: string
  history: TimeEntry[]
}

interface LeaderReportData {
  leaderName: string
  totalPositiveHoursLeader: number
  totalNegativeHoursLeader: number
  collaborators: CollaboratorReportData[]
}

export default function LeaderReportPage({ params }: { params: { leaderName: string } }) {
  const [reportData, setReportData] = useState<LeaderReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const leaderName = decodeURIComponent(params.leaderName)

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/admin/reports/leader/${encodeURIComponent(leaderName)}`)
        if (response.ok) {
          const data = await response.json()
          setReportData(data)
        } else {
          const errorData = await response.json()
          toast({ title: "Erro", description: errorData.error || "Falha ao carregar relatório." })
          if (response.status === 401 || response.status === 403) {
            router.push("/login")
          }
        }
      } catch (error) {
        console.error("Erro ao carregar relatório:", error)
        toast({ title: "Erro", description: "Ocorreu um erro inesperado ao carregar o relatório." })
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [leaderName, router])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
        <p>Carregando relatório...</p>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="flex min-h-screen flex-col items-center bg-gray-100 p-4 dark:bg-gray-950">
        <Card className="w-full max-w-5xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl">Relatório por Líder Direto</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Painel
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Não foi possível carregar os dados do relatório.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const netBalanceLeader = reportData.totalPositiveHoursLeader - reportData.totalNegativeHoursLeader
  const netBalanceLeaderColor =
    netBalanceLeader > 0 ? "text-green-600" : netBalanceLeader < 0 ? "text-red-600" : "text-gray-500"

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-100 p-4 dark:bg-gray-950 print:bg-white">
      <Card className="w-full max-w-5xl print:shadow-none print:border-none">
        <CardHeader className="flex flex-row items-center justify-between print:hidden">
          <CardTitle className="text-2xl">Relatório por Líder Direto</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Painel
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6 print:p-0">
          <div className="text-center print:text-left print:mb-4">
            <h1 className="text-3xl font-bold print:text-2xl">Relatório de Banco de Horas</h1>
            <h2 className="text-xl font-semibold text-primary print:text-lg">Líder Direto: {reportData.leaderName}</h2>
            <p className="text-sm text-muted-foreground print:text-xs">
              Gerado em: {format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}
            </p>
          </div>

          <Separator className="print:hidden" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center print:grid-cols-3 print:gap-2 print:text-sm">
            <div className="p-4 border rounded-lg print:border print:rounded-md">
              <p className="text-sm text-muted-foreground">Total Horas Positivas</p>
              <p className="text-2xl font-bold text-green-600 print:text-lg">
                {reportData.totalPositiveHoursLeader.toFixed(2)}
              </p>
            </div>
            <div className="p-4 border rounded-lg print:border print:rounded-md">
              <p className="text-sm text-muted-foreground">Total Horas Negativas</p>
              <p className="text-2xl font-bold text-red-600 print:text-lg">
                {reportData.totalNegativeHoursLeader.toFixed(2)}
              </p>
            </div>
            <div className="p-4 border rounded-lg print:border print:rounded-md">
              <p className="text-sm text-muted-foreground">Saldo Líquido</p>
              <p className={`text-2xl font-bold ${netBalanceLeaderColor} print:text-lg`}>
                {netBalanceLeader.toFixed(2)}
              </p>
            </div>
          </div>

          <Separator className="print:hidden" />

          <h3 className="text-xl font-semibold mt-6 mb-4 print:text-lg">Colaboradores sob {reportData.leaderName}</h3>
          {reportData.collaborators.length === 0 ? (
            <p className="text-muted-foreground">Nenhum colaborador encontrado sob este líder.</p>
          ) : (
            <div className="space-y-6">
              {reportData.collaborators.map((collab) => (
                <Card key={collab.id} className="print:border print:shadow-none">
                  <CardHeader>
                    <CardTitle className="text-lg print:text-base">
                      {collab.full_name} (Crachá: {collab.badge_number})
                    </CardTitle>
                    <p className="text-sm text-muted-foreground print:text-xs">Cargo: {collab.position}</p>
                    <p
                      className={`text-md font-semibold ${collab.balance > 0 ? "text-green-600" : collab.balance < 0 ? "text-red-600" : "text-gray-500"} print:text-sm`}
                    >
                      Saldo Atual: {collab.balance.toFixed(2)} horas
                    </p>
                  </CardHeader>
                  <CardContent>
                    <h4 className="text-md font-semibold mb-2 print:text-sm">Histórico de Lançamentos:</h4>
                    {collab.history.length === 0 ? (
                      <p className="text-muted-foreground text-sm print:text-xs">
                        Nenhum lançamento de horas para este colaborador.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table className="w-full text-sm print:text-xs">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[120px]">Data</TableHead>
                              <TableHead>Mudança (horas)</TableHead>
                              <TableHead>Novo Saldo</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Descrição</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {collab.history.map((entry, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  {format(new Date(entry.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                </TableCell>
                                <TableCell className={entry.hours_change >= 0 ? "text-green-600" : "text-red-600"}>
                                  {entry.hours_change.toFixed(2)}
                                </TableCell>
                                <TableCell className={entry.new_balance >= 0 ? "text-green-600" : "text-red-600"}>
                                  {entry.new_balance.toFixed(2)}
                                </TableCell>
                                <TableCell>{entry.entry_type}</TableCell>
                                <TableCell className="max-w-[150px] truncate">{entry.description || "-"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
