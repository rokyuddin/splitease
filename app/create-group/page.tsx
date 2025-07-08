"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { ArrowLeft, Users, Plus, X } from "lucide-react";

export default function CreateGroupPage() {
  const router = useRouter();
  const { createGroup, addParticipant } = useStore();

  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [participants, setParticipants] = useState<
    { name: string; email: string }[]
  >([{ name: "", email: "" }]);
  const [loading, setLoading] = useState(false);

  const addParticipantField = () => {
    setParticipants([...participants, { name: "", email: "" }]);
  };

  const removeParticipantField = (index: number) => {
    if (participants.length > 1) {
      setParticipants(participants.filter((_, i) => i !== index));
    }
  };

  const updateParticipant = (
    index: number,
    field: "name" | "email",
    value: string
  ) => {
    const updated = [...participants];
    updated[index][field] = value;
    setParticipants(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setLoading(true);
    try {
      const group = await createGroup(
        groupName.trim(),
        groupDescription.trim() || undefined
      );
      if (group) {
        if (participants.length === 0) {
          // If no participants, add the creator as the first participant
          const user = useStore.getState().user;
          if (user) {
            await addParticipant(
              group.id,
              user.full_name || "You",
              user.email || undefined
            );
          }
        } else {
          // Add participants
          for (const participant of participants) {
            if (participant.name.trim()) {
              await addParticipant(
                group.id,
                participant.name.trim(),
                participant.email.trim() || undefined
              );
            }
          }
        }
        router.push(`/group/${group.id}`);
      }
    } catch (error) {
      console.error("Error creating group:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-8">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Create New Group
              </h1>
              <p className="text-gray-600">
                Set up a group to start tracking shared expenses
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Group Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Group Details
                </CardTitle>
                <CardDescription>
                  Give your group a name and optional description
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="groupName">Group Name *</Label>
                  <Input
                    id="groupName"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g., Trip to Cox's Bazar, Roommates"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="groupDescription">
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="groupDescription"
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    placeholder="Brief description of the group"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Participants */}
            <Card>
              <CardHeader>
                <CardTitle>Add Participants</CardTitle>
                <CardDescription>
                  Add people who will be part of this group
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {participants.map((participant, index) => (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label htmlFor={`name-${index}`}>Name</Label>
                      <Input
                        id={`name-${index}`}
                        value={participant.name}
                        onChange={(e) =>
                          updateParticipant(index, "name", e.target.value)
                        }
                        placeholder="Participant name"
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor={`email-${index}`}>Email (Optional)</Label>
                      <Input
                        id={`email-${index}`}
                        type="email"
                        value={participant.email}
                        onChange={(e) =>
                          updateParticipant(index, "email", e.target.value)
                        }
                        placeholder="email@example.com"
                      />
                    </div>
                    {participants.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeParticipantField(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addParticipantField}
                  className="w-full bg-transparent"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Another Participant
                </Button>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !groupName.trim()}
                className="flex-1"
              >
                {loading ? "Creating..." : "Create Group"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
