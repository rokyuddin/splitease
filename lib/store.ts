import { create } from "zustand";
import { supabase } from "./supabase";

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  created_by?: string;
}

export interface Participant {
  id: string;
  name: string;
  email?: string;
  group_id: string;
  created_at: string;
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  participant_id: string;
  participant_name: string;
  amount: number;
}

export interface Expense {
  id: string;
  group_id: string;
  title: string;
  amount: number;
  paid_by: string;
  payer_name: string;
  date: string;
  created_at: string;
  splits: ExpenseSplit[];
}

export interface Settlement {
  id: string;
  group_id: string;
  from_participant: string;
  to_participant: string;
  from_name: string;
  to_name: string;
  amount: number;
  note?: string;
  settled_at: string;
}

export interface Message {
  id: string;
  group_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  group_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface Balance {
  participant_id: string;
  participant_name: string;
  total_paid: number;
  total_owed: number;
  net_balance: number;
}

interface StoreState {
  // Auth State
  user: User | null;
  loading: boolean;

  // App State
  groups: Group[];
  currentGroup: Group | null;
  participants: Participant[];
  expenses: Expense[];
  settlements: Settlement[];
  messages: Message[];
  notifications: Notification[];

  // Auth Actions
  checkAuth: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;

  // Group Actions
  setCurrentGroup: (group: Group) => void;
  fetchGroups: () => Promise<void>;
  fetchGroupById: (groupId: string) => Promise<Group | null>;
  createGroup: (name: string, description?: string) => Promise<Group>;
  updateGroup: (
    id: string,
    updates: { name?: string; description?: string }
  ) => Promise<void>;

  // Participant Actions
  fetchParticipants: (groupId: string) => Promise<void>;
  addParticipant: (
    groupId: string,
    name: string,
    email?: string
  ) => Promise<void>;

  // Expense Actions
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

  // Settlement Actions
  fetchSettlements: (groupId: string) => Promise<void>;
  addSettlement: (settlement: {
    group_id: string;
    from_participant: string;
    to_participant: string;
    amount: number;
    note?: string;
  }) => Promise<void>;

  // Chat Actions
  fetchMessages: (groupId: string) => Promise<void>;
  sendMessage: (groupId: string, content: string) => Promise<void>;

  // Notification Actions
  fetchNotifications: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  dismissNotification: (notificationId: string) => Promise<void>;

