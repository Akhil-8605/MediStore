"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import {
    getDashboardStats,
    getLowStockMedicines,
    getRecentActivity,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    getAllMedicines,
    type Medicine,
    type DashboardStats,
    type RecentActivity,
} from "@/services/adminService"

interface AdminContextType {
    stats: DashboardStats | null
    lowStockMedicines: Medicine[]
    recentActivity: RecentActivity[]
    medicines: Medicine[]
    loading: boolean
    error: string | null
    refreshDashboard: () => Promise<void>
    refreshMedicines: () => Promise<void>
    createMedicine: (medicine: Medicine) => Promise<string>
    editMedicine: (id: string, medicine: Partial<Medicine>) => Promise<void>
    removeMedicine: (id: string) => Promise<void>
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [lowStockMedicines, setLowStockMedicines] = useState<Medicine[]>([])
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
    const [medicines, setMedicines] = useState<Medicine[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const refreshDashboard = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const [dashStats, lowStock, activities] = await Promise.all([
                getDashboardStats(),
                getLowStockMedicines(),
                getRecentActivity(1),
            ])
            setStats(dashStats)
            setLowStockMedicines(lowStock)
            setRecentActivity(activities)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch dashboard data")
        } finally {
            setLoading(false)
        }
    }, [])

    const refreshMedicines = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const allMedicines = await getAllMedicines()
            setMedicines(allMedicines)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch medicines")
        } finally {
            setLoading(false)
        }
    }, [])

    const createMedicine = useCallback(
        async (medicine: Medicine): Promise<string> => {
            try {
                const id = await addMedicine(medicine)
                await refreshMedicines()
                return id
            } catch (err) {
                throw err
            }
        },
        [refreshMedicines],
    )

    const editMedicine = useCallback(
        async (id: string, medicine: Partial<Medicine>): Promise<void> => {
            try {
                await updateMedicine(id, medicine)
                await refreshMedicines()
            } catch (err) {
                throw err
            }
        },
        [refreshMedicines],
    )

    const removeMedicine = useCallback(
        async (id: string): Promise<void> => {
            try {
                await deleteMedicine(id)
                await refreshMedicines()
            } catch (err) {
                throw err
            }
        },
        [refreshMedicines],
    )

    return (
        <AdminContext.Provider
            value={{
                stats,
                lowStockMedicines,
                recentActivity,
                medicines,
                loading,
                error,
                refreshDashboard,
                refreshMedicines,
                createMedicine,
                editMedicine,
                removeMedicine,
            }}
        >
            {children}
        </AdminContext.Provider>
    )
}

export const useAdmin = () => {
    const context = useContext(AdminContext)
    if (!context) {
        throw new Error("useAdmin must be used within AdminProvider")
    }
    return context
}
