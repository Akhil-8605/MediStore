const QRCode = require("qrcode")

export interface PaymentDetails {
    orderId: string
    amount: number
    method: "COD" | "UPI"
    upiId?: string
    timestamp: string
}

export const paymentService = {
    // Generate UPI QR Code
    async generateUPIQRCode(amount: number): Promise<string> {
        const upiId = "akhilesh-adam@ybl"
        const upiString = `upi://pay?pa=${upiId}&pn=MediStore&am=${amount.toFixed(2)}&tn=Medicine%20Order`

        try {
            const qrCodeDataUrl = await QRCode.toDataURL(upiString)
            return qrCodeDataUrl
        } catch (error) {
            console.error("Error generating QR code:", error)
            throw error
        }
    },

    // Process COD payment
    async processCODPayment(orderId: string, amount: number): Promise<boolean> {
        try {
            // Simulate COD processing
            return true
        } catch (error) {
            console.error("Error processing COD:", error)
            return false
        }
    },

    // Process online payment (UPI)
    async processOnlinePayment(orderId: string, amount: number): Promise<string> {
        try {
            const qrCode = await this.generateUPIQRCode(amount)
            return qrCode
        } catch (error) {
            console.error("Error processing online payment:", error)
            throw error
        }
    },
}
