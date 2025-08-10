"use client"

import type React from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react" // Import the icon

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { createClientSideSupabase } from "@/lib/supabase-client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface Collaborator {
  id: string
  full_name: string
  badge_number: string
  position: string
  balance: number
  balance_type: string
}

export default function TimeEntryPage() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState<string | null>(null)
  const [hoursToChange, setHoursToChange] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const supabase = createClientSideSupabase()
  const router = useRouter()

  useEffect(() => {
    fetchCollaborators()
  }, [])

  const fetchCollaborators = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("collaborators")
      .select("id, full_name, badge_number, position, balance, balance_type")
      .order("full_name", { ascending: true })
    if (error) {
      toast({ title: "Erro", description: "Falha ao carregar colaboradores." })
      console.error("Error fetching collaborators:", error)
    } else {
      setCollaborators(data || [])
    }
    setLoading(false)
  }

  const selectedCollaborator = collaborators.find((collab) => collab.id === selectedCollaboratorId)

  const handleTimeEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCollaboratorId || !hoursToChange) {
      toast({ title: "Erro", description: "Selecione um colaborador e insira as horas." })
      return
    }

    const hours = Number.parseFloat(hoursToChange)
    if (isNaN(hours) || hours === 0) {
      toast({ title: "Erro", description: "Insira um valor numérico válido para as horas (diferente de zero)." })
      return
    }

    const response = await fetch("/api/admin/time-entry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        collaboratorId: selectedCollaboratorId,
        hoursChange: hours,
        description,
      }),
    })

    if (response.ok) {
      toast({ title: "Sucesso", description: "Banco de horas atualizado com sucesso!" })
      setHoursToChange("")
      setDescription("")
      setSelectedCollaboratorId(null) // Reset selection
      fetchCollaborators() // Re-fetch to update balances in the list
    } else {
      const errorData = await response.json()
      toast({ title: "Erro", description: errorData.error || "Falha ao atualizar banco de horas." })
      console.error("Error updating time entry:", errorData)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-100 p-4 dark:bg-gray-950">
      <Card className="w-full max-w-3xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Lançamento de Horas</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleTimeEntry} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="collaborator-select">Colaborador</Label>
              <Select value={selectedCollaboratorId || ""} onValueChange={setSelectedCollaboratorId}>
                <SelectTrigger id="collaborator-select">
                  <SelectValue placeholder="Selecione um colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {collaborators.map((collab) => (
                    <SelectItem key={collab.id} value={collab.id}>
                      {collab.badge_number} / {collab.full_name} / {collab.position} / Saldo:{" "}
                      {collab.balance.toFixed(2)} (
                      {collab.balance_type === "positive" ? "+" : collab.balance_type === "negative" ? "-" : ""})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCollaborator && (
              <div className="space-y-2">
                <Label htmlFor="hours-to-change">Horas a Lançar (Ex: 8 para positivo, -4 para negativo)</Label>
                <Input
                  id="hours-to-change"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 8 ou -4.5"
                  value={hoursToChange}
                  onChange={(e) => setHoursToChange(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Observação (Opcional)</Label>
              <Textarea
                id="description"
                placeholder="Descreva o motivo do lançamento de horas..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={!selectedCollaboratorId || !hoursToChange || loading}>
              Confirmar Lançamento
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
