"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useStore, type Participant, type Balance } from "@/lib/store";

interface SettleUpModalProps {
  groupId: string;
  participants: Participant[];
  balances: Balance[];
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function SettleUpModal({
  groupId,
  participants,
  balances,
  open,
  setOpen,
}: SettleUpModalProps) {
  const { addSettlement } = useStore();

  const [fromParticipant, setFromParticipant] = useState("");
  const [toParticipant, setToParticipant] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  // Get participants who owe money (negative balance)
  const debtors = balances.filter((b) => b.net_balance < 0);
  // Get participants who are owed money (positive balance)
  const creditors = balances.filter((b) => b.net_balance > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromParticipant || !toParticipant || !amount) return;

    setLoading(true);
    try {
      await addSettlement({
        group_id: groupId,
        from_participant: fromParticipant,
        to_participant: toParticipant,
        amount: Number.parseFloat(amount),
        note: note.trim() || undefined,
      });

      // Reset form
      setFromParticipant("");
      setToParticipant("");
      setAmount("");
      setNote("");
      setOpen(false);
    } catch (error) {
      console.error("Error adding settlement:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settle Up</DialogTitle>
          <DialogDescription>
            Record a payment between group members
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="fromParticipant">From (Who Paid)</Label>
            <Select
              value={fromParticipant}
              onValueChange={setFromParticipant}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select who paid" />
              </SelectTrigger>
              <SelectContent>
                {participants.map((participant) => {
                  const balance = balances.find(
                    (b) => b.participant_id === participant.id
                  );
                  return (
                    <SelectItem key={participant.id} value={participant.id}>
                      {participant.name}
                      {balance && (
                        <span className="text-sm text-gray-500 ml-2">
                          (Balance: {balance.net_balance >= 0 ? "+" : ""}৳
                          {balance.net_balance.toFixed(2)})
                        </span>
                      )}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="toParticipant">To (Who Received)</Label>
            <Select
              value={toParticipant}
              onValueChange={setToParticipant}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select who received" />
              </SelectTrigger>
              <SelectContent>
                {participants
                  .filter((p) => p.id !== fromParticipant)
                  .map((participant) => {
                    const balance = balances.find(
                      (b) => b.participant_id === participant.id
                    );
                    return (
                      <SelectItem key={participant.id} value={participant.id}>
                        {participant.name}
                        {balance && (
                          <span className="text-sm text-gray-500 ml-2">
                            (Balance: {balance.net_balance >= 0 ? "+" : ""}৳
                            {balance.net_balance.toFixed(2)})
                          </span>
                        )}
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="amount">Amount (৳)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <Label htmlFor="note">Note (Optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Paid via bKash, Cash payment"
              rows={3}
            />
          </div>

          {/* Suggested Settlements */}
          {debtors.length > 0 && creditors.length > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-2">
                Suggested Settlements:
              </p>
              <div className="space-y-1">
                {debtors.slice(0, 3).map((debtor) => {
                  const creditor = creditors[0]; // Simplest suggestion
                  if (!creditor) return null;
                  const suggestedAmount = Math.min(
                    Math.abs(debtor.net_balance),
                    creditor.net_balance
                  );
                  return (
                    <p
                      key={debtor.participant_id}
                      className="text-xs text-blue-700"
                    >
                      {debtor.participant_name} → {creditor.participant_name}: ৳
                      {suggestedAmount.toFixed(2)}
                    </p>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                loading || !fromParticipant || !toParticipant || !amount
              }
              className="flex-1"
            >
              {loading ? "Recording..." : "Record Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
