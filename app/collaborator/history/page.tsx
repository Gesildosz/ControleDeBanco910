"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { toast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface TimeEntry {
  id: string
  date: string
  hours_change: number
  new_balance: number
  entry_type: string
  description: string | null
}

export default function CollaboratorHistoryPage() {
  const [history, setHistory] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchHistory = async () => {
      const response = await fetch("/api/collaborator-history")
      if (response.ok) {
        const data = await response.json()
        setHistory(
          data.history.map((entry: TimeEntry) => ({
            ...entry,
            date: format(new Date(entry.date), "dd/MM/yyyy HH:mm", { locale: ptBR }),
          })),
        )
      } else {
        const errorData = await response.json()
        toast({ title: "Erro", description: errorData.error || "Falha ao carregar histórico." })
        // If unauthorized, redirect to login
        if (response.status === 401) {
          router.push("/login")
        }
      }
      setLoading(false)
    }

    fetchHistory()
  }, [router])

  const handleLogout = async () => {
    const response = await fetch("/api/auth/logout", { method: "POST" })
    if (response.ok) {
      router.push("/login")
    } else {
      toast({ title: "Erro", description: "Falha ao fazer logout." })
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
        <p>Carregando histórico...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-100 p-4 dark:bg-gray-950">
      <Card className="w-full max-w-4xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Histórico do Banco de Horas</CardTitle>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Sair / Logoff
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={history}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="new_balance" stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Detalhes das Atualizações</h3>
            {history.length === 0 ? (
              <p className="text-muted-foreground">Nenhum histórico de horas encontrado.</p>
            ) : (
              <div className="grid gap-2">
                {history.map((entry) => (
                  <div key={entry.id} className="rounded-md border p-3">
                    <p className="text-sm font-medium">{entry.date}</p>
                    <p className="text-sm">
                      Mudança:{" "}
                      <span className={entry.hours_change >= 0 ? "text-green-600" : "text-red-600"}>
                        {entry.hours_change.toFixed(2)}
                      </span>{" "}
                      horas
                    </p>
                    <p className="text-sm">
                      Novo Saldo:{" "}
                      <span className={entry.new_balance >= 0 ? "text-green-600" : "text-red-600"}>
                        {entry.new_balance.toFixed(2)}
                      </span>{" "}
                      horas
                    </p>
                    {entry.description && <p className="text-xs text-muted-foreground">Obs: {entry.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
