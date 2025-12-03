import { auth } from "@/config/firebase"
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider, sendPasswordResetEmail } from "firebase/auth"

export const passwordService = {
    // Change password
    async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
        try {
            const user = auth.currentUser

            if (!user || !user.email) {
                throw new Error("No user logged in")
            }

            // Reauthenticate user
            const credential = EmailAuthProvider.credential(user.email, currentPassword)
            await reauthenticateWithCredential(user, credential)

            // Update password
            await updatePassword(user, newPassword)

            console.log("[v0] Password changed successfully")
            return true
        } catch (error: any) {
            console.error("Error changing password:", error)
            throw new Error(error.message || "Failed to change password")
        }
    },

    // Send password reset email
    async sendPasswordReset(email: string): Promise<boolean> {
        try {
            await sendPasswordResetEmail(auth, email)
            console.log("[v0] Password reset email sent")
            return true
        } catch (error: any) {
            console.error("Error sending password reset:", error)
            throw new Error(error.message || "Failed to send password reset email")
        }
    },
}
