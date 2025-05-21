"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import regression from "regression"
import { format, addMonths, isValid, parseISO } from "date-fns"

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

// Helper function to group transactions by month
const groupTransactionsByMonth = (transactions) => {
  if (!transactions || transactions.length === 0) {
    return []
  }

  // Create a map to store monthly totals
  const monthlyTotals = new Map()

  // Process each transaction
  transactions.forEach((transaction) => {
    // Skip income transactions
    if (transaction.type === "income") return

    // Parse the date correctly - using parseISO to ensure consistent parsing
    const date = parseISO(transaction.date)
    if (!isValid(date)) {
      console.error("Invalid date:", transaction.date)
      return
    }

    // Create a key using year and month (keeping month as is - no adjustment needed)
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`

    // Get the amount
    const amount = Number.parseFloat(transaction.amount) || 0

    // Add to monthly totals
    if (monthlyTotals.has(key)) {
      monthlyTotals.set(key, monthlyTotals.get(key) + amount)
    } else {
      monthlyTotals.set(key, amount)
    }
  })

  // Convert map to array of objects
  const result = Array.from(monthlyTotals.entries()).map(([key, total]) => {
    const [year, month] = key.split("-").map((num) => Number.parseInt(num, 10))

    // Create date with correct month (subtract 1 because JS months are 0-indexed)
    const date = new Date(year, month - 1, 1)

    return {
      date,
      month: format(date, "MMMM"),
      year,
      total,
      formattedDate: format(date, "MMMM yyyy"),
    }
  })

  // Sort by date (oldest to newest)
  return result.sort((a, b) => a.date - b.date)
}

// Helper function to fill in missing months
const fillMissingMonths = (monthlyData) => {
  if (monthlyData.length <= 1) return monthlyData

  const filledData = [...monthlyData]
  const sortedData = [...monthlyData].sort((a, b) => a.date - b.date)

  // Get the first and last month
  const firstDate = sortedData[0].date
  const lastDate = sortedData[sortedData.length - 1].date

  // Create a map of existing data points
  const existingDataMap = new Map(sortedData.map((item) => [format(item.date, "yyyy-MM"), item]))

  // Generate all months between first and last
  let currentDate = firstDate
  const allMonths = []

  while (currentDate <= lastDate) {
    const key = format(currentDate, "yyyy-MM")

    if (existingDataMap.has(key)) {
      allMonths.push(existingDataMap.get(key))
    } else {
      // Add a month with zero expenses if no data exists
      allMonths.push({
        date: new Date(currentDate),
        month: format(currentDate, "MMMM"),
        year: currentDate.getFullYear(),
        total: 0,
        formattedDate: format(currentDate, "MMMM yyyy"),
      })
    }

    currentDate = addMonths(currentDate, 1)
  }

  return allMonths
}

export default function ForecastPage({ transactions }) {
  const [monthlyData, setMonthlyData] = useState([])
  const [forecast, setForecast] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (transactions && transactions.length > 0) {
      try {
        // Group transactions by month
        const grouped = groupTransactionsByMonth(transactions)

        console.log(
          "Grouped transactions by month:",
          grouped.map((g) => ({
            month: g.formattedDate,
            total: g.total,
          })),
        )

        // Fill in any missing months in the data
        const filledData = fillMissingMonths(grouped)
        setMonthlyData(filledData)

        // Only perform forecast if we have at least 2 months of data
        if (filledData.length >= 2) {
          // Prepare data for linear regression
          const regressionData = filledData.map((item, index) => [index, item.total])

          // Perform linear regression
          const result = regression.linear(regressionData)

          // Calculate next month date
          const lastMonth = filledData[filledData.length - 1]
          const nextMonthDate = addMonths(lastMonth.date, 1)

          // Predict next month value
          const nextMonthIndex = filledData.length
          const predictedValue = result.predict(nextMonthIndex)[1]

          // Ensure prediction is not negative
          const finalPrediction = Math.max(0, predictedValue)

          setForecast({
            month: format(nextMonthDate, "MMMM yyyy"),
            predicted: finalPrediction,
            equation: result.equation,
            r2: result.r2,
          })

          setError("")
        } else {
          setError("At least 2 months of transaction data are required for forecasting.")
        }
      } catch (err) {
        console.error("Forecast error:", err)
        setError("Could not generate forecast. Please ensure you have sufficient transaction data.")
      }
    } else {
      setError("No transaction data available for forecasting.")
    }
  }, [transactions])

  // Prepare chart data - Show historical data and forecast
  const chartData = {
    labels: [...monthlyData.map((item) => item.formattedDate), forecast ? forecast.month : ""],
    datasets: [
      {
        label: "Historical Expenses",
        data: [...monthlyData.map((item) => item.total), null],
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgb(75, 192, 192)",
        borderWidth: 2,
        pointBackgroundColor: "rgb(75, 192, 192)",
        pointRadius: 4,
      },
      {
        label: "Forecast",
        data: [...monthlyData.map(() => null), forecast ? forecast.predicted : null],
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderColor: "rgb(255, 99, 132)",
        borderWidth: 2,
        pointBackgroundColor: "rgb(255, 99, 132)",
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || ""
            if (label) {
              label += ": "
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(context.parsed.y)
            }
            return label
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => "$" + value,
        },
      },
    },
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Budget Forecast</CardTitle>
          <CardDescription>Predicted expenses for the next month based on your spending patterns</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <>
              {forecast && (
                <div className="space-y-6">
                  <div className="p-6 bg-gray-50 rounded-lg text-center">
                    <h3 className="font-medium mb-2">Predicted Expenses for {forecast.month}</h3>
                    <p className="text-3xl font-bold text-red-500">${forecast.predicted.toFixed(2)}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Based on your spending patterns from the last {monthlyData.length} months
                    </p>
                  </div>

                  <div className="h-64">
                    <Line data={chartData} options={chartOptions} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-sm text-gray-500 mb-1">Regression Equation</h4>
                      <p className="font-mono">
                        y = {forecast.equation[0].toFixed(2)}x + {forecast.equation[1].toFixed(2)}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-sm text-gray-500 mb-1">Confidence (R²)</h4>
                      <p className="font-mono">{(forecast.r2 * 100).toFixed(2)}%</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
