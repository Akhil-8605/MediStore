import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
} from "firebase/auth"
import { auth, db } from "../config/firebase"
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore"
import { notifyAdminNewUser } from "./pushNotificationService"
import AsyncStorage from "@react-native-async-storage/async-storage"

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
    pushToken?: string
}

const ADMIN_LOGIN_KEY = "medistore_admin_logged_in"
const LAST_LOGIN_TYPE_KEY = "medistore_last_login_type"

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

        await notifyAdminNewUser({
            name,
            email,
            userId: user.uid,
        })

        // Store login type
        await AsyncStorage.setItem(LAST_LOGIN_TYPE_KEY, "user")

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

        // Store login type
        await AsyncStorage.setItem(LAST_LOGIN_TYPE_KEY, "user")

        return user
    },

    async adminLogin(): Promise<void> {
        await AsyncStorage.setItem(ADMIN_LOGIN_KEY, "true")
        await AsyncStorage.setItem(LAST_LOGIN_TYPE_KEY, "admin")
    },

    async wasLastLoginAdmin(): Promise<boolean> {
        const loginType = await AsyncStorage.getItem(LAST_LOGIN_TYPE_KEY)
        return loginType === "admin"
    },

    async isAdminLoggedIn(): Promise<boolean> {
        const adminLoggedIn = await AsyncStorage.getItem(ADMIN_LOGIN_KEY)
        return adminLoggedIn === "true"
    },

    async adminLogout(): Promise<void> {
        await AsyncStorage.removeItem(ADMIN_LOGIN_KEY)
    },

    // Send password reset email
    async sendPasswordReset(email: string) {
        await sendPasswordResetEmail(auth, email)
    },

    // Logout user
    async logout() {
        await signOut(auth)
        await AsyncStorage.removeItem(ADMIN_LOGIN_KEY)
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
