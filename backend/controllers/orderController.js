import Stripe from "stripe";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import promoCodeModel from "../models/promoCodeModel.js";
import { sendReceiptEmail } from "./recieptEmail.js";



const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// placing user order for frontend
// placing user order for frontend
const placeOrder = async (req, res) => {
  const success_url = "http://localhost:5173/cart"; // ✅ CHANGED: redirect to cart first
  const cancel_url = "http://localhost:5173/cart";

  try {
    const { userId, items, amount, address, promoCode } = req.body;

    const newOrder = new orderModel({
      userId,
      items,
      amount,
      address,
      promoCode: promoCode || null,
    });

    await newOrder.save();

    const line_items = [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: "Votre commande",
            description: promoCode
              ? `Code promo: ${promoCode}`
              : "Repas + Livraison",
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ];

    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${success_url}?success=true&orderId=${newOrder._id}`, // ✅ Now goes to /cart
      cancel_url: `${cancel_url}?canceled=true&orderId=${newOrder._id}`,
      metadata: {
        orderId: newOrder._id.toString(),
        userId,
      },
    });

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error", error: error.message });
  }
};


// Stripe webhook handler - SECURE payment verification
// Stripe webhook handler - SECURE payment verification
const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log(`❌ Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata.orderId;
    const userId = session.metadata.userId;
    const paymentStatus = session.payment_status;

    try {
      if (paymentStatus === "paid") {
        // Get order details
        const order = await orderModel.findById(orderId);
        
        if (!order) {
          console.error(`Order not found: ${orderId}`);
          return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Update order with payment confirmation
        const updatedOrder = await orderModel.findByIdAndUpdate(
          orderId,
          {
            payment: true,
            paymentId: session.id,
            paymentTimestamp: new Date(),
            status: 'En préparation' ,
          },
          { new: true }
        );

        // ✅ RECORD PROMO CODE USAGE IF PROMO WAS APPLIED
        if (order.promoCode) {
          try {
            const promoCode = await promoCodeModel.findOne({ 
              code: order.promoCode.toUpperCase() 
            });

            if (promoCode) {
              // Add usage record
              promoCode.usedBy.push({
                userId: userId,
                usedAt: new Date(),
                orderAmount: order.amount + order.discount, // Original amount before discount
                discountApplied: order.discount
              });

              promoCode.usedCount += 1;
              await promoCode.save();

              console.log(`✅ Promo code usage recorded: ${order.promoCode} | User: ${userId} | Discount: ${order.discount}€`);
            }
          } catch (promoError) {
            console.error(`⚠️ Error recording promo usage for ${order.promoCode}:`, promoError.message);
            // Don't fail the order if promo tracking fails
          }
        }

        // Clear user's cart after successful payment
        await userModel.findByIdAndUpdate(userId, { cartData: {} });

        // Send receipt email with error handling
        try {
          await sendReceiptEmail(orderId);
          console.log(`✅ Payment processed and receipt sent for order: ${orderId}`);
        } catch (emailError) {
          console.error(`⚠️ Order paid but email failed for ${orderId}:`, emailError.message);
          await orderModel.findByIdAndUpdate(orderId, {
            emailSentFailed: true,
          });
        }
      }
    } catch (error) {
      console.error(`❌ Error processing payment for order ${orderId}:`, error.message);
      return res.status(500).json({ success: false, message: "Error processing payment" });
    }
  }

  // Handle charge.failed event
  if (event.type === "charge.failed") {
    const charge = event.data.object;
    const orderId = charge.metadata?.orderId;

    console.log(`❌ Payment failed for order: ${orderId}`);

    try {
      await orderModel.findByIdAndUpdate(orderId, {
        status: "Payment Failed",
        payment: false,
      });
    } catch (error) {
      console.error(`Error updating failed order ${orderId}:`, error);
    }
  }

  // Handle charge.refunded event
  if (event.type === "charge.refunded") {
    const charge = event.data.object;
    const orderId = charge.metadata?.orderId;

    try {
      const order = await orderModel.findById(orderId);
      
      if (order && order.promoCode) {
        // Decrement promo usage on refund
        const promoCode = await promoCodeModel.findOne({ 
          code: order.promoCode.toUpperCase() 
        });

        if (promoCode && promoCode.usedCount > 0) {
          // Remove the usage record
          promoCode.usedBy = promoCode.usedBy.filter(
            u => u.userId.toString() !== charge.metadata.userId.toString() || 
                 u.usedAt.getTime() !== new Date(charge.created * 1000).getTime()
          );
          promoCode.usedCount -= 1;
          await promoCode.save();
          
          console.log(`✅ Promo usage reversed on refund: ${order.promoCode}`);
        }
      }

      await orderModel.findByIdAndUpdate(orderId, {
        payment: false,
        status: "Refunded",
      });
      console.log(`✅ Order refunded: ${orderId}`);
    } catch (error) {
      console.error(`Error refunding order ${orderId}:`, error);
    }
  }

  res.json({ success: true, received: true });
};



// Legacy verification - kept for backward compatibility but not secure
const verifyOrder = async (req, res) => {
  const { orderId, success } = req.body;
  try {
    if (success == "true") {
      // Note: This should ideally only be used as a fallback
      // The webhook is the primary verification method
      await orderModel.findByIdAndUpdate(orderId, { payment: true });
      res.json({ success: true, message: "Paid" });
    } else {
      // Don't delete - keep for admin review
      await orderModel.findByIdAndUpdate(orderId, { status: "Payment Failed" });
      res.json({ success: false, message: "Not Paid" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// user orders for frontend
const userOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({ userId: req.body.userId });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Listing orders for admin pannel
const listOrders = async (req, res) => {
  try {
    let userData = await userModel.findById(req.body.userId);
    if (userData && userData.role === "admin") {
      const orders = await orderModel.find({});
      res.json({ success: true, data: orders });
    } else {
      res.json({ success: false, message: "You are not admin" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// api for updating status
// Inside your updateStatus function, ADD THIS after updating order:

const updateStatus = async (req, res) => {
  try {
    let userData = await userModel.findById(req.body.userId);
    if (userData && userData.role === "admin") {
      const order = await orderModel.findByIdAndUpdate(
        req.body.orderId,
        { status: req.body.status },
        { new: true }
      );

      // ✅ SEND PUSH NOTIFICATION TO CUSTOMER
      try {
        await fetch(`${process.env.BACKEND_URL}/api/notifications/notify-order-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: order.userId.toString(),
            orderId: order._id.toString(),
            status: req.body.status,
            items: order.items
          })
        });
        console.log(`✅ Notification sent for order status change`);
      } catch (notificationError) {
        console.error('⚠️ Failed to send notification:', notificationError);
        // Don't fail the order update if notification fails
      }

      res.json({ success: true, message: "Status Updated Successfully" });
    } else {
      res.json({ success: false, message: "You are not an admin" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};
// Cancel order (admin only)
const cancelOrder = async (req, res) => {
  try {
    const { orderId, userId } = req.body;

    // Check if user is admin
    let userData = await userModel.findById(userId);
    if (userData && userData.role === "admin") {
      await orderModel.findByIdAndUpdate(orderId, { status: "Cancelled" });
      res.json({ success: true, message: "Order cancelled successfully" });
    } else {
      res.json({ success: false, message: "You are not an admin" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error cancelling order" });
  }
};
 const continuePayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.json({ success: false, message: "Commande introuvable" });
    }

    const line_items = [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: "Votre commande",
            description: order.promoCode
              ? `Code promo: ${order.promoCode}`
              : "Repas + Livraison",
          },
          unit_amount: Math.round(order.amount * 100),
        },
        quantity: 1,
      },
    ];

    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `http://localhost:5173/cart?success=true&orderId=${order._id}`,
      cancel_url: `http://localhost:5173/cart?canceled=true&orderId=${order._id}`,
      metadata: {
        orderId: order._id.toString(),
        userId: order.userId.toString(),
      },
    });

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Erreur Stripe", error: error.message });
  }
};


export { placeOrder, verifyOrder, userOrders, listOrders, updateStatus, cancelOrder, handleStripeWebhook,continuePayment };