import type { Order } from "./firestoreService"

export const receiptService = {
    // Generate receipt data
    generateReceiptData(order: Order, userName: string, userEmail: string) {
        const receiptDate = new Date(order.createdAt).toLocaleDateString()
        const receiptTime = new Date(order.createdAt).toLocaleTimeString()

        const itemsHTML = order.items
            .map(
                (item) =>
                    `<tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">₹${item.price.toFixed(2)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
          </tr>`,
            )
            .join("")

        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; color: #333;">MediStore</h1>
          <p style="margin: 5px 0; color: #666;">Your Health, Delivered</p>
        </div>

        <div style="border-top: 2px solid #ddd; padding-top: 20px; margin-bottom: 20px;">
          <p><strong>Order ID:</strong> ${order.orderId}</p>
          <p><strong>Date:</strong> ${receiptDate}</p>
          <p><strong>Time:</strong> ${receiptTime}</p>
          <p><strong>Customer:</strong> ${userName}</p>
          <p><strong>Email:</strong> ${userEmail}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Items</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background-color: #f5f5f5; font-weight: bold;">
              <td style="padding: 8px;">Medicine</td>
              <td style="padding: 8px; text-align: center;">Price</td>
              <td style="padding: 8px; text-align: center;">Qty</td>
              <td style="padding: 8px; text-align: right;">Amount</td>
            </tr>
            ${itemsHTML}
          </table>
        </div>

        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Subtotal:</span>
            <span>₹${order.total.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid #ddd;">
            <strong>Total:</strong>
            <strong>₹${order.total.toFixed(2)}</strong>
          </div>
        </div>

        <div style="text-align: center; color: #666; font-size: 12px;">
          <p><strong>Payment Method:</strong> ${order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment (UPI)"}</p>
          <p><strong>Delivery Address:</strong></p>
          <p>${order.deliveryAddress}</p>
        </div>

        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 11px;">
          <p>Thank you for your purchase!</p>
          <p>This is a computer-generated receipt. No signature required.</p>
        </div>
      </div>
    `

        return html
    },
}
