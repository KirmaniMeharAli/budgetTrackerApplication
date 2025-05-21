"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, ChevronDown, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { format, parseISO } from "date-fns"

// Helper function to get day of month from date string
const getDayOfMonth = (dateStr) => {
  try {
    // Parse the date string to ensure consistent format
    const date = parseISO(dateStr)
    return date.getDate()
  } catch (error) {
    console.error("Error parsing date:", dateStr, error)
    return 1 // Default to 1st day if parsing fails
  }
}

export default function RecurringTransactions({ transactions }) {
  const [recurringGroups, setRecurringGroups] = useState([])
  const [error, setError] = useState("")
  const [expandedGroups, setExpandedGroups] = useState({})

  useEffect(() => {
    if (transactions && transactions.length > 5) {
      try {
        // Filter out income transactions
        const expenseTransactions = transactions.filter((t) => t.type !== "income")

        if (expenseTransactions.length <= 5) {
          setError("At least 6 expense transactions are required for recurring transaction analysis.")
          return
        }

        // Group transactions by category and similar amount
        const groups = {}

        expenseTransactions.forEach((transaction) => {
          const key = `${transaction.category}-${Math.round(Number.parseFloat(transaction.amount))}`

          if (!groups[key]) {
            groups[key] = []
          }

          groups[key].push(transaction)
        })

        // Filter groups to only include those with multiple transactions
        const recurringCandidates = Object.values(groups)
          .filter((group) => group.length >= 2)
          .map((group) => {
            // Check if transactions occur on similar days of month
            const dayOfMonths = group.map((t) => getDayOfMonth(t.date))
            const averageDay = dayOfMonths.reduce((sum, day) => sum + day, 0) / dayOfMonths.length
            const similarDays = dayOfMonths.every((day) => Math.abs(day - averageDay) <= 3)

            return {
              transactions: group,
              isRecurring: similarDays,
              category: group[0].category,
              averageAmount: group.reduce((sum, t) => sum + Number.parseFloat(t.amount), 0) / group.length,
            }
          })

        setRecurringGroups(recurringCandidates)

        // Initialize expanded state
        const initialExpandedState = {}
        recurringCandidates.forEach((_, index) => {
          initialExpandedState[index] = false
        })
        setExpandedGroups(initialExpandedState)

        setError("")
      } catch (err) {
        console.error("Recurring transaction analysis error:", err)
        setError(
          "Could not perform recurring transaction analysis. Please ensure you have sufficient transaction data.",
        )
      }
    } else {
      setError("At least 6 transactions are required for recurring transaction analysis.")
    }
  }, [transactions])

  const toggleGroup = (index) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Recurring Transactions</CardTitle>
          <CardDescription>Analysis to identify recurring spending patterns</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {recurringGroups.length > 0 ? (
                recurringGroups.map((group, index) => (
                  <Collapsible
                    key={index}
                    open={expandedGroups[index]}
                    className={`border rounded-lg ${group.isRecurring ? "border-primary" : "border-gray-200"}`}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center justify-between w-full p-4"
                        onClick={() => toggleGroup(index)}
                      >
                        <div className="flex items-center gap-2">
                          {expandedGroups[index] ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <span className="font-medium">{group.category}</span>
                          <Badge variant={group.isRecurring ? "default" : "outline"}>
                            {group.isRecurring ? "Recurring" : "Similar"}
                          </Badge>
                        </div>
                        <span className="font-medium">${group.averageAmount.toFixed(2)} avg</span>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 space-y-2">
                        {group.transactions.map((transaction, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="text-sm">{format(parseISO(transaction.date), "MMM d, yyyy")}</div>
                            <div className="font-medium">${Number.parseFloat(transaction.amount).toFixed(2)}</div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))
              ) : (
                <div className="text-center py-10 text-gray-500">No recurring transaction patterns detected yet.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
