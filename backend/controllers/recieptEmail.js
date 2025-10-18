import nodemailer from "nodemailer";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";

// Configure email service
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Generate professional HTML receipt
const generateReceiptHTML = (order, user, items) => {
  const itemsList = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: right;">${(item.price).toFixed(2)}€</td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${(item.price * item.quantity).toFixed(2)}€</td>
    </tr>
  `
    )
    .join("");

  const deliveryFee = 2;
  const discount = order.discount || 0;
  const subtotal = order.amount + discount - deliveryFee;
  
  const orderDate = new Date(order.date);
  const formattedDate = orderDate.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = orderDate.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const paymentDate = order.paymentTimestamp 
    ? new Date(order.paymentTimestamp).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : new Date().toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #2c3e50;
          background: #f5f7fa;
          line-height: 1.6;
        }
        .container { 
          max-width: 700px; 
          margin: 0 auto; 
          padding: 20px;
        }
        .email-wrapper {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; 
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 { 
          font-size: 32px;
          margin-bottom: 8px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        .header p { 
          opacity: 0.95;
          font-size: 16px;
        }
        .content { 
          padding: 40px 30px;
        }
        .order-number {
          background: #f0f4ff;
          border-left: 4px solid #667eea;
          padding: 15px 20px;
          border-radius: 6px;
          margin-bottom: 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .order-number-label {
          font-size: 13px;
          color: #667eea;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .order-number-value {
          font-size: 24px;
          color: #667eea;
          font-weight: 700;
          font-family: 'Courier New', monospace;
        }
        .timeline-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #eee;
        }
        .timeline-row:last-child {
          border-bottom: none;
        }
        .timeline-event {
          flex: 1;
        }
        .timeline-label {
          font-size: 12px;
          color: #667eea;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .timeline-date {
          font-size: 14px;
          color: #2c3e50;
          font-weight: 600;
        }
        .timeline-time {
          font-size: 12px;
          color: #7f8c8d;
          margin-top: 2px;
        }
        .section-title {
          font-size: 16px;
          font-weight: 700;
          color: #2c3e50;
          margin-top: 30px;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #667eea;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 25px;
        }
        table th { 
          background: #f8f9fa;
          border-bottom: 2px solid #667eea;
          color: #2c3e50;
          padding: 12px 8px;
          text-align: left;
          font-weight: 700;
          font-size: 13px;
        }
        table th:last-child {
          text-align: right;
        }
        table td {
          padding: 12px 8px;
        }
        table tbody tr:hover {
          background: #f8f9fa;
        }
        .totals-section {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 25px;
        }
        .total-row { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 10px;
          font-size: 14px;
        }
        .total-label {
          color: #555;
          font-weight: 500;
        }
        .total-value {
          color: #2c3e50;
          font-weight: 600;
          text-align: right;
        }
        .discount-row .total-value {
          color: #27ae60;
          font-weight: 700;
        }
        .total-divider {
          border-bottom: 1px solid #ddd;
          margin: 12px 0;
        }
        .final-total {
          display: flex;
          justify-content: space-between;
          padding-top: 12px;
          margin-top: 12px;
          border-top: 2px solid #667eea;
        }
        .final-total .total-label {
          font-size: 18px;
          font-weight: 700;
          color: #2c3e50;
        }
        .final-total .total-value {
          font-size: 24px;
          font-weight: 700;
          color: #667eea;
        }
        .customer-section {
          background: white;
          border-left: 4px solid #667eea;
          padding: 20px;
          margin-bottom: 25px;
          border-radius: 6px;
          border: 1px solid #e8eef5;
        }
        .customer-title {
          font-size: 13px;
          color: #667eea;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
        }
        .customer-name {
          font-size: 16px;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 8px;
        }
        .customer-detail {
          font-size: 14px;
          color: #555;
          margin-bottom: 4px;
          line-height: 1.5;
        }
        .status-box {
          background: #ecf8f3;
          border-left: 4px solid #27ae60;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 25px;
        }
        .status-label {
          font-size: 12px;
          color: #27ae60;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .status-text {
          font-size: 15px;
          color: #27ae60;
          font-weight: 600;
        }
        .eta-box {
          background: #fff8e1;
          border-left: 4px solid #ffc107;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 25px;
        }
        .eta-label {
          font-size: 12px;
          color: #f39c12;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .eta-text {
          font-size: 15px;
          color: #f39c12;
          font-weight: 600;
        }
        .footer { 
          background: #f8f9fa;
          text-align: center; 
          padding: 25px 30px;
          border-top: 1px solid #eee;
          font-size: 12px;
          color: #7f8c8d;
        }
        .footer a {
          color: #667eea;
          text-decoration: none;
        }
        .divider {
          height: 1px;
          background: #eee;
          margin: 25px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="email-wrapper">
          <!-- Header -->
          <div class="header">
            <h1>Commande Confirmée</h1>
            <p>Merci d'avoir commandé chez nous!</p>
          </div>

          <!-- Content -->
          <div class="content">
            <!-- Order Number -->
            <div class="order-number">
              <span class="order-number-label">Numéro de commande</span>
              <span class="order-number-value">#${order._id.toString().slice(-8).toUpperCase()}</span>
            </div>

            <!-- Timeline -->
            <div class="section-title">Chronologie</div>
            <div class="timeline-row">
              <div class="timeline-event">
                <div class="timeline-label">Commande passée</div>
                <div class="timeline-date">${formattedDate}</div>
                <div class="timeline-time">${formattedTime}</div>
              </div>
              <div class="timeline-event">
                <div class="timeline-label">Paiement confirmé</div>
                <div class="timeline-date">${paymentDate}</div>
                <div class="timeline-time">✓ Reçu</div>
              </div>
            </div>

            <!-- Status -->
            <div class="status-box">
              <div class="status-label">Statut actuel</div>
              <div class="status-text">✓ En préparation</div>
            </div>

            <!-- ETA -->
            <div class="eta-box">
              <div class="eta-label">Temps de livraison estimé</div>
              <div class="eta-text">30-45 minutes</div>
            </div>

            <!-- Items Section -->
            <div class="section-title">Articles commandés</div>
            <table>
              <thead>
                <tr>
                  <th>Article</th>
                  <th>Quantité</th>
                  <th>Prix unitaire</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList}
              </tbody>
            </table>

            <!-- Totals -->
            <div class="section-title">Récapitulatif</div>
            <div class="totals-section">
              <div class="total-row">
                <span class="total-label">Sous-total</span>
                <span class="total-value">${subtotal.toFixed(2)}€</span>
              </div>
              <div class="total-row">
                <span class="total-label">Frais de livraison</span>
                <span class="total-value">${deliveryFee.toFixed(2)}€</span>
              </div>
              ${discount > 0 ? `
              <div class="total-row discount-row">
                <span class="total-label">Réduction ${order.promoCode ? `(${order.promoCode})` : ""}</span>
                <span class="total-value">-${discount.toFixed(2)}€</span>
              </div>
              ` : ""}
              <div class="total-divider"></div>
              <div class="final-total">
                <span class="total-label">TOTAL</span>
                <span class="total-value">${order.amount.toFixed(2)}€</span>
              </div>
            </div>

            <!-- Delivery Address -->
            <div class="section-title">Adresse de livraison</div>
            <div class="customer-section">
              <div class="customer-title">Livraison à</div>
              <div class="customer-name">
                ${user.billingInfo?.firstName || ''} ${user.billingInfo?.lastName || ''}
              </div>
              <div class="customer-detail">
                ${order.address?.street || ''}
              </div>
              <div class="customer-detail">
                ${order.address?.zipcode || ''} ${order.address?.city || ''}
              </div>
              <div class="customer-detail">
                ${order.address?.state || ''}, ${order.address?.country || 'France'}
              </div>
              <div class="customer-detail" style="margin-top: 12px; color: #667eea;">
                📞 ${order.address?.phone || ''}
              </div>
            </div>

            <!-- Customer Info -->
            <div class="section-title">Détails de contact</div>
            <div class="customer-section">
              <div class="customer-title">Votre profil</div>
              <div class="customer-detail" style="margin-bottom: 8px;">
                📧 ${user.email}
              </div>
              <div class="customer-detail">
                👤 ${user.name}
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p style="margin-bottom: 12px;">Vous recevrez une notification SMS et email lors de chaque mise à jour de votre commande.</p>
            <p>Des questions? <a href="mailto:support@foodapp.com">Contactez-nous</a> ou appelez <strong>support@foodapp.com</strong></p>
            <p style="margin-top: 15px; font-size: 11px; color: #95a5a6;">
              Cet email a été généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send receipt email
export const sendReceiptEmail = async (orderId) => {
  try {
    const order = await orderModel.findById(orderId);
    
    if (!order) {
      console.log("Order not found:", orderId);
      return;
    }

    const user = await userModel.findById(order.userId);

    if (!user || !user.email) {
      console.log("User email not found for order:", orderId);
      return;
    }

    // Get item details from order
    const itemsList = order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    }));

    const receiptHTML = generateReceiptHTML(order, user, itemsList);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Commande confirmée #${order._id.toString().slice(-8).toUpperCase()} - ${new Date().toLocaleDateString('fr-FR')}`,
      html: receiptHTML,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Receipt email sent to ${user.email} | Message ID: ${result.messageId}`);
    
    return result;
  } catch (error) {
    console.error("❌ Error sending receipt email:", error.message);
    throw error;
  }
};

export default sendReceiptEmail;