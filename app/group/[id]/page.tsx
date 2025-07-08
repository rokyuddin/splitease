"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Expense, useStore } from "@/lib/store";
import { AddExpenseModal } from "@/components/add-expense-modal";
import { AddParticipantModal } from "@/components/add-participant-modal";
import { SettleUpModal } from "@/components/settle-up-modal";
import { EditExpenseModal } from "@/components/edit-expense-modal";
import { ExportModal } from "@/components/export/export-modal";
import { GroupChat } from "@/components/chat/group-chat";
import { NotificationCenter } from "@/components/notifications/notification-center";
import {
  ArrowLeft,
  Users,
  Receipt,
  DollarSign,
  MoreVertical,
  Edit,
  Trash2,
  MessageCircle,
  Plus,
  TrendingUp,
  EllipsisVertical,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { EditGroupModal } from "@/components/edit-group-modal";

export default function GroupPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const {
    currentGroup,
    participants,
    expenses,
    settlements,
    setCurrentGroup,
    fetchGroups,
    fetchGroupById,
    fetchParticipants,
    fetchExpenses,
    fetchSettlements,
    calculateBalances,
  } = useStore();
  const [loading, setLoading] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [showSettleUp, setShowSettleUp] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  useEffect(() => {
    const loadGroupData = async () => {
      await fetchGroups();
      await fetchParticipants(groupId);
      await fetchExpenses(groupId);
      await fetchSettlements(groupId);
    };

    loadGroupData();
  }, [
    groupId,
    fetchGroups,
    fetchParticipants,
    fetchExpenses,
    fetchSettlements,
  ]);

  useEffect(() => {
    if (currentGroup?.id !== groupId) {
      setLoading(true);
      fetchGroupById(groupId)
        .then((group) => {
          if (group) {
            setCurrentGroup(group);
          }
        })
        .catch((error) => {
          console.error("Error fetching group by ID:", error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [groupId, currentGroup, setCurrentGroup]);

  const balances = calculateBalances(groupId);
  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (!currentGroup) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Group not found</h2>
          <Button onClick={() => router.push("/")} variant="outline">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="bg-white shadow-sm border container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.push("/")} size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {currentGroup.name}
                </h1>
                {currentGroup.description && (
                  <p className="text-gray-600 mt-1">
                    {currentGroup.description}
                  </p>
                )}
              </div>
              <Button variant="outline" onClick={() => setShowEditGroup(true)}>
                <Edit />
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <NotificationCenter />
            <ExportModal groupId={groupId} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChat(!showChat)}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <EllipsisVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowAddExpense(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowAddParticipant(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Participant
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowSettleUp(true)}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Settle Up
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8">
        <div className="flex gap-6">
          {/* Main Content */}
          <div className={`flex-1 ${showChat ? "lg:w-2/3" : "w-full"}`}>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Expenses
                  </CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ৳{totalExpenses.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Participants
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {participants.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Active members
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Settlements
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{settlements.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Completed payments
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="expenses" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
                <TabsTrigger value="balances">Balances</TabsTrigger>
                <TabsTrigger value="settlements">Settlements</TabsTrigger>
              </TabsList>

              {/* Expenses Tab */}
              <TabsContent value="expenses" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Recent Expenses</h2>
                  <Button onClick={() => setShowAddExpense(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Expense
                  </Button>
                </div>

                <div className="space-y-4">
                  {expenses.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Receipt className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No expenses yet
                        </h3>
                        <p className="text-gray-600 text-center mb-4">
                          Start by adding your first expense to track shared
                          costs
                        </p>
                        <Button onClick={() => setShowAddExpense(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Expense
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    expenses.map((expense) => (
                      <Card key={expense.id}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-lg">
                                  {expense.title}
                                </h3>
                                <div className="flex items-center space-x-2">
                                  <span className="text-2xl font-bold text-green-600">
                                    ৳{expense.amount.toFixed(2)}
                                  </span>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() =>
                                          setEditingExpense(expense)
                                        }
                                      >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          setDeletingExpense(expense)
                                        }
                                        className="text-red-600"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-sm text-gray-600">
                                <span>Paid by {expense.payer_name}</span>
                                <span>
                                  {formatDistanceToNow(new Date(expense.date), {
                                    addSuffix: true,
                                  })}
                                </span>
                              </div>
                              <div className="mt-3">
                                <p className="text-sm text-gray-600 mb-2">
                                  Split between:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {expense.splits.map((split) => (
                                    <Badge key={split.id} variant="secondary">
                                      {split.participant_name}: ৳
                                      {split.amount.toFixed(2)}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Balances Tab */}
              <TabsContent value="balances" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Current Balances</h2>
                  <div className="space-x-2">
                    <AddParticipantModal
                      groupId={groupId}
                      open={showAddParticipant}
                      setOpen={setShowAddParticipant}
                    />
                    <SettleUpModal
                      groupId={groupId}
                      balances={balances}
                      participants={participants}
                      open={showSettleUp}
                      setOpen={setShowSettleUp}
                    />
                  </div>
                </div>

                <div className="grid gap-4">
                  {balances.map((balance) => (
                    <Card key={balance.participant_id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {balance.participant_name}
                            </h3>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>
                                Total paid: ৳{balance.total_paid.toFixed(2)}
                              </p>
                              <p>
                                Total owed: ৳{balance.total_owed.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`text-2xl font-bold ${
                                balance.net_balance > 0
                                  ? "text-green-600"
                                  : balance.net_balance < 0
                                  ? "text-red-600"
                                  : "text-gray-600"
                              }`}
                            >
                              {balance.net_balance > 0 ? "+" : ""}৳
                              {balance.net_balance.toFixed(2)}
                            </div>
                            <p className="text-sm text-gray-600">
                              {balance.net_balance > 0
                                ? "Gets back"
                                : balance.net_balance < 0
                                ? "Owes"
                                : "Settled"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Settlements Tab */}
              <TabsContent value="settlements" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Settlement History</h2>
                  <SettleUpModal
                    groupId={groupId}
                    balances={balances}
                    participants={participants}
                    open={showSettleUp}
                    setOpen={setShowSettleUp}
                  />
                </div>

                <div className="space-y-4">
                  {settlements.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <DollarSign className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No settlements yet
                        </h3>
                        <p className="text-gray-600 text-center mb-4">
                          Settlements will appear here when members pay each
                          other back
                        </p>
                        <SettleUpModal
                          groupId={groupId}
                          balances={balances}
                          participants={participants}
                          open={showSettleUp}
                          setOpen={setShowSettleUp}
                        />
                      </CardContent>
                    </Card>
                  ) : (
                    settlements.map((settlement) => (
                      <Card key={settlement.id}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">
                                {settlement.from_name} paid {settlement.to_name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {formatDistanceToNow(
                                  new Date(settlement.settled_at),
                                  { addSuffix: true }
                                )}
                              </p>
                              {settlement.note && (
                                <p className="text-sm text-gray-600 mt-1">
                                  Note: {settlement.note}
                                </p>
                              )}
                            </div>
                            <div className="text-2xl font-bold text-green-600">
                              ৳{settlement.amount.toFixed(2)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Chat Sidebar */}
          {showChat && (
            <div className="w-full lg:w-1/3">
              <Card className="h-[600px]">
                <GroupChat groupId={groupId} />
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddParticipantModal
        open={showAddParticipant}
        setOpen={setShowAddParticipant}
        groupId={groupId}
      />
      <AddExpenseModal
        open={showAddExpense}
        setOpen={setShowAddExpense}
        groupId={groupId}
        participants={participants}
      />
      <SettleUpModal
        open={showSettleUp}
        setOpen={setShowSettleUp}
        groupId={groupId}
        participants={participants}
        balances={balances}
      />
      <EditGroupModal
        open={showEditGroup}
        setOpen={setShowEditGroup}
        group={currentGroup}
      />

      <EditExpenseModal
        expense={editingExpense}
        participants={participants}
        open={editingExpense !== null}
        setOpen={() => setEditingExpense(null)}
      />

      {/* {deletingExpense && (
        <DeleteExpenseModal
          expense={deletingExpense}
          groupId={groupId}
          onClose={() => setDeletingExpense(null)}
        />
      )} */}
    </>
  );
}
