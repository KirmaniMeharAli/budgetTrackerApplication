"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useTransactionStore } from "@/lib/transaction-store"
import { Trash2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

const categories = {
  expense: ["Groceries", "Transport", "Entertainment", "Rent", "Utilities", "Other"],
  income: ["Salary", "Freelance", "Investments", "Gifts", "Refunds", "Other"],
}

export default function TransactionForm({ userId, transaction, onSuccess, showDelete = false }) {
  const { addTransaction, updateTransaction, deleteTransaction } = useTransactionStore()
  const [loading, setLoading] = useState(false)
  const [transactionType, setTransactionType] = useState(transaction?.type || "expense")
  const [isDeleting, setIsDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      amount: transaction?.amount || "",
      category: transaction?.category || "Other",
      date: transaction?.date || new Date().toISOString().split("T")[0],
      description: transaction?.description || "",
      type: transaction?.type || "expense",
    },
  })

  // Watch the transaction type to update the form
  const watchType = watch("type")

  useEffect(() => {
    setTransactionType(watchType)
  }, [watchType])

  useEffect(() => {
    if (transaction) {
      setValue("amount", transaction.amount)
      setValue("category", transaction.category)
      setValue("date", transaction.date)
      setValue("description", transaction.description || "")
      setValue("type", transaction.type || "expense")
      setTransactionType(transaction.type || "expense")
    }
  }, [transaction, setValue])

  const onSubmit = async (data) => {
    setLoading(true)

    try {
      // Process the transaction
      if (transaction) {
        await updateTransaction(userId, transaction.id, data)
      } else {
        await addTransaction(userId, data)
      }

      if (onSuccess) onSuccess()
    } catch (error) {
      console.error("Error saving transaction:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!transaction || !transaction.id || isDeleting) return

    setIsDeleting(true)
    try {
      console.log("Deleting transaction with ID:", transaction.id)
      const success = await deleteTransaction(userId, transaction.id)

      if (success) {
        toast({
          title: "Transaction deleted",
          description: "The transaction has been successfully deleted.",
        })
        if (onSuccess) onSuccess()
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
      {/* Transaction Type Selection */}
      <div className="space-y-2">
        <Label>Transaction Type</Label>
        <RadioGroup
          defaultValue={transaction?.type || "expense"}
          onValueChange={(value) => setValue("type", value)}
          className="flex space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="expense" id="expense" />
            <Label htmlFor="expense" className="cursor-pointer">
              Expense
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="income" id="income" />
            <Label htmlFor="income" className="cursor-pointer">
              Income
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount ($)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          placeholder="0.00"
          {...register("amount", { required: "Amount is required" })}
        />
        {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select defaultValue={transaction?.category || "Other"} onValueChange={(value) => setValue("category", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories[transactionType].map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input id="date" type="date" {...register("date", { required: "Date is required" })} />
        {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea id="description" placeholder="Add a description..." {...register("description")} />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? "Saving..." : transaction ? "Update Transaction" : "Add Transaction"}
        </Button>

        {showDelete && transaction && (
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting} className="px-4">
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        )}
      </div>
    </form>
  )
}
