"use client"

import { create } from "zustand"

// Helper functions for localStorage
const getLocalStorageTransactions = (userId) => {
  try {
    const storedData = localStorage.getItem(`transactions_${userId}`)
    return storedData ? JSON.parse(storedData) : []
  } catch (error) {
    console.error("Error accessing localStorage:", error)
    return []
  }
}

const saveLocalStorageTransactions = (userId, transactions) => {
  try {
    localStorage.setItem(`transactions_${userId}`, JSON.stringify(transactions))
    return true
  } catch (error) {
    console.error("Error saving to localStorage:", error)
    return false
  }
}

// Create the store with stable function references
export const useTransactionStore = create((set, get) => ({
  transactions: [],
  loading: false,
  error: null,

  // Fetch transactions for a user
  fetchTransactions: async (userId) => {
    if (!userId) {
      console.error("No user ID provided to fetchTransactions")
      return []
    }

    set({ loading: true, error: null })

    try {
      // Get from localStorage
      const localTransactions = getLocalStorageTransactions(userId)

      set({
        transactions: localTransactions,
        loading: false,
        error: null,
      })

      return localTransactions
    } catch (error) {
      console.error("Error fetching transactions:", error)
      set({
        transactions: [],
        loading: false,
        error: "Failed to load transactions.",
      })
      return []
    }
  },

  // Add a new transaction
  addTransaction: async (userId, transactionData) => {
    if (!userId) return null

    set({ loading: true, error: null })

    try {
      const newId = `local_${Date.now()}`
      const newTransaction = {
        id: newId,
        ...transactionData,
        userId,
        createdAt: new Date().toISOString(),
      }

      const updatedTransactions = [newTransaction, ...get().transactions]
      saveLocalStorageTransactions(userId, updatedTransactions)

      set({
        transactions: updatedTransactions,
        loading: false,
      })

      return newTransaction
    } catch (error) {
      console.error("Error adding transaction:", error)
      set({
        loading: false,
        error: "Failed to add transaction.",
      })
      return null
    }
  },

  // Update an existing transaction
  updateTransaction: async (userId, transactionId, transactionData) => {
    if (!userId || !transactionId) return null

    set({ loading: true, error: null })

    try {
      const updatedTransactions = get().transactions.map((transaction) =>
        transaction.id === transactionId ? { ...transaction, ...transactionData } : transaction,
      )

      saveLocalStorageTransactions(userId, updatedTransactions)

      set({
        transactions: updatedTransactions,
        loading: false,
      })

      return { id: transactionId, ...transactionData }
    } catch (error) {
      console.error("Error updating transaction:", error)
      set({
        loading: false,
        error: "Failed to update transaction.",
      })
      return null
    }
  },

  // Delete a transaction
  deleteTransaction: async (userId, transactionId) => {
    if (!userId || !transactionId) {
      console.error("Missing userId or transactionId for deletion")
      return false
    }

    set({ loading: true, error: null })

    try {
      console.log(`Attempting to delete transaction with ID: ${transactionId}`)

      // Get current transactions
      const currentTransactions = [...get().transactions]
      console.log(`Current transaction count: ${currentTransactions.length}`)

      // Find the transaction to delete
      const transactionToDelete = currentTransactions.find((t) => t.id === transactionId)
      if (!transactionToDelete) {
        console.error(`Transaction with ID ${transactionId} not found`)
        set({ loading: false, error: "Transaction not found" })
        return false
      }

      // Filter out the transaction to delete
      const updatedTransactions = currentTransactions.filter((t) => t.id !== transactionId)
      console.log(`Updated transaction count: ${updatedTransactions.length}`)

      // Save to localStorage first to ensure persistence
      const saveSuccess = saveLocalStorageTransactions(userId, updatedTransactions)
      if (!saveSuccess) {
        console.error("Failed to save updated transactions to localStorage")
        set({ loading: false, error: "Failed to save changes" })
        return false
      }

      // Update state after successful localStorage save
      set({
        transactions: updatedTransactions,
        loading: false,
        error: null,
      })

      console.log(`Successfully deleted transaction with ID: ${transactionId}`)
      return true
    } catch (error) {
      console.error("Error in deleteTransaction:", error)
      set({ loading: false, error: "Failed to delete transaction." })
      return false
    }
  },
}))
