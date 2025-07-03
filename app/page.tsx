"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/lib/store"
import { Plus, Users, Receipt, Calculator } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const { groups, fetchGroups, loading } = useStore()

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">SplitEase</h1>
          <p className="text-xl text-gray-600 mb-8">Track shared expenses with friends and family</p>
          <Button onClick={() => router.push("/create-group")} size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-5 w-5" />
            Create New Group
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Create Groups</CardTitle>
              <CardDescription>Organize expenses by trips, roommates, or any shared activity</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Receipt className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>Track Expenses</CardTitle>
              <CardDescription>Add expenses and automatically split them among group members</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Calculator className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle>Settle Up</CardTitle>
              <CardDescription>See who owes what and mark payments when settled</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Groups */}
        {groups.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Your Groups</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((group) => (
                <Card
                  key={group.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => router.push(`/group/${group.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    {group.description && <CardDescription>{group.description}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">Created {new Date(group.created_at).toLocaleDateString()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center">
            <p className="text-gray-600">Loading...</p>
          </div>
        )}
      </div>
    </div>
  )
}
