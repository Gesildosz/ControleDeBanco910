"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface LeaveRequest {
  id: string
  collaborator_id: string
  request_date: string
  hours_requested: number
  reason: string | null
  status: "pending" | "approved" | "rejected"
  admin_notes: string | null
  created_at: string
  // Joined collaborator data
  collaborators: {
    full_name: string
    badge_number: string
    supervisor: string
    balance: number
    balance_type: string
  } | null
}

export default function ManageLeaveRequestsPage() {
  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const supabase = createClientSideSupabase()
  const router = useRouter()

  useEffect(() => {
    fetchPendingRequests()
  }, [])

  const fetchPendingRequests = async () => {
    setLoading(true)
    const response = await fetch("/api/admin/leave-requests")
    if (response.ok) {
      const data = await response.json()
      setPendingRequests(data.requests)
    } else {
      const errorData = await response.json()
      toast({ title: "Erro", description: errorData.error || "Falha ao carregar solicitações de folga." })
      console.error("Error fetching leave requests:", errorData)
      if (response.status === 401 || response.status === 403) {
        router.push("/login")
      }
    }
    setLoading(false)
  }

  const handleApproveReject = async (status: "approved" | "rejected") => {
    if (!selectedRequest) return

    const response = await fetch(`/api/admin/leave-requests/${selectedRequest.id}/approve-reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNotes }),
    })

    if (response.ok) {
      toast({
        title: "Sucesso",
        description: `Solicitação de folga ${status === "approved" ? "aprovada" : "rejeitada"} com sucesso!`,
      })
      setIsDialogOpen(false)
      setAdminNotes("")
      setSelectedRequest(null)
      fetchPendingRequests() // Re-fetch to update the list
    } else {
      const errorData = await response.json()
      toast({ title: "Erro", description: errorData.error || "Falha ao processar solicitação." })
      console.error("Error processing leave request:", errorData)
    }
  }

  const openDialog = (request: LeaveRequest) => {
    setSelectedRequest(request)
    setAdminNotes(request.admin_notes || "")
    setIsDialogOpen(true)
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-100 p-4 dark:bg-gray-950">
      <Card className="w-full max-w-5xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Gerenciar Solicitações de Folga</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Carregando solicitações...</p>
          ) : pendingRequests.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma solicitação de folga pendente.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Crachá</TableHead>
                    <TableHead>Supervisor</TableHead>
                    <TableHead>Data da Folga</TableHead>
                    <TableHead>Horas</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.collaborators?.full_name || "N/A"}</TableCell>
                      <TableCell>{request.collaborators?.badge_number || "N/A"}</TableCell>
                      <TableCell>{request.collaborators?.supervisor || "N/A"}</TableCell>
                      <TableCell>{format(new Date(request.request_date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                      <TableCell>{request.hours_requested.toFixed(2)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{request.reason || "-"}</TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => openDialog(request)}>
                          Ver Detalhes
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
            <DialogTitle>Detalhes da Solicitação de Folga</DialogTitle>
            <DialogDescription>Revise e decida sobre a solicitação de folga.</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="grid gap-4 py-4">
              <p>
                <span className="font-semibold">Colaborador:</span> {selectedRequest.collaborators?.full_name} (
                {selectedRequest.collaborators?.badge_number})
              </p>
              <p>
                <span className="font-semibold">Supervisor:</span> {selectedRequest.collaborators?.supervisor}
              </p>
              <p>
                <span className="font-semibold">Data da Folga:</span>{" "}
                {format(new Date(selectedRequest.request_date), "dd/MM/yyyy", { locale: ptBR })}
              </p>
              <p>
                <span className="font-semibold">Horas Solicitadas:</span> {selectedRequest.hours_requested.toFixed(2)}
              </p>
              <p>
                <span className="font-semibold">Saldo Atual do Colaborador:</span>{" "}
                <span
                  className={
                    selectedRequest.collaborators?.balance && selectedRequest.collaborators.balance > 0
                      ? "text-green-600"
                      : selectedRequest.collaborators?.balance && selectedRequest.collaborators.balance < 0
                        ? "text-red-600"
                        : ""
                  }
                >
                  {selectedRequest.collaborators?.balance?.toFixed(2) || "0.00"} horas
                </span>
              </p>
              <p>
                <span className="font-semibold">Motivo:</span> {selectedRequest.reason || "Não informado"}
              </p>
              <div className="space-y-2">
                <Label htmlFor="admin-notes">Notas do Administrador (Opcional)</Label>
                <Textarea
                  id="admin-notes"
                  placeholder="Adicione notas sobre a aprovação/rejeição..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="destructive" onClick={() => handleApproveReject("rejected")}>
              Rejeitar
            </Button>
            <Button onClick={() => handleApproveReject("approved")}>Aprovar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
