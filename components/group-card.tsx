"use client";
import { Group } from "@/lib/store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { useRouter } from "next/navigation";

export default function GroupCard({ group }: { group: Group }) {
  const router = useRouter();
  return (
    <Card
      key={group.id}
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => router.push(`/group/${group.id}`)}
    >
      <CardHeader>
        <CardTitle className="text-lg">{group.name}</CardTitle>
        {group.description && (
          <CardDescription>{group.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500">
          Created {new Date(group.created_at).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}