  // Utility Actions
  calculateBalances: (groupId: string) => Balance[];
}

export const useStore = create<StoreState>((set, get) => ({
  // Initial state
  user: null,
  loading: true,
  groups: [],
  currentGroup: null,
  participants: [],
  expenses: [],
  settlements: [],
  messages: [],
  notifications: [],

  // Auth Actions
  checkAuth: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          set({ user: profile, loading: false });
        }
      } else {
        set({ user: null, loading: false });
      }
    } catch (error) {
      console.error("Auth check error:", error);
      set({ user: null, loading: false });
    }
  },

  signInWithGoogle: async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}`,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;
      set({
        user: null,
        groups: [],
        currentGroup: null,
        participants: [],
        expenses: [],
        settlements: [],
        messages: [],
        notifications: [],
      });
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  },

  // Group Actions
  setCurrentGroup: (group) => set({ currentGroup: group }),

  fetchGroups: async () => {
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
      if (error) throw error;
      set({ groups: data || [] });
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  },

  fetchGroupById: async (groupId) => {
    try {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();

      if (error) throw error;
      return data as Group;
    } catch (error) {
      console.error("Error fetching group by ID:", error);
      return null;
    }
  },

  createGroup: async (name, description) => {
    try {
      const { user } = get();
      if (!user) throw new Error("User not authenticated");

      const { data: group, error: groupError } = await supabase
        .from("groups")
        .insert([{ name, description, created_by: user.id }])
        .select()
        .single();

      if (groupError) throw groupError;

      // Add user as admin member
      const { error: memberError } = await supabase
        .from("group_members")
        .insert([{ group_id: group.id, user_id: user.id, role: "admin" }]);

      if (memberError) throw memberError;

      const newGroup = group as Group;
      set((state) => ({ groups: [newGroup, ...state.groups] }));
      return newGroup;
    } catch (error) {
      console.error("Error creating group:", error);
      throw error;
    }
  },
  // createGroup: async (name, description) => {
  //   try {
  //     const { data, error } = await supabase
  //       .from("groups")
  //       .insert([{ name, description }])
  //       .select()
  //       .single();

  //     if (error) throw error;

  //     const newGroup = data as Group;
  //     set((state) => ({ groups: [newGroup, ...state.groups] }));
  //     return newGroup;
  //   } catch (error) {
  //     console.error("Error creating group:", error);
  //     throw error;
  //   }
  // },
  // createGroup: async (name: string, description?: string) => {
  //   try {
  //     // Get current user
  //     const {
  //       data: { user },
  //     } = await supabase.auth.getUser();
  //     if (!user) throw new Error("User not authenticated");

  //     const { data, error } = await supabase
  //       .from("groups")
  //       .insert({ name, description, created_by: user.id })
  //       .select()
  //       .single();

  //     if (error) throw error;

  //     const { groups } = get();
  //     set({ groups: [data, ...groups] });
  //     return data;
  //   } catch (error) {
  //     console.error("Error creating group:", error);
  //     return null;
  //   }
  // },

  updateGroup: async (id, updates) => {
    try {
      const { error } = await supabase
        .from("groups")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      set((state) => ({
        groups: state.groups.map((group) =>
          group.id === id ? { ...group, ...updates } : group
        ),
        currentGroup:
          state.currentGroup?.id === id
            ? { ...state.currentGroup, ...updates }
            : state.currentGroup,
      }));
    } catch (error) {
      console.error("Error updating group:", error);
      throw error;
    }
  },

  // Participant Actions
  fetchParticipants: async (groupId) => {
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

  addParticipant: async (groupId, name, email) => {
    try {
      const { data, error } = await supabase
        .from("participants")
        .insert([{ group_id: groupId, name, email }])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        participants: [...state.participants, data as Participant],
      }));
    } catch (error) {
      console.error("Error adding participant:", error);
      throw error;
    }
  },

  // Expense Actions
  fetchExpenses: async (groupId) => {
    try {
      const { data: expensesData, error: expensesError } = await supabase
        .from("expenses")
        .select(
          `
          *,
          payer:participants!expenses_paid_by_fkey(name)
        `
        )
        .eq("group_id", groupId)
        .order("date", { ascending: false });

      if (expensesError) throw expensesError;

      const expensesWithSplits = await Promise.all(
        (expensesData || []).map(async (expense) => {
          const { data: splitsData, error: splitsError } = await supabase
            .from("expense_splits")
            .select(
              `
              *,
              participant:participants(name)
            `
            )
            .eq("expense_id", expense.id);

          if (splitsError) throw splitsError;

          return {
            ...expense,
            payer_name: expense.payer?.name || "Unknown",
            splits: (splitsData || []).map((split) => ({
              ...split,
              participant_name: split.participant?.name || "Unknown",
            })),
          };
        })
      );

      set({ expenses: expensesWithSplits as Expense[] });
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
  },

  addExpense: async (expense) => {
    try {
      const { data: expenseData, error: expenseError } = await supabase
        .from("expenses")
        .insert([
          {
            group_id: expense.group_id,
            title: expense.title,
            amount: expense.amount,
            paid_by: expense.paid_by,
            date: expense.date,
          },
        ])
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

      // Create notification for expense added
      const { currentGroup } = get();
      if (currentGroup) {
        const { data: groupMembers } = await supabase
          .from("group_members")
          .select("user_id")
          .eq("group_id", expense.group_id);

        if (groupMembers) {
          const notifications = groupMembers.map((member) => ({
            user_id: member.user_id,
            group_id: expense.group_id,
            type: "expense_added",
            title: "New Expense Added",
            message: `${expense.title} - ৳${expense.amount} added to ${currentGroup.name}`,
          }));

          await supabase.from("notifications").insert(notifications);
        }
      }

      await get().fetchExpenses(expense.group_id);
    } catch (error) {
      console.error("Error adding expense:", error);
      throw error;
    }
  },

  updateExpense: async (expenseId, updates) => {
    try {
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

      const { error: deleteSplitsError } = await supabase
        .from("expense_splits")
        .delete()
        .eq("expense_id", expenseId);

      if (deleteSplitsError) throw deleteSplitsError;

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
      const { error: deleteSplitsError } = await supabase
        .from("expense_splits")
        .delete()
        .eq("expense_id", expenseId);

      if (deleteSplitsError) throw deleteSplitsError;

      const { error: deleteExpenseError } = await supabase
        .from("expenses")
        .delete()
        .eq("id", expenseId);

      if (deleteExpenseError) throw deleteExpenseError;

      await get().fetchExpenses(groupId);
    } catch (error) {
      console.error("Error deleting expense:", error);
      throw error;
    }
  },

  // Settlement Actions
  fetchSettlements: async (groupId) => {
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

      const settlementsWithNames = (data || []).map((settlement) => ({
        ...settlement,
        from_name: settlement.from_participant?.name || "Unknown",
        to_name: settlement.to_participant?.name || "Unknown",
      }));

      set({ settlements: settlementsWithNames as Settlement[] });
    } catch (error) {
      console.error("Error fetching settlements:", error);
    }
  },

  addSettlement: async (settlement) => {
    try {
      const { error } = await supabase.from("settlements").insert([settlement]);

      if (error) throw error;

      await get().fetchSettlements(settlement.group_id);
    } catch (error) {
      console.error("Error adding settlement:", error);
      throw error;
    }
  },

  // Chat Actions
  fetchMessages: async (groupId) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          *,
          user_profiles(full_name, avatar_url)
        `
        )
        .eq("group_id", groupId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const messagesWithUserInfo = (data || []).map((message) => ({
        ...message,
        user_name: message.user_profiles?.full_name || "Unknown User",
        user_avatar: message.user_profiles?.avatar_url,
      }));

      set({ messages: messagesWithUserInfo as Message[] });
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  },

  sendMessage: async (groupId, content) => {
    try {
      const { user } = get();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from("messages").insert([
        {
          group_id: groupId,
          user_id: user.id,
          content,
        },
      ]);

      if (error) throw error;

      await get().fetchMessages(groupId);
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  // Notification Actions
  fetchNotifications: async () => {
    try {
      const { user } = get();
      if (!user) return;

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      set({ notifications: data || [] });
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  },

  markNotificationAsRead: async (notificationId) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

      if (error) throw error;

      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
      }));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  },

  dismissNotification: async (notificationId) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) throw error;

      set((state) => ({
        notifications: state.notifications.filter(
          (n) => n.id !== notificationId
        ),
      }));
    } catch (error) {
      console.error("Error dismissing notification:", error);
    }
  },

  // Utility Actions
  calculateBalances: (groupId) => {
    const { participants, expenses, settlements } = get();
    const groupParticipants = participants.filter(
      (p) => p.group_id === groupId
    );
    const groupExpenses = expenses.filter((e) => e.group_id === groupId);
    const groupSettlements = settlements.filter((s) => s.group_id === groupId);

    return groupParticipants.map((participant) => {
      const totalPaid = groupExpenses
        .filter((expense) => expense.paid_by === participant.id)
        .reduce((sum, expense) => sum + expense.amount, 0);

      const totalOwed = groupExpenses
        .flatMap((expense) => expense.splits)
        .filter((split) => split.participant_id === participant.id)
        .reduce((sum, split) => sum + split.amount, 0);

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
  },
}));
