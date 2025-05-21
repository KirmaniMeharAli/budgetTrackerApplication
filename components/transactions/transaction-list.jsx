"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import TransactionForm from "@/components/transactions/transaction-form"
import { useTransactionStore } from "@/lib/transaction-store"
import { toast } from "@/components/ui/use-toast"

// Helper function to group transactions by date
const groupTransactionsByDate = (transactions) => {
  const grouped = {}

  if (!transactions || transactions.length === 0) {
    return []
  }

  transactions.forEach((transaction) => {
    const date = transaction.date
    if (!grouped[date]) {
      grouped[date] = []
    }
    grouped[date].push(transaction)
  })

  // Sort dates in descending order (newest first)
  return Object.keys(grouped)
    .sort((a, b) => new Date(b) - new Date(a))
    .map((date) => ({
      date,
      transactions: grouped[date],
    }))
}

export default function TransactionList({ transactions, userId, onTransactionChange }) {
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { deleteTransaction } = useTransactionStore()

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction)
    setIsEditSheetOpen(true)
  }

  const handleDelete = async (transaction) => {
    if (!transaction || !transaction.id || isDeleting) return

    if (!confirm("Are you sure you want to delete this transaction? This action cannot be undone.")) {
      return
    }

    setIsDeleting(true)
    try {
      console.log("Directly deleting transaction with ID:", transaction.id)
      const success = await deleteTransaction(userId, transaction.id)

      if (success) {
        toast({
          title: "Transaction deleted",
          description: "The transaction has been successfully deleted.",
        })
        if (onTransactionChange) onTransactionChange()
      } else {
        toast({
          title: "Error",
          description: "Failed to delete transaction. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting transaction:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the transaction.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Group transactions by date
  const groupedTransactions = groupTransactionsByDate(transactions)

  return (
    <div className="space-y-6">
      {groupedTransactions.length > 0 ? (
        groupedTransactions.map((group) => (
          <div key={group.date} className="space-y-2">
            <h3 className="font-medium text-sm text-gray-500">{format(parseISO(group.date), "MMMM d, yyyy")}</h3>
            <div className="space-y-2">
              {group.transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={transaction.type === "income" ? "text-green-600 border-green-600" : ""}
                      >
                        {transaction.category}
                      </Badge>
                      <span className={`font-medium ${transaction.type === "income" ? "text-green-600" : ""}`}>
                        {transaction.type === "income" ? "+" : ""}${Number.parseFloat(transaction.amount).toFixed(2)}
                      </span>
                    </div>
                    {transaction.description && <p className="text-sm text-gray-500 mt-1">{transaction.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(transaction)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(transaction)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-10 text-gray-500">No transactions found. Add a transaction to get started.</div>
      )}

      {/* Edit Transaction Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Transaction</SheetTitle>
          </SheetHeader>
          {editingTransaction && (
            <TransactionForm
              userId={userId}
              transaction={editingTransaction}
              onSuccess={() => {
                setIsEditSheetOpen(false)
                if (onTransactionChange) onTransactionChange()
              }}
              showDelete={true}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
