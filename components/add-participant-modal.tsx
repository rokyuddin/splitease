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
import { useStore } from "@/lib/store";

interface AddParticipantModalProps {
  groupId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function AddParticipantModal({
  groupId,
  open,
  setOpen,
}: AddParticipantModalProps) {
  const { addParticipant } = useStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await addParticipant(groupId, name.trim(), email.trim() || undefined);

      // Reset form
      setName("");
      setEmail("");
      setOpen(false);
    } catch (error) {
      console.error("Error adding participant:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Participant</DialogTitle>
          <DialogDescription>
            Add a new person to this group to track expenses with them
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="participantName">Name *</Label>
            <Input
              id="participantName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter participant name"
              required
            />
          </div>

          <div>
            <Label htmlFor="participantEmail">Email (Optional)</Label>
            <Input
              id="participantEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
            />
          </div>

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
              disabled={loading || !name.trim()}
              className="flex-1"
            >
              {loading ? "Adding..." : "Add Participant"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
