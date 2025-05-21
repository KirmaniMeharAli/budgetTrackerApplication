"use client"

import { useState, useEffect } from "react"
import { auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TransactionList from "@/components/transactions/transaction-list"
import TransactionForm from "@/components/transactions/transaction-form"
import CategorySummary from "@/components/dashboard/category-summary"
import ForecastPage from "@/components/forecast/forecast-page"
import RecurringTransactions from "@/components/recurring/recurring-transactions"
import { useTransactionStore } from "@/lib/transaction-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, Plus } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

export default function Dashboard({ user }) {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isAddingTransaction, setIsAddingTransaction] = useState(false)
  const { transactions, fetchTransactions, loading } = useTransactionStore()

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        await fetchTransactions(user.uid)
      } catch (err) {
        console.error("Error in dashboard while loading transactions:", err)
      }
    }

    loadTransactions()
  }, [user.uid, fetchTransactions])

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const refreshTransactions = async () => {
    try {
      await fetchTransactions(user.uid)
    } catch (err) {
      console.error("Error refreshing transactions:", err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Budget Tracker</h1>
          <div className="flex items-center gap-4">
            <Sheet open={isAddingTransaction} onOpenChange={setIsAddingTransaction}>
              <SheetTrigger asChild>
                <Button size="sm" className="flex items-center gap-1">
                  <Plus className="h-4 w-4" /> Add Transaction
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Add New Transaction</SheetTitle>
                </SheetHeader>
                <TransactionForm
                  userId={user.uid}
                  onSuccess={() => {
                    setIsAddingTransaction(false)
                    refreshTransactions()
                  }}
                />
              </SheetContent>
            </Sheet>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="forecast">Budget Forecast</TabsTrigger>
            <TabsTrigger value="recurring">Recurring Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-10 h-10 border-t-4 border-primary border-solid rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                <CategorySummary transactions={transactions} />
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>View and manage your recent transactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TransactionList
                      transactions={transactions}
                      userId={user.uid}
                      onTransactionChange={refreshTransactions}
                    />
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="forecast">
            <ForecastPage transactions={transactions} />
          </TabsContent>

          <TabsContent value="recurring">
            <RecurringTransactions transactions={transactions} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
