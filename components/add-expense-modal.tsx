"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useStore, type Participant } from "@/lib/store"

interface AddExpenseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  participants: Participant[]
}

export function AddExpenseModal({ open, onOpenChange, groupId, participants }: AddExpenseModalProps) {
  const { addExpense } = useStore()

  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [paidBy, setPaidBy] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handleParticipantToggle = (participantId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(participantId) ? prev.filter((id) => id !== participantId) : [...prev, participantId],
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !amount || !paidBy || selectedParticipants.length === 0) return

    setLoading(true)
    try {
      const totalAmount = Number.parseFloat(amount)
      const splitAmount = totalAmount / selectedParticipants.length

      await addExpense({
        group_id: groupId,
        title: title.trim(),
        amount: totalAmount,
        paid_by: paidBy,
        date,
        splits: selectedParticipants.map((participantId) => ({
          participant_id: participantId,
          amount: splitAmount,
        })),
      })

      // Reset form
      setTitle("")
      setAmount("")
      setPaidBy("")
      setDate(new Date().toISOString().split("T")[0])
      setSelectedParticipants([])
      onOpenChange(false)
    } catch (error) {
      console.error("Error adding expense:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
          <DialogDescription>Add a new expense and split it among group members</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Expense Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Dinner, Gas, Hotel"
              required
            />
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
            <Label htmlFor="paidBy">Paid By</Label>
            <Select value={paidBy} onValueChange={setPaidBy} required>
              <SelectTrigger>
                <SelectValue placeholder="Select who paid" />
              </SelectTrigger>
              <SelectContent>
                {participants.map((participant) => (
                  <SelectItem key={participant.id} value={participant.id}>
                    {participant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>

          <div>
            <Label>Split Between</Label>
            <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={participant.id}
                    checked={selectedParticipants.includes(participant.id)}
                    onCheckedChange={() => handleParticipantToggle(participant.id)}
                  />
                  <Label htmlFor={participant.id} className="text-sm">
                    {participant.name}
                  </Label>
                </div>
              ))}
            </div>
            {selectedParticipants.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                Each person owes: ৳
                {amount ? (Number.parseFloat(amount) / selectedParticipants.length).toFixed(2) : "0.00"}
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !title.trim() || !amount || !paidBy || selectedParticipants.length === 0}
              className="flex-1"
            >
              {loading ? "Adding..." : "Add Expense"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
