"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useStore, type Expense } from "@/lib/store"
import {
  ArrowLeft,
  Plus,
  Receipt,
  Users,
  Calculator,
  DollarSign,
  Edit,
  MoreVertical,
  Trash2,
  Download,
  LogOut,
} from "lucide-react"
import { AddExpenseModal } from "@/components/add-expense-modal"
import { SettleUpModal } from "@/components/settle-up-modal"
import { AddParticipantModal } from "@/components/add-participant-modal"
import { EditGroupModal } from "@/components/edit-group-modal"
import { EditExpenseModal } from "@/components/edit-expense-modal"
import { DeleteExpenseDialog } from "@/components/delete-expense-dialog"
import { ExportModal } from "@/components/export/export-modal"
import { GroupChat } from "@/components/chat/group-chat"
import { NotificationCenter } from "@/components/notifications/notification-center"

export default function GroupDashboard({ params }: { params: { id: string } }) {
  const router = useRouter()
  const {
    user,
    currentGroup,
    participants,
    expenses,
    settlements,
    fetchParticipants,
    fetchExpenses,
    fetchSettlements,
    calculateBalances,
    groups,
    signOut,
  } = useStore()

  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showSettleUp, setShowSettleUp] = useState(false)
  const [showAddParticipant, setShowAddParticipant] = useState(false)
  const [showEditGroup, setShowEditGroup] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null)

  useEffect(() => {
    const group = groups.find((g) => g.id === params.id)
    if (group) {
      useStore.getState().setCurrentGroup(group)
      fetchParticipants(params.id)
      fetchExpenses(params.id)
      fetchSettlements(params.id)
    }
  }, [params.id, groups, fetchParticipants, fetchExpenses, fetchSettlements])

  if (!currentGroup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  const balances = calculateBalances(params.id)
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
  }

  const handleDeleteExpense = (expense: Expense) => {
    setDeletingExpense(expense)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => router.push("/")} className="mr-4">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-gray-900">{currentGroup.name}</h1>
                <Button variant="ghost" size="sm" onClick={() => setShowEditGroup(true)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              {currentGroup.description && <p className="text-gray-600">{currentGroup.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <Button variant="outline" onClick={() => setShowExport(true)}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={() => setShowAddExpense(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
            <Button variant="outline" onClick={() => setShowAddParticipant(true)}>
              <Users className="mr-2 h-4 w-4" />
              Add Participant
            </Button>
            <Button variant="outline" onClick={() => setShowSettleUp(true)}>
              <Calculator className="mr-2 h-4 w-4" />
              Settle Up
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar_url || "/placeholder.svg"} alt={user?.full_name} />
                    <AvatarFallback>{user?.full_name ? getInitials(user.full_name) : "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">৳{totalExpenses.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Participants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{participants.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expenses.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <Tabs defaultValue="expenses" className="space-y-4">
              <TabsList>
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
                <TabsTrigger value="balances">Balances</TabsTrigger>
                <TabsTrigger value="participants">Participants</TabsTrigger>
                <TabsTrigger value="settlements">Settlements</TabsTrigger>
              </TabsList>

              {/* Expenses Tab */}
              <TabsContent value="expenses" className="space-y-4">
                {expenses.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Receipt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-4">No expenses yet</p>
                      <Button onClick={() => setShowAddExpense(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add First Expense
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  expenses.map((expense) => (
                    <Card key={expense.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{expense.title}</CardTitle>
                            <CardDescription>
                              Paid by {expense.payer_name} on {new Date(expense.date).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-lg font-semibold">
                              ৳{expense.amount.toFixed(2)}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                                  <MoreVertical className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleEditExpense(expense)} className="cursor-pointer">
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Expense
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteExpense(expense)}
                                  className="text-destructive focus:text-destructive cursor-pointer"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Expense
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Split between:</p>
                          <div className="flex flex-wrap gap-2">
                            {expense.splits.map((split) => (
                              <Badge key={split.id} variant="outline">
                                {split.participant_name}: ৳{split.amount.toFixed(2)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Balances Tab */}
              <TabsContent value="balances" className="space-y-4">
                {balances.map((balance) => (
                  <Card key={balance.participant_id}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">{balance.participant_name}</CardTitle>
                        <Badge
                          variant={balance.net_balance >= 0 ? "default" : "destructive"}
                          className="text-lg font-semibold"
                        >
                          {balance.net_balance >= 0 ? "+" : ""}৳{balance.net_balance.toFixed(2)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Total Paid</p>
                          <p className="font-semibold">৳{balance.total_paid.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total Owed</p>
                          <p className="font-semibold">৳{balance.total_owed.toFixed(2)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Participants Tab */}
              <TabsContent value="participants" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Group Members</h3>
                  <Button onClick={() => setShowAddParticipant(true)} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Participant
                  </Button>
                </div>

                {participants.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-4">No participants yet</p>
                      <Button onClick={() => setShowAddParticipant(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add First Participant
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {participants.map((participant) => {
                      const balance = balances.find((b) => b.participant_id === participant.id)
                      return (
                        <Card key={participant.id}>
                          <CardHeader>
                            <div className="flex justify-between items-center">
                              <div>
                                <CardTitle className="text-lg">{participant.name}</CardTitle>
                                {participant.email && <CardDescription>{participant.email}</CardDescription>}
                              </div>
                              {balance && (
                                <Badge
                                  variant={balance.net_balance >= 0 ? "default" : "destructive"}
                                  className="text-sm font-semibold"
                                >
                                  {balance.net_balance >= 0 ? "+" : ""}৳{balance.net_balance.toFixed(2)}
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          {balance && (
                            <CardContent>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-600">Total Paid</p>
                                  <p className="font-semibold">৳{balance.total_paid.toFixed(2)}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Total Owed</p>
                                  <p className="font-semibold">৳{balance.total_owed.toFixed(2)}</p>
                                </div>
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      )
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Settlements Tab */}
              <TabsContent value="settlements" className="space-y-4">
                {settlements.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Calculator className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-4">No settlements yet</p>
                      <Button onClick={() => setShowSettleUp(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Settlement
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  settlements.map((settlement) => (
                    <Card key={settlement.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">
                              {settlement.from_name} → {settlement.to_name}
                            </CardTitle>
                            <CardDescription>{new Date(settlement.settled_at).toLocaleDateString()}</CardDescription>
                          </div>
                          <Badge variant="secondary" className="text-lg font-semibold">
                            ৳{settlement.amount.toFixed(2)}
                          </Badge>
                        </div>
                      </CardHeader>
                      {settlement.note && (
                        <CardContent>
                          <p className="text-sm text-gray-600">{settlement.note}</p>
                        </CardContent>
                      )}
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Group Chat */}
          <div className="lg:col-span-1">
            <GroupChat groupId={params.id} />
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddExpenseModal
        open={showAddExpense}
        onOpenChange={setShowAddExpense}
        groupId={params.id}
        participants={participants}
      />

      <SettleUpModal
        open={showSettleUp}
        onOpenChange={setShowSettleUp}
        groupId={params.id}
        participants={participants}
        balances={balances}
      />

      <AddParticipantModal open={showAddParticipant} onOpenChange={setShowAddParticipant} groupId={params.id} />

      <EditGroupModal open={showEditGroup} onOpenChange={setShowEditGroup} group={currentGroup} />

      <ExportModal open={showExport} onOpenChange={setShowExport} groupId={params.id} />

      {editingExpense && (
        <EditExpenseModal
          open={!!editingExpense}
          onOpenChange={(open) => !open && setEditingExpense(null)}
          expense={editingExpense}
          participants={participants}
        />
      )}

      {deletingExpense && (
        <DeleteExpenseDialog
          open={!!deletingExpense}
          onOpenChange={(open) => !open && setDeletingExpense(null)}
          expense={deletingExpense}
        />
      )}
    </div>
  )
}
