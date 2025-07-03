import GroupCard from "@/components/group-card";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchGroups } from "@/lib";
import { cn } from "@/lib/utils";
import { Plus, Users, Receipt, Calculator } from "lucide-react";
import Link from "next/link";
import { use } from "react";

export default function HomePage() {
  const { data: groups, error } = use(fetchGroups());

  if (error) {
    console.error("Error fetching groups:", error);
    return <div>Error loading groups</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">SplitEase</h1>
          <p className="text-xl text-gray-600 mb-8">
            Track shared expenses with friends and family
          </p>
          <Link
            className={cn(buttonVariants({ variant: "default", size: "lg" }))}
            href="/create-group"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create New Group
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Create Groups</CardTitle>
              <CardDescription>
                Organize expenses by trips, roommates, or any shared activity
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Receipt className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>Track Expenses</CardTitle>
              <CardDescription>
                Add expenses and automatically split them among group members
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Calculator className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle>Settle Up</CardTitle>
              <CardDescription>
                See who owes what and mark payments when settled
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Groups */}
        {groups.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Your Groups</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
