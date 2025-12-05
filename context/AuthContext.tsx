"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { auth } from "../config/firebase"
import { authService, type UserData } from "../services/authService"
import { onAuthStateChanged, type User } from "firebase/auth"

interface AuthContextType {
    user: User | null
    userData: UserData | null
    loading: boolean
    isAdmin: boolean
    signup: (email: string, password: string, name: string, mobile: string) => Promise<UserData>
    login: (email: string, password: string) => Promise<void>
    logout: () => Promise<void>
    resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null)
    const [userData, setUserData] = useState<UserData | null>(null)
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser)
                const data = await authService.getUserData(firebaseUser.uid)
                setUserData(data)
                const admin = await authService.isAdmin(firebaseUser.email || "")
                setIsAdmin(admin)
            } else {
                setUser(null)
                setUserData(null)
                setIsAdmin(false)
            }
            setLoading(false)
        })

        return unsubscribe
    }, [])

    const signup = async (email: string, password: string, name: string, mobile: string) => {
        const newUserData = await authService.signup(email, password, name, mobile)
        setUserData(newUserData)
        return newUserData
    }

    const login = async (email: string, password: string) => {
        const firebaseUser = await authService.login(email, password)
        setUser(firebaseUser)
        const data = await authService.getUserData(firebaseUser.uid)
        setUserData(data)
        const admin = await authService.isAdmin(email)
        setIsAdmin(admin)
    }

    const logout = async () => {
        await authService.logout()
        setUser(null)
        setUserData(null)
        setIsAdmin(false)
    }

    const resetPassword = async (email: string) => {
        await authService.sendPasswordReset(email)
    }

    const value = {
        user,
        userData,
        loading,
        isAdmin,
        signup,
        login,
        logout,
        resetPassword,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider")
    }
    return context
}
