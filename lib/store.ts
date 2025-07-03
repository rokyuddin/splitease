import { create } from "zustand";
import { supabase } from "./supabase";

export type Participant = {
  id: string;
  group_id: string;
  name: string;
  email?: string;
};

export type Group = {
  id: string;
  name: string;
  description?: string;
  created_at: string;
};

export type Expense = {
  id: string;
  group_id: string;
  title: string;
  amount: number;
  paid_by: string;
  date: string;
  created_at: string;
  splits: ExpenseSplit[];
  payer_name?: string;
};

export type ExpenseSplit = {
  id: string;
  expense_id: string;
  participant_id: string;
  amount: number;
  participant_name?: string;
};

export type Settlement = {
  id: string;
  group_id: string;
  from_participant: string;
  to_participant: string;
  amount: number;
  note?: string;
  settled_at: string;
  from_name?: string;
  to_name?: string;
};

export type Balance = {
  participant_id: string;
  participant_name: string;
  total_paid: number;
  total_owed: number;
  net_balance: number;
};

interface AppState {
  groups: Group[];
  participants: Participant[];
  expenses: Expense[];
  settlements: Settlement[];
  currentGroup: Group | null;
  loading: boolean;

  // Actions
  fetchGroups: () => Promise<void>;
  fetchGroupById: (groupId: string) => Promise<void>;
  createGroup: (name: string, description?: string) => Promise<Group | null>;
  setCurrentGroup: (group: Group) => void;

  fetchParticipants: (groupId: string) => Promise<void>;
  addParticipant: (
    groupId: string,
    name: string,
    email?: string
  ) => Promise<void>;

  fetchExpenses: (groupId: string) => Promise<void>;
  addExpense: (expense: {
    group_id: string;
    title: string;
    amount: number;
    paid_by: string;
    date: string;
    splits: { participant_id: string; amount: number }[];
  }) => Promise<void>;
  updateExpense: (
    expenseId: string,
    updates: {
      title: string;
      amount: number;
      paid_by: string;
      date: string;
      splits: { participant_id: string; amount: number }[];
    }
  ) => Promise<void>;
  deleteExpense: (expenseId: string, groupId: string) => Promise<void>;

  fetchSettlements: (groupId: string) => Promise<void>;
  addSettlement: (settlement: {
    group_id: string;
    from_participant: string;
    to_participant: string;
    amount: number;
    note?: string;
  }) => Promise<void>;

  calculateBalances: (groupId: string) => Balance[];
  updateGroup: (
    groupId: string,
    name: string,
    description?: string
  ) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  groups: [],
  participants: [],
  expenses: [],
  settlements: [],
  currentGroup: null,
  loading: false,

