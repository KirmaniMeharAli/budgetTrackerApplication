"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Doughnut } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend)

// Define colors for categories
const categoryColors = {
  Groceries: "rgba(255, 99, 132, 0.8)",
  Transport: "rgba(54, 162, 235, 0.8)",
  Entertainment: "rgba(255, 206, 86, 0.8)",
  Rent: "rgba(75, 192, 192, 0.8)",
  Utilities: "rgba(153, 102, 255, 0.8)",
  Other: "rgba(255, 159, 64, 0.8)",
}

export default function CategorySummary({ transactions }) {
  // Calculate totals by category
  const { totals, totalSpending } = useMemo(() => {
    const totals = {}
    let totalSpending = 0

    if (transactions && transactions.length > 0) {
      transactions.forEach((transaction) => {
        if (transaction.type === "income") return // Skip income transactions

        const category = transaction.category || "Other"
        const amount = Number.parseFloat(transaction.amount) || 0

        if (totals[category]) {
          totals[category] += amount
        } else {
          totals[category] = amount
        }

        totalSpending += amount
      })
    }

    return { totals, totalSpending }
  }, [transactions])

  // Prepare data for the chart
  const chartData = useMemo(() => {
    const categories = Object.keys(totals)
    return {
      labels: categories,
      datasets: [
        {
          data: categories.map((category) => totals[category]),
          backgroundColor: categories.map((category) => categoryColors[category] || "rgba(128, 128, 128, 0.8)"),
          borderColor: categories.map(
            (category) => categoryColors[category]?.replace("0.8", "1") || "rgba(128, 128, 128, 1)",
          ),
          borderWidth: 1,
        },
      ],
    }
  }, [totals])

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
      },
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
        <CardDescription>Total spending: ${totalSpending.toFixed(2)}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {Object.keys(totals).length > 0 ? (
            <Doughnut data={chartData} options={chartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">No transaction data available</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
