import { Expense, Participant, Settlement } from "./store";
import { supabase } from "./supabase";

async function fetchGroups() {
  try {
    const { data, error } = await supabase
      .from("groups")
      .select(
        `
        *,
        group_members!inner(user_id)
      `
      )
      .order("created_at", { ascending: false });

    console.log("Group data:", data);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching groups:", error);
    return [];
  }
}

async function fetchGroupById(groupId: string) {
  return await supabase.from("groups").select("*").eq("id", groupId).single();
}

async function createGroup(name: string, description?: string) {
  try {
    const { data, error } = await supabase
      .from("groups")
      .insert({ name, description })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating group:", error);
    return null;
  }
}

async function fetchParticipants(groupId: string): Promise<Participant[]> {
  try {
    const { data, error } = await supabase
      .from("participants")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching participants:", error);
    return [];
  }
}

async function addParticipant(groupId: string, name: string, email?: string) {
  return await supabase
    .from("participants")
    .insert({ group_id: groupId, name, email })
    .select()
    .single();
}

async function fetchExpenses(groupId: string): Promise<Expense[]> {
  try {
    const { data: expensesData, error: expensesError } = await supabase
      .from("expenses")
      .select("*, participants!expenses_paid_by_fkey(name)")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });

    if (expensesError) throw expensesError;

    const { data: splitsData, error: splitsError } = await supabase
      .from("expense_splits")
      .select("*, participants(name)")
      .in(
        "expense_id",
        expensesData.map((exp) => exp.id)
      );

    if (splitsError) throw splitsError;

    const expenses =
      expensesData?.map((expense) => ({
        ...expense,
        payer_name: expense.participants?.name,
        splits:
          splitsData
            ?.filter((split) => split.expense_id === expense.id)
            .map((split) => ({
              ...split,
              participant_name: split.participants?.name,
            })) || [],
      })) || [];

    return expenses;
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return [];
  }
}

async function addExpense(expense: {
  group_id: string;
  title: string;
  amount: number;
  paid_by: string;
  date: string;
  splits: { participant_id: string; amount: number }[];
}) {
  const { data: expenseData, error: expenseError } = await supabase
    .from("expenses")
    .insert({
      group_id: expense.group_id,
      title: expense.title,
      amount: expense.amount,
      paid_by: expense.paid_by,
      date: expense.date,
    })
    .select()
    .single();

  if (expenseError) throw expenseError;

  const { error: splitsError } = await supabase.from("expense_splits").insert(
    expense.splits.map((split) => ({
      expense_id: expenseData.id,
      participant_id: split.participant_id,
      amount: split.amount,
    }))
  );

  if (splitsError) throw splitsError;

  // Refresh expenses
  await fetchExpenses(expense.group_id);
}

async function fetchSettlements(groupId: string): Promise<Settlement[]> {
  try {
    const { data, error } = await supabase
      .from("settlements")
      .select(
        `
            *,
            from_participant:participants!settlements_from_participant_fkey(name),
            to_participant:participants!settlements_to_participant_fkey(name)
          `
      )
      .eq("group_id", groupId)
      .order("settled_at", { ascending: false });

    if (error) throw error;

    const settlements =
      data?.map((settlement) => ({
        ...settlement,
        from_name: settlement.from_participant?.name,
        to_name: settlement.to_participant?.name,
      })) || [];

    return settlements;
  } catch (error) {
    console.error("Error fetching settlements:", error);
    return [];
  }
}

async function addSettlement(settlement: {
  group_id: string;
  from_participant: string;
  to_participant: string;
  amount: number;
  note?: string;
}) {
  const { error } = await supabase.from("settlements").insert(settlement);
  if (error) throw error;
  // Refresh settlements
  await fetchSettlements(settlement.group_id);
}

export {
  fetchGroups,
  fetchGroupById,
  createGroup,
  fetchParticipants,
  addParticipant,
  fetchExpenses,
  addExpense,
  fetchSettlements,
  addSettlement,
};
