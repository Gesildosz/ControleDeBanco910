"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { createClientSideSupabase } from "@/lib/supabase-client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch" // Import Switch component

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface Collaborator {
  id: string
  full_name: string
  badge_number: string
  position: string
  shift: string
  supervisor: string
  access_code: string
  balance: number
  balance_type: string
  is_active: boolean // Added is_active field
}

export default function ManageCollaboratorsPage() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [loading, setLoading] = useState(true)
  const [newCollaborator, setNewCollaborator] = useState({
    full_name: "",
    badge_number: "",
    position: "",
    shift: "",
    supervisor: "",
    access_code: "",
    is_active: true, // Default to active
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null)
  const supabase = createClientSideSupabase()
  const router = useRouter()

  // Define the list of positions
  const positions = [
    "Operador Empilhadeiras",
    "Operador Transpaleteira",
    "Auxiliar",
    "Conferente",
    "Controlador",
    "J.Aprendiz",
    "Analista",
    "Assistente",
    "Lider",
  ]

  // Define the list of supervisors
  const supervisors = ["Osmar Pereira", "Gesildo Silva", "Edvaldo Oliveira", "Raimundo"]

  useEffect(() => {
    fetchCollaborators()
  }, [])

  const fetchCollaborators = async () => {
    setLoading(true)
    const { data, error } = await supabase.from("collaborators").select("*").order("full_name", { ascending: true })
    if (error) {
      toast({ title: "Erro", description: "Falha ao carregar colaboradores." })
      console.error("Error fetching collaborators:", error)
    } else {
      setCollaborators(data || [])
    }
    setLoading(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setNewCollaborator((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (value: string, field: string) => {
    setNewCollaborator((prev) => ({ ...prev, [field]: value }))
  }

  const handleSwitchChange = (checked: boolean, field: keyof typeof newCollaborator) => {
    setNewCollaborator((prev) => ({ ...prev, [field]: checked }))
  }

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setEditingCollaborator((prev) => (prev ? { ...prev, [id]: value } : null))
  }

  const handleEditSelectChange = (value: string, field: string) => {
    setEditingCollaborator((prev) => (prev ? { ...prev, [field]: value } : null))
  }

  const handleEditSwitchChange = (checked: boolean, field: keyof Collaborator) => {
    setEditingCollaborator((prev) => (prev ? { ...prev, [field]: checked } : null))
  }

  const validateAccessCode = (code: string) => {
    return code.length >= 6 && code.length <= 10 && /^\d+$/.test(code)
  }

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateAccessCode(newCollaborator.access_code)) {
      toast({ title: "Erro", description: "O ID de acesso deve ter entre 6 e 10 dígitos numéricos." })
      return
    }

    const response = await fetch("/api/admin/collaborators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCollaborator),
    })

    if (response.ok) {
      toast({ title: "Sucesso", description: "Colaborador adicionado com sucesso!" })
      setNewCollaborator({
        full_name: "",
        badge_number: "",
        position: "",
        shift: "",
        supervisor: "",
        access_code: "",
        is_active: true,
      })
      setIsDialogOpen(false)
      fetchCollaborators()
    } else {
      const errorData = await response.json()
      toast({ title: "Erro", description: errorData.error || "Falha ao adicionar colaborador." })
      console.error("Error adding collaborator:", errorData)
    }
  }

  const handleUpdateCollaborator = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCollaborator) return

    if (!validateAccessCode(editingCollaborator.access_code)) {
      toast({ title: "Erro", description: "O ID de acesso deve ter entre 6 e 10 dígitos numéricos." })
      return
    }

    const { id, ...updates } = editingCollaborator
    const response = await fetch(`/api/admin/collaborators/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })

    if (response.ok) {
      toast({ title: "Sucesso", description: "Colaborador atualizado com sucesso!" })
      setEditingCollaborator(null)
      setIsDialogOpen(false) // Close dialog after update
      fetchCollaborators()
    } else {
      const errorData = await response.json()
      toast({ title: "Erro", description: errorData.error || "Falha ao atualizar colaborador." })
      console.error("Error updating collaborator:", errorData)
    }
  }

  const handleDeleteCollaborator = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este colaborador?")) return
    const response = await fetch(`/api/admin/collaborators/${id}`, { method: "DELETE" })
    if (response.ok) {
      toast({ title: "Sucesso", description: "Colaborador excluído com sucesso!" })
      fetchCollaborators()
    } else {
      const errorData = await response.json()
      toast({ title: "Erro", description: errorData.error || "Falha ao excluir colaborador." })
      console.error("Error deleting collaborator:", errorData)
    }
  }

  const handleToggleActiveStatus = async (collab: Collaborator) => {
    const newStatus = !collab.is_active
    const response = await fetch(`/api/admin/collaborators/${collab.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: newStatus }),
    })

    if (response.ok) {
      toast({
        title: "Sucesso",
        description: `Colaborador ${collab.full_name} ${newStatus ? "ativado" : "desativado"} com sucesso!`,
      })
      fetchCollaborators() // Re-fetch to update the list
    } else {
      const errorData = await response.json()
      toast({ title: "Erro", description: errorData.error || "Falha ao atualizar status do colaborador." })
      console.error("Error toggling active status:", errorData)
    }
  }

  const openEditDialog = (collaborator: Collaborator) => {
    setEditingCollaborator(collaborator)
    setIsDialogOpen(true)
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-100 p-4 dark:bg-gray-950">
      <Card className="w-full max-w-5xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Gerenciar Colaboradores</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
            <Button
              onClick={() => {
                setNewCollaborator({
                  full_name: "",
                  badge_number: "",
                  position: "",
                  shift: "",
                  supervisor: "",
                  access_code: "",
                  is_active: true, // Default to active when adding new
                })
                setEditingCollaborator(null)
                setIsDialogOpen(true)
              }}
            >
              Adicionar Novo Colaborador
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Carregando colaboradores...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome Completo</TableHead>
                    <TableHead>Crachá</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Turno</TableHead>
                    <TableHead>Lider Direto</TableHead>
                    <TableHead>ID de Acesso</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Status</TableHead> {/* New column for status */}
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collaborators.map((collab) => (
                    <TableRow key={collab.id}>
                      <TableCell>{collab.full_name}</TableCell>
                      <TableCell>{collab.badge_number}</TableCell>
                      <TableCell>{collab.position}</TableCell>
                      <TableCell>{collab.shift}</TableCell>
                      <TableCell>{collab.supervisor}</TableCell>
                      <TableCell>{collab.access_code}</TableCell>
                      <TableCell
                        className={collab.balance > 0 ? "text-green-600" : collab.balance < 0 ? "text-red-600" : ""}
                      >
                        {collab.balance.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={collab.is_active}
                          onCheckedChange={() => handleToggleActiveStatus(collab)}
                          aria-label={`Toggle active status for ${collab.full_name}`}
                        />
                        <span className="ml-2 text-sm">{collab.is_active ? "Ativo" : "Inativo"}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="mr-2 bg-transparent"
                          onClick={() => openEditDialog(collab)}
                        >
                          Editar
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteCollaborator(collab.id)}>
                          Excluir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingCollaborator ? "Editar Colaborador" : "Adicionar Novo Colaborador"}</DialogTitle>
            <DialogDescription>
              {editingCollaborator
                ? "Faça alterações nos detalhes do colaborador aqui."
                : "Preencha os detalhes para adicionar um novo colaborador."}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={editingCollaborator ? handleUpdateCollaborator : handleAddCollaborator}
            className="grid gap-4 py-4"
          >
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="full_name" className="text-right">
                Nome Completo
              </Label>
              <Input
                id="full_name"
                value={editingCollaborator?.full_name || newCollaborator.full_name}
                onChange={editingCollaborator ? handleEditInputChange : handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="badge_number" className="text-right">
                N° Crachá
              </Label>
              <Input
                id="badge_number"
                value={editingCollaborator?.badge_number || newCollaborator.badge_number}
                onChange={editingCollaborator ? handleEditInputChange : handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="position" className="text-right">
                Cargo
              </Label>
              <Select
                value={editingCollaborator?.position || newCollaborator.position}
                onValueChange={(value) =>
                  editingCollaborator
                    ? handleEditSelectChange(value, "position")
                    : handleSelectChange(value, "position")
                }
                required
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o Cargo" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((pos) => (
                    <SelectItem key={pos} value={pos}>
                      {pos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="shift" className="text-right">
                Turno
              </Label>
              <Select
                value={editingCollaborator?.shift || newCollaborator.shift}
                onValueChange={(value) =>
                  editingCollaborator ? handleEditSelectChange(value, "shift") : handleSelectChange(value, "shift")
                }
                required
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o Turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manhã">Manhã</SelectItem>
                  <SelectItem value="Tarde">Tarde</SelectItem>
                  <SelectItem value="Noite">Noite</SelectItem>
                  <SelectItem value="Integral">Integral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="supervisor" className="text-right">
                Lider Direto
              </Label>
              <Select
                value={editingCollaborator?.supervisor || newCollaborator.supervisor}
                onValueChange={(value) =>
                  editingCollaborator
                    ? handleEditSelectChange(value, "supervisor")
                    : handleSelectChange(value, "supervisor")
                }
                required
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o Supervisor" />
                </SelectTrigger>
                <SelectContent>
                  {supervisors.map((sup) => (
                    <SelectItem key={sup} value={sup}>
                      {sup}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="access_code" className="text-right">
                ID de Acesso
              </Label>
              <Input
                id="access_code"
                value={editingCollaborator?.access_code || newCollaborator.access_code}
                onChange={editingCollaborator ? handleEditInputChange : handleInputChange}
                className="col-span-3"
                required
                minLength={6}
                maxLength={10}
                pattern="\d+"
                title="Deve conter entre 6 e 10 dígitos numéricos."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_active" className="text-right">
                Status Ativo
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={editingCollaborator?.is_active ?? newCollaborator.is_active}
                  onCheckedChange={(checked) =>
                    editingCollaborator
                      ? handleEditSwitchChange(checked as boolean, "is_active")
                      : handleSwitchChange(checked as boolean, "is_active")
                  }
                />
                <Label htmlFor="is_active">
                  {(editingCollaborator?.is_active ?? newCollaborator.is_active) ? "Ativo" : "Inativo"}
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">{editingCollaborator ? "Salvar Alterações" : "Adicionar Colaborador"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