  fetchGroups: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ groups: data || [] });
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      set({ loading: false });
    }
  },
  fetchGroupById: async (groupId: string) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();
      if (error) throw error;
      set({ currentGroup: data });
    } catch (error) {
      console.error("Error fetching group by ID:", error);
    } finally {
      set({ loading: false });
    }
  },

  createGroup: async (name: string, description?: string) => {
    try {
      const { data, error } = await supabase
        .from("groups")
        .insert({ name, description })
        .select()
        .single();

      if (error) throw error;

      const { groups } = get();
      set({ groups: [data, ...groups] });
      return data;
    } catch (error) {
      console.error("Error creating group:", error);
      return null;
    }
  },

  setCurrentGroup: (group: Group) => {
    set({ currentGroup: group });
  },

  fetchParticipants: async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from("participants")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      set({ participants: data || [] });
    } catch (error) {
      console.error("Error fetching participants:", error);
    }
  },

  addParticipant: async (groupId: string, name: string, email?: string) => {
    try {
      const { data, error } = await supabase
        .from("participants")
        .insert({ group_id: groupId, name, email })
        .select()
        .single();

      if (error) throw error;

      const { participants } = get();
      set({ participants: [...participants, data] });
    } catch (error) {
      console.error("Error adding participant:", error);
    }
  },

  fetchExpenses: async (groupId: string) => {
    try {
      const { data: expensesData, error: expensesError } = await supabase
        .from("expenses")
        .select(
          `
          *,
          participants!expenses_paid_by_fkey(name)
        `
        )
        .eq("group_id", groupId)
        .order("date", { ascending: false });

      if (expensesError) throw expensesError;

      const { data: splitsData, error: splitsError } = await supabase
        .from("expense_splits")
        .select(
          `
          *,
          participants(name)
        `
        )
        .in("expense_id", expensesData?.map((e) => e.id) || []);

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

      set({ expenses });
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
  },

  addExpense: async (expense) => {
    try {
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

      const { error: splitsError } = await supabase
        .from("expense_splits")
        .insert(
          expense.splits.map((split) => ({
            expense_id: expenseData.id,
            participant_id: split.participant_id,
            amount: split.amount,
          }))
        );

      if (splitsError) throw splitsError;

      // Refresh expenses
      await get().fetchExpenses(expense.group_id);
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  },

  updateExpense: async (expenseId, updates) => {
    try {
      // Update expense
      const { error: expenseError } = await supabase
        .from("expenses")
        .update({
          title: updates.title,
          amount: updates.amount,
          paid_by: updates.paid_by,
          date: updates.date,
        })
        .eq("id", expenseId);

      if (expenseError) throw expenseError;

      // Delete existing splits
      const { error: deleteSplitsError } = await supabase
        .from("expense_splits")
        .delete()
        .eq("expense_id", expenseId);

      if (deleteSplitsError) throw deleteSplitsError;

      // Insert new splits
      const { error: splitsError } = await supabase
        .from("expense_splits")
        .insert(
          updates.splits.map((split) => ({
            expense_id: expenseId,
            participant_id: split.participant_id,
            amount: split.amount,
          }))
        );

      if (splitsError) throw splitsError;

      // Get the group_id to refresh expenses
      const expense = get().expenses.find((e) => e.id === expenseId);
      if (expense) {
        await get().fetchExpenses(expense.group_id);
      }
    } catch (error) {
      console.error("Error updating expense:", error);
      throw error;
    }
  },

  deleteExpense: async (expenseId, groupId) => {
    try {
      // Delete splits first (due to foreign key constraint)
      const { error: deleteSplitsError } = await supabase
        .from("expense_splits")
        .delete()
        .eq("expense_id", expenseId);

      if (deleteSplitsError) throw deleteSplitsError;

      // Delete expense
      const { error: deleteExpenseError } = await supabase
        .from("expenses")
        .delete()
        .eq("id", expenseId);

      if (deleteExpenseError) throw deleteExpenseError;

      // Refresh expenses
      await get().fetchExpenses(groupId);
    } catch (error) {
      console.error("Error deleting expense:", error);
      throw error;
    }
  },

  fetchSettlements: async (groupId: string) => {
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

      set({ settlements });
    } catch (error) {
      console.error("Error fetching settlements:", error);
    }
  },

  addSettlement: async (settlement) => {
    try {
      const { error } = await supabase.from("settlements").insert(settlement);

      if (error) throw error;

      // Refresh settlements
      await get().fetchSettlements(settlement.group_id);
    } catch (error) {
      console.error("Error adding settlement:", error);
    }
  },

  calculateBalances: (groupId: string) => {
    const { participants, expenses, settlements } = get();
    const groupParticipants = participants.filter(
      (p) => p.group_id === groupId
    );
    const groupExpenses = expenses.filter((e) => e.group_id === groupId);
    const groupSettlements = settlements.filter((s) => s.group_id === groupId);

    const balances: Balance[] = groupParticipants.map((participant) => {
      // Calculate total paid
      const totalPaid = groupExpenses
        .filter((expense) => expense.paid_by === participant.id)
        .reduce((sum, expense) => sum + expense.amount, 0);

      // Calculate total owed (from expense splits)
      const totalOwed = groupExpenses
        .flatMap((expense) => expense.splits)
        .filter((split) => split.participant_id === participant.id)
        .reduce((sum, split) => sum + split.amount, 0);

      // Calculate settlements (money received - money paid in settlements)
      const settlementsReceived = groupSettlements
        .filter((settlement) => settlement.to_participant === participant.id)
        .reduce((sum, settlement) => sum + settlement.amount, 0);

      const settlementsPaid = groupSettlements
        .filter((settlement) => settlement.from_participant === participant.id)
        .reduce((sum, settlement) => sum + settlement.amount, 0);

      const netBalance =
        totalPaid - totalOwed + settlementsReceived - settlementsPaid;

      return {
        participant_id: participant.id,
        participant_name: participant.name,
        total_paid: totalPaid,
        total_owed: totalOwed,
        net_balance: netBalance,
      };
    });

    return balances;
  },
  updateGroup: async (groupId: string, name: string, description?: string) => {
    try {
      const { data, error } = await supabase
        .from("groups")
        .update({ name, description, updated_at: new Date().toISOString() })
        .eq("id", groupId)
        .select()
        .single();

      if (error) throw error;

      // Update the groups array
      const { groups, currentGroup } = get();
      const updatedGroups = groups.map((group) =>
        group.id === groupId ? data : group
      );
      set({ groups: updatedGroups });

      // Update current group if it's the one being edited
      if (currentGroup?.id === groupId) {
        set({ currentGroup: data });
      }
    } catch (error) {
      console.error("Error updating group:", error);
    }
  },
}));
