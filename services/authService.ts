import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
} from "firebase/auth"
import { auth, db } from "@/config/firebase"
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore"

export interface UserData {
    uid: string
    name: string
    email: string
    mobile: string
    createdAt: string
    lastLoginAt: string
    orders: any[]
    reorders: any[]
    notifications: any[]
    reminders: any[]
    reminderDates?: any[]
    reorderCount?: number
}

export const authService = {
    // Sign up new user
    async signup(email: string, password: string, name: string, mobile: string): Promise<UserData> {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const user = userCredential.user

        const userData: UserData = {
            uid: user.uid,
            name,
            email,
            mobile,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            orders: [],
            reorders: [],
            notifications: [],
            reminders: [],
            reminderDates: [],
            reorderCount: 0,
        }

        await setDoc(doc(db, "AllUsers", user.uid), userData)
        return userData
    },

    // Login user
    async login(email: string, password: string) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        const user = userCredential.user

        // Check if user exists in AllUsers collection
        const userDocSnap = await getDoc(doc(db, "AllUsers", user.uid))

        if (userDocSnap.exists()) {
            // User exists, update lastLoginAt timestamp
            await updateDoc(doc(db, "AllUsers", user.uid), {
                lastLoginAt: new Date().toISOString(),
            })
        } else {
            // User doesn't exist (shouldn't happen in normal flow, but handle it)
            const userData: UserData = {
                uid: user.uid,
                name: user.displayName || "User",
                email: user.email || email,
                mobile: "",
                createdAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString(),
                orders: [],
                reorders: [],
                notifications: [],
                reminders: [],
                reminderDates: [],
                reorderCount: 0,
            }
            await setDoc(doc(db, "AllUsers", user.uid), userData)
        }

        return user
    },

    // Send password reset email
    async sendPasswordReset(email: string) {
        await sendPasswordResetEmail(auth, email)
    },

    // Logout user
    async logout() {
        await signOut(auth)
    },

    // Get current user data
    async getUserData(uid: string): Promise<UserData | null> {
        const docSnap = await getDoc(doc(db, "AllUsers", uid))
        return docSnap.exists() ? (docSnap.data() as UserData) : null
    },

    // Check if user is admin
    async isAdmin(email: string): Promise<boolean> {
        return email === "admin@gmail.com"
    },
}
