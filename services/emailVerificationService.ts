import { db } from "../config/firebase"
import { addDoc, collection, deleteDoc, getDocs, query, where } from "firebase/firestore"

export interface VerificationCode {
    email: string
    code: string
    createdAt: number
    expiresAt: number
}

const VERIFICATION_EXPIRY = 10 * 60 * 1000 // 10 minutes

export const emailVerificationService = {
    // Generate and store verification code
    async generateVerificationCode(email: string): Promise<string> {
        const code = Math.random().toString().slice(2, 8) // 6-digit code
        const now = Date.now()

        const docRef = await addDoc(collection(db, "EmailVerifications"), {
            email: email.toLowerCase(),
            code,
            createdAt: now,
            expiresAt: now + VERIFICATION_EXPIRY,
        })

        console.log("Verification code generated:", code, "for email:", email)
        return code
    },

    // Verify the code
    async verifyCode(email: string, code: string): Promise<boolean> {
        try {
            const q = query(
                collection(db, "EmailVerifications"),
                where("email", "==", email.toLowerCase()),
                where("code", "==", code),
            )

            const querySnapshot = await getDocs(q)

            if (querySnapshot.empty) {
                console.log("No verification code found")
                return false
            }

            const doc = querySnapshot.docs[0]
            const data = doc.data() as VerificationCode

            // Check if code is expired
            if (Date.now() > data.expiresAt) {
                console.log("Verification code expired")
                await deleteDoc(doc.ref)
                return false
            }

            // Delete the used code
            await deleteDoc(doc.ref)
            console.log("Verification successful")
            return true
        } catch (error) {
            console.error("Error verifying code:", error)
            return false
        }
    },

    // Clean up expired codes (call periodically)
    async cleanupExpiredCodes() {
        try {
            const q = query(collection(db, "EmailVerifications"), where("expiresAt", "<", Date.now()))
            const querySnapshot = await getDocs(q)

            querySnapshot.docs.forEach(async (doc) => {
                await deleteDoc(doc.ref)
            })
        } catch (error) {
            console.error("Error cleaning up verification codes:", error)
        }
    },
}
